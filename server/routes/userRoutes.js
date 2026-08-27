const express = require('express')
const { searchUsers, updateProfile } = require('../controllers/userController')
const { protect } = require('../middleware/authMiddleware')

const router = express.Router()
router.use(protect)
router.get('/', searchUsers)
router.put('/profile', updateProfile)
module.exports = router
