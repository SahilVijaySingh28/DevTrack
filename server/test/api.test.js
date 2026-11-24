const assert = require('node:assert/strict')
const http = require('node:http')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const test = require('node:test')
const request = require('supertest')
const { io: socketClient } = require('socket.io-client')
const generateAccessToken = require('../utils/generateAccessToken')
const generateRefreshToken = require('../utils/generateRefreshToken')

process.env.JWT_ACCESS_SECRET = 'test-access-signing-secret-for-unit-tests-only'
process.env.JWT_REFRESH_SECRET = 'test-refresh-signing-secret-for-unit-tests-only'
process.env.JWT_ACCESS_EXPIRE = '15m'
process.env.JWT_REFRESH_EXPIRE = '10d'

const app = require('../server')
const Project = require('../models/Project')
const RefreshSession = require('../models/RefreshSession')
const Task = require('../models/Task')
const User = require('../models/User')
const { initSocket } = require('../utils/socket')
const { clearMemoryCache } = require('../utils/cache')
const { invalidateProjectMembership, isProjectMember } = require('../utils/projectMembership')
const { hashRefreshToken, rotateRefreshSession } = require('../utils/refreshSessions')
const { getTokenSecrets } = require('../utils/tokenConfig')
const { buildDemoProjects, buildDemoTasks, demoUsers, revokeDemoRefreshSessions } = require('../seed')

test('health endpoint responds successfully', async () => {
  const response = await request(app).get('/api/health')
  assert.equal(response.status, 200)
  assert.deepEqual(response.body, { success: true, message: 'DevTrack API is running' })
})

test('readiness endpoint reports an unavailable database', async () => {
  const response = await request(app).get('/api/ready')
  assert.equal(response.status, 503)
  assert.deepEqual(response.body, { success: false, database: 'unavailable' })
})

test('protected project route rejects missing authentication', async () => {
  const response = await request(app).get('/api/projects')
  assert.equal(response.status, 401)
  assert.equal(response.body.success, false)
})

test('protected activity route rejects missing authentication', async () => {
  const response = await request(app).get('/api/activity')
  assert.equal(response.status, 401)
  assert.equal(response.body.message, 'Authentication required')
})

test('protected task summary endpoints reject missing authentication', async () => {
  const summary = await request(app).get('/api/tasks/summary')
  const stats = await request(app).get('/api/tasks/stats')
  assert.equal(summary.status, 401)
  assert.equal(stats.status, 401)
})

test('protected routes reject an invalid JWT from the auth cookie', async () => {
  const response = await request(app)
    .get('/api/projects')
    .set('Cookie', 'devtrack_token=invalid')
  assert.equal(response.status, 401)
  assert.equal(response.body.message, 'Invalid or expired token')
})

test('logout clears both HttpOnly authentication cookies', async () => {
  const response = await request(app)
    .post('/api/auth/logout')
    .set('Origin', process.env.CLIENT_URL || 'http://localhost:5173')
  assert.equal(response.status, 200)
  assert.ok(response.headers['set-cookie'].some((cookie) => /devtrack_token=;/.test(cookie) && /HttpOnly/i.test(cookie)))
  assert.ok(response.headers['set-cookie'].some((cookie) => /devtrack_refresh=;/.test(cookie) && /HttpOnly/i.test(cookie)))
})

test('refresh endpoint rejects a missing refresh cookie and clears auth cookies', async () => {
  const response = await request(app)
    .post('/api/auth/refresh')
    .set('Origin', process.env.CLIENT_URL || 'http://localhost:5173')
  assert.equal(response.status, 401)
  assert.equal(response.body.message, 'Invalid or expired refresh token')
  assert.ok(response.headers['set-cookie'].some((cookie) => /devtrack_token=;/.test(cookie)))
  assert.ok(response.headers['set-cookie'].some((cookie) => /devtrack_refresh=;/.test(cookie)))
})

test('current-user endpoint returns a signed-out state without an authentication error', async () => {
  const response = await request(app).get('/api/auth/me')
  assert.equal(response.status, 200)
  assert.deepEqual(response.body, { success: true, user: null })
})

test('state-changing requests reject untrusted origins', async () => {
  const response = await request(app)
    .post('/api/auth/logout')
    .set('Origin', 'https://untrusted.example')
  assert.equal(response.status, 403)
  assert.equal(response.body.message, 'Untrusted request origin')
})

test('state-changing requests reject missing origins', async () => {
  const response = await request(app).post('/api/auth/logout')
  assert.equal(response.status, 403)
  assert.equal(response.body.message, 'Untrusted request origin')
})

test('registration validates required fields', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .set('Origin', process.env.CLIENT_URL || 'http://localhost:5173')
    .send({ email: 'missing@example.com' })
  assert.equal(response.status, 400)
  assert.equal(response.body.message, 'Name, email, and password are required')
})

test('unknown routes return the standard not-found response', async () => {
  const response = await request(app).get('/api/does-not-exist')
  assert.equal(response.status, 404)
  assert.equal(response.body.success, false)
})

test('project owner is normalized to the Admin role', async () => {
  const owner = '507f1f77bcf86cd799439011'
  const project = new Project({ title: 'Role test', owner, members: [owner, owner] })
  await project.validate()
  assert.equal(project.members.length, 1)
  assert.equal(project.memberRoles.length, 1)
  assert.equal(project.memberRoles[0].role, 'Admin')
})

test('demo seed builds five shared users, ten projects, and fifteen tasks per user', async () => {
  const users = demoUsers.map((user, index) => ({
    ...user,
    _id: `507f1f77bcf86cd79943901${index}`,
  }))
  const projects = buildDemoProjects(users).map((project, index) => ({
    ...project,
    _id: `607f1f77bcf86cd79943901${index}`,
  }))
  const tasks = buildDemoTasks(users, projects)

  assert.equal(users.length, 5)
  assert.equal(projects.length, 10)
  assert.equal(tasks.length, 75)
  assert.ok(projects.every((project) => project.members.length === users.length))
  assert.deepEqual(
    users.map((user) => projects.filter((project) => String(project.owner) === String(user._id)).length),
    [2, 2, 2, 2, 2],
  )
  assert.deepEqual(
    users.map((user) => tasks.filter((task) => String(task.createdBy) === String(user._id)).length),
    [15, 15, 15, 15, 15],
  )
  await Promise.all(projects.map((project) => new Project(project).validate()))
  await Promise.all(tasks.map((task) => new Task(task).validate()))
})

test('demo seed revokes refresh sessions only for seeded demo users', async () => {
  const originalDeleteMany = RefreshSession.deleteMany
  const userIds = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']
  let filter
  RefreshSession.deleteMany = async (value) => {
    filter = value
  }

  try {
    await revokeDemoRefreshSessions(userIds)
    assert.deepEqual(filter, { user: { $in: userIds } })
  } finally {
    RefreshSession.deleteMany = originalDeleteMany
  }
})

test('task attachments reject inline base64 payloads', async () => {
  const task = new Task({
    title: 'Attachment validation',
    project: '507f1f77bcf86cd799439011',
    createdBy: '507f1f77bcf86cd799439012',
    attachments: [{ name: 'inline image', url: 'data:image/png;base64,AAAA' }],
  })
  await assert.rejects(task.validate(), (error) => (
    error.name === 'ValidationError' && Boolean(error.errors['attachments.0.url'])
  ))
})

test('Socket.IO rejects connections without valid session cookies', async () => {
  const httpServer = http.createServer()
  const socketServer = initSocket(httpServer)
  await new Promise((resolve, reject) => {
    httpServer.once('error', reject)
    httpServer.listen(0, resolve)
  })

  try {
    const address = httpServer.address()
    for (const headers of [{}, { Cookie: 'devtrack_token=invalid' }]) {
      const client = socketClient(`http://127.0.0.1:${address.port}`, {
        autoConnect: false,
        reconnection: false,
        transports: ['websocket'],
        extraHeaders: headers,
      })
      const connectionError = new Promise((resolve) => client.once('connect_error', resolve))
      client.connect()
      const error = await connectionError
      assert.ok(error instanceof Error)
      client.close()
    }
  } finally {
    await new Promise((resolve) => socketServer.close(resolve))
  }
})

test('Socket.IO disconnects clients when their access token expires', async () => {
  clearMemoryCache()
  const originalFindById = User.findById
  const userId = '507f1f77bcf86cd799439011'
  User.findById = () => ({
    select() { return this },
    lean: async () => ({ _id: userId }),
  })

  const token = jwt.sign(
    { userId, tokenUse: 'access' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '2s' },
  )
  const httpServer = http.createServer()
  const socketServer = initSocket(httpServer)
  let client

  try {
    await new Promise((resolve, reject) => {
      httpServer.once('error', reject)
      httpServer.listen(0, resolve)
    })

    const address = httpServer.address()
    client = socketClient(`http://127.0.0.1:${address.port}`, {
      autoConnect: false,
      reconnection: false,
      transports: ['websocket'],
      extraHeaders: { Cookie: `devtrack_token=${token}` },
    })
    const expired = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Socket access token did not expire')), 5000)
      client.once('access_token_expired', () => {
        clearTimeout(timeout)
        resolve()
      })
    })
    const disconnected = new Promise((resolve) => client.once('disconnect', resolve))

    client.connect()
    await expired
    await disconnected
  } finally {
    if (client) client.close()
    User.findById = originalFindById
    clearMemoryCache()
    await new Promise((resolve) => socketServer.close(resolve))
  }
})

