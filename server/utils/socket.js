const { Server } = require('socket.io')

let io = null

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  })

  io.on('connection', (socket) => {
    socket.on('join_project', (projectId) => {
      if (projectId) socket.join(`project_${projectId}`)
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

const emitEvent = (event, data, room = null) => {
  if (!io) return
  if (room) {
    io.to(room).emit(event, data)
  } else {
    io.emit(event, data)
  }
}

module.exports = { initSocket, getIO, emitEvent }
