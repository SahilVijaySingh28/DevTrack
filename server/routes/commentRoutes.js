const express = require('express')
const { createComment, getComments } = require('../controllers/commentController')
const { protect } = require('../middleware/authMiddleware')
const validateBody = require('../middleware/validateBody')
const { commentBody } = require('../validation/requestSchemas')

const router = express.Router({ mergeParams: true })
router.use(protect)
router.route('/').get(getComments).post(validateBody(commentBody), createComment)
module.exports = router
