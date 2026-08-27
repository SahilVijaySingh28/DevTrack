const express = require('express')
const { createTask, deleteTask, getTask, getTasks, updateTask } = require('../controllers/taskController')
const { protect } = require('../middleware/authMiddleware')

const router = express.Router()
router.use(protect)
router.route('/').get(getTasks).post(createTask)
router.route('/:id').get(getTask).put(updateTask).delete(deleteTask)
module.exports = router
