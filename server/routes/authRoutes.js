const express = require('express')
const { getCurrentUser, login, logout, refresh, register } = require('../controllers/authController')

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.get('/me', getCurrentUser)

module.exports = router
