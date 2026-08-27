const assert = require('node:assert/strict')
const test = require('node:test')
const request = require('supertest')
const app = require('../server')
const Project = require('../models/Project')

test('health endpoint responds successfully', async () => {
  const response = await request(app).get('/api/health')
  assert.equal(response.status, 200)
  assert.deepEqual(response.body, { success: true, message: 'DevTrack API is running' })
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

test('registration validates required fields', async () => {
  const response = await request(app).post('/api/auth/register').send({ email: 'missing@example.com' })
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