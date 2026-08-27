const express = require('express')
const { createComment, getComments } = require('../controllers/commentController')
const { protect } = require('../middleware/authMiddleware')

const router = express.Router({ mergeParams: true })
router.use(protect)
router.route('/').get(getComments).post(createComment)
module.exports = router
