const express = require('express')
const { getCurrentUser, login, logout, refresh, register } = require('../controllers/authController')
const validateBody = require('../middleware/validateBody')
const { loginRateLimit, refreshRateLimit, registerRateLimit } = require('../middleware/authRateLimit')
const { loginBody, registerBody } = require('../validation/requestSchemas')

const router = express.Router()

router.post('/register', registerRateLimit, validateBody(registerBody), register)
router.post('/login', loginRateLimit, validateBody(loginBody), login)
router.post('/refresh', refreshRateLimit, refresh)
router.post('/logout', logout)
router.get('/me', getCurrentUser)

module.exports = router