test('project membership checks are cached and invalidated after membership changes', async () => {
  clearMemoryCache()
  const originalExists = Project.exists
  let existsCalls = 0
  let membershipExists = true
  Project.exists = async () => {
    existsCalls += 1
    return membershipExists ? { _id: '507f1f77bcf86cd799439013' } : null
  }

  try {
    const projectId = '507f1f77bcf86cd799439013'
    const userId = '507f1f77bcf86cd799439014'
    assert.equal(await isProjectMember(projectId, userId), true)
    assert.equal(await isProjectMember(projectId, userId), true)
    assert.equal(existsCalls, 1)

    membershipExists = false
    await invalidateProjectMembership(projectId, userId)
    assert.equal(await isProjectMember(projectId, userId), false)
    assert.equal(existsCalls, 2)
  } finally {
    Project.exists = originalExists
    clearMemoryCache()
  }
})

test('refresh token rotation stores only the replacement token hash', async () => {
  const originals = {
    transaction: mongoose.connection.transaction,
    findOneAndUpdate: RefreshSession.findOneAndUpdate,
    create: RefreshSession.create,
    findById: User.findById,
  }
  const user = { _id: '507f1f77bcf86cd799439011', name: 'Test User' }
  const oldToken = generateRefreshToken(user._id)
  const activeSession = {
    user: user._id,
    familyId: 'session-family',
    revokedAt: null,
  }
  let insertedSessions

  mongoose.connection.transaction = async (operation) => operation({})
  RefreshSession.findOneAndUpdate = async (filter, update) => {
    assert.equal(filter.tokenHash, hashRefreshToken(oldToken))
    assert.equal(filter.revokedAt, null)
    const previousSession = { ...activeSession }
    activeSession.revokedAt = update.$set.revokedAt
    return previousSession
  }
  RefreshSession.create = async (sessions) => {
    insertedSessions = sessions
    return sessions
  }
  User.findById = () => ({
    select() { return this },
    session() { return this },
    lean: async () => user,
  })

  try {
    const rotated = await rotateRefreshSession(oldToken)
    assert.equal(rotated.user, user)
    assert.notEqual(rotated.token, oldToken)
    assert.equal(activeSession.revokedAt instanceof Date, true)
    assert.equal(insertedSessions.length, 1)
    assert.equal(insertedSessions[0].tokenHash, hashRefreshToken(rotated.token))
    assert.notEqual(insertedSessions[0].tokenHash, rotated.token)
  } finally {
    mongoose.connection.transaction = originals.transaction
    RefreshSession.findOneAndUpdate = originals.findOneAndUpdate
    RefreshSession.create = originals.create
    User.findById = originals.findById
  }
})

test('reuse of a rotated refresh token revokes its remaining session family', async () => {
  const originals = {
    transaction: mongoose.connection.transaction,
    findOneAndUpdate: RefreshSession.findOneAndUpdate,
    findOne: RefreshSession.findOne,
    updateMany: RefreshSession.updateMany,
  }
  const previousSession = { familyId: 'reused-family', revokedAt: new Date() }
  const reusedToken = generateRefreshToken('507f1f77bcf86cd799439011')
  let revokedFamily

  mongoose.connection.transaction = async (operation) => operation({})
  RefreshSession.findOneAndUpdate = async () => null
  RefreshSession.findOne = () => ({ session: async () => previousSession })
  RefreshSession.updateMany = async (filter) => {
    revokedFamily = filter.familyId
  }

  try {
    assert.equal(await rotateRefreshSession(reusedToken), null)
    assert.equal(revokedFamily, 'reused-family')
  } finally {
    mongoose.connection.transaction = originals.transaction
    RefreshSession.findOneAndUpdate = originals.findOneAndUpdate
    RefreshSession.findOne = originals.findOne
    RefreshSession.updateMany = originals.updateMany
  }
})

test('access and refresh JWTs use separate secrets and configured expiries', () => {
  const userId = '507f1f77bcf86cd799439011'
  const accessToken = generateAccessToken(userId)
  const refreshToken = generateRefreshToken(userId)
  const accessClaims = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET)
  const refreshClaims = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)

  assert.equal(accessClaims.tokenUse, 'access')
  assert.equal(accessClaims.exp - accessClaims.iat, 15 * 60)
  assert.equal(refreshClaims.tokenUse, 'refresh')
  assert.equal(refreshClaims.exp - refreshClaims.iat, 10 * 24 * 60 * 60)
  assert.throws(() => jwt.verify(accessToken, process.env.JWT_REFRESH_SECRET))
  assert.throws(() => jwt.verify(refreshToken, process.env.JWT_ACCESS_SECRET))
})

test('token configuration rejects weak or shared signing secrets', () => {
  const originalAccessSecret = process.env.JWT_ACCESS_SECRET
  const originalRefreshSecret = process.env.JWT_REFRESH_SECRET
  try {
    process.env.JWT_ACCESS_SECRET = 'short'
    assert.throws(() => getTokenSecrets(), /JWT_ACCESS_SECRET/)

    process.env.JWT_ACCESS_SECRET = originalAccessSecret
    process.env.JWT_REFRESH_SECRET = originalAccessSecret
    assert.throws(() => getTokenSecrets(), /must be different/)
  } finally {
    process.env.JWT_ACCESS_SECRET = originalAccessSecret
    process.env.JWT_REFRESH_SECRET = originalRefreshSecret
  }
})