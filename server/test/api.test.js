const assert = require('node:assert/strict')
const http = require('node:http')
const test = require('node:test')
const request = require('supertest')
const { io: socketClient } = require('socket.io-client')
const app = require('../server')
const Project = require('../models/Project')
const Task = require('../models/Task')
const { initSocket } = require('../utils/socket')
const { clearMemoryCache } = require('../utils/cache')
const { invalidateProjectMembership, isProjectMember } = require('../utils/projectMembership')
const { buildDemoProjects, buildDemoTasks, demoUsers } = require('../seed')

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

test('logout clears the HttpOnly auth cookie', async () => {
  const response = await request(app)
    .post('/api/auth/logout')
    .set('Origin', process.env.CLIENT_URL || 'http://localhost:5173')
  assert.equal(response.status, 200)
  assert.match(response.headers['set-cookie'][0], /devtrack_token=;/)
  assert.match(response.headers['set-cookie'][0], /HttpOnly/i)
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