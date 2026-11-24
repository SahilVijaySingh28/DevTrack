const { Server } = require('socket.io')
const { createAdapter } = require('@socket.io/redis-adapter')
const { createClient } = require('redis')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { setRedisCacheClient } = require('./cache')
const getCachedUser = require('./cachedUser')
const { isProjectMember } = require('./projectMembership')
const { getAccessTokenSecret } = require('./tokenConfig')

let io = null
let redisClients = []

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  })

  io.use(async (socket, next) => {
    try {
      const cookie = socket.handshake.headers.cookie
        ?.split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith('devtrack_token='))
      const token = cookie ? decodeURIComponent(cookie.slice('devtrack_token='.length)) : null
      if (!token) throw new Error('Authentication required')

      const decoded = jwt.verify(token, getAccessTokenSecret())
      if (decoded.tokenUse !== 'access' || typeof decoded.userId !== 'string' || typeof decoded.exp !== 'number') {
        throw new Error('Invalid access token')
      }
      const user = await getCachedUser(decoded.userId)
      if (!user) throw new Error('User no longer exists')

      socket.data.userId = String(user._id)
      socket.data.accessTokenExpiresAt = decoded.exp * 1000
      next()
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        const expiredError = new Error('Access token expired')
        expiredError.data = { code: 'ACCESS_TOKEN_EXPIRED' }
        return next(expiredError)
      }
      next(error)
    }
  })

  io.on('connection', (socket) => {
    socket.join(`user_${socket.data.userId}`)

    let expiryTimer
    const expireSocket = () => {
      const remainingMs = socket.data.accessTokenExpiresAt - Date.now()
      if (remainingMs > 0) {
        expiryTimer = setTimeout(expireSocket, Math.min(remainingMs, 2147483647))
        return
      }

      socket.emit('access_token_expired')
      socket.disconnect(true)
    }
    socket.once('disconnect', () => clearTimeout(expiryTimer))
    expireSocket()

    socket.on('join_project', async (projectId) => {
      if (!mongoose.isValidObjectId(projectId)) {
        socket.emit('socket_error', { message: 'Invalid project ID' })
        return
      }

      try {
        const isMember = await isProjectMember(projectId, socket.data.userId)
        if (!isMember) {
          socket.emit('socket_error', { message: 'Project membership required' })
          return
        }

        socket.join(`project_${projectId}`)
      } catch (error) {
        process.stderr.write(`Socket project authorization failed: ${error.message}\n`)
        socket.emit('socket_error', { message: 'Unable to join project updates' })
      }
    })

    socket.on('leave_project', (projectId) => {
      if (projectId) socket.leave(`project_${projectId}`)
    })
  })

  return io
}

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!')
  }
  return io
}

const connectSocketAdapter = async () => {
  if (!process.env.REDIS_URL) return
  if (!io) throw new Error('Socket.io is not initialized')

  const publisher = createClient({ url: process.env.REDIS_URL })
  const subscriber = publisher.duplicate()
  for (const client of [publisher, subscriber]) {
    client.on('error', (error) => {
      process.stderr.write(`Socket Redis connection error: ${error.message}\n`)
    })
  }

  try {
    await Promise.all([publisher.connect(), subscriber.connect()])
  } catch (error) {
    publisher.destroy()
    subscriber.destroy()
    throw error
  }

  redisClients = [publisher, subscriber]
  setRedisCacheClient(publisher)
  io.adapter(createAdapter(publisher, subscriber))
}

const closeSocketAdapter = async () => {
  const clients = redisClients
  redisClients = []
  setRedisCacheClient(null)
  const results = await Promise.allSettled(clients.map((client) => client.quit()))
  for (const result of results) {
    if (result.status === 'rejected') {
      process.stderr.write(`Socket Redis shutdown error: ${result.reason.message}\n`)
    }
  }
}

const emitEvent = (event, projectId, data) => {
  if (!io) return
  io.to(`project_${projectId}`).emit(event, data)
}

const revokeProjectRoom = async (projectId, userId) => {
  if (!io) return
  const room = `project_${projectId}`
  const sockets = userId === undefined ? io.in(room) : io.in(`user_${userId}`)
  await sockets.socketsLeave(room)
}

module.exports = { initSocket, getIO, connectSocketAdapter, closeSocketAdapter, emitEvent, revokeProjectRoom }
