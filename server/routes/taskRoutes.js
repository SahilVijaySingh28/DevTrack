const express = require('express')
const { createTask, deleteTask, getTask, getTasks, getTaskStats, getTaskSummary, updateTask } = require('../controllers/taskController')
const { protect } = require('../middleware/authMiddleware')
const validateBody = require('../middleware/validateBody')
const { taskCreateBody, taskUpdateBody } = require('../validation/requestSchemas')

const router = express.Router()
router.use(protect)
router.get('/summary', getTaskSummary)
router.get('/stats', getTaskStats)
router.route('/').get(getTasks).post(validateBody(taskCreateBody), createTask)
router.route('/:id').get(getTask).put(validateBody(taskUpdateBody), updateTask).delete(deleteTask)
module.exports = router
