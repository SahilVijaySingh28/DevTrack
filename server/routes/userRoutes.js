const express = require('express')
const { searchUsers, updateProfile } = require('../controllers/userController')
const { protect } = require('../middleware/authMiddleware')
const validateBody = require('../middleware/validateBody')
const { profileBody } = require('../validation/requestSchemas')

const router = express.Router()
router.use(protect)
router.get('/', searchUsers)
router.put('/profile', validateBody(profileBody), updateProfile)
module.exports = router
