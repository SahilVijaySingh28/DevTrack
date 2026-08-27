const assert = require('node:assert/strict')
const test = require('node:test')
const request = require('supertest')
const app = require('../server')

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