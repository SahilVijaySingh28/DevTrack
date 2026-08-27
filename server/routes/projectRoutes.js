const express = require('express')
const { protect } = require('../middleware/authMiddleware')
const { addMember, createProject, deleteProject, getProject, getProjects, removeMember, updateProject } = require('../controllers/projectController')

const router = express.Router()
router.use(protect)
router.route('/').get(getProjects).post(createProject)
router.route('/:id').get(getProject).put(updateProject).delete(deleteProject)
router.post('/:id/members', addMember)
router.delete('/:id/members/:userId', removeMember)
module.exports = router
