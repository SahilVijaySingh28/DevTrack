const express = require('express')
const { protect } = require('../middleware/authMiddleware')
const { addMember, createProject, deleteProject, getProject, getProjects, removeMember, updateMemberRole, updateProject } = require('../controllers/projectController')

const router = express.Router()
router.use(protect)
router.route('/').get(getProjects).post(createProject)
router.route('/:id').get(getProject).put(updateProject).delete(deleteProject)
router.post('/:id/members', addMember)
router.delete('/:id/members/:userId', removeMember)
router.put('/:id/members/:userId/role', updateMemberRole)
module.exports = router
