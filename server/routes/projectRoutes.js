const express = require('express')
const { protect } = require('../middleware/authMiddleware')
const { addMember, createProject, deleteProject, getProject, getProjects, removeMember, updateMemberRole, updateProject } = require('../controllers/projectController')
const validateBody = require('../middleware/validateBody')
const { addMemberBody, projectCreateBody, projectUpdateBody, updateMemberRoleBody } = require('../validation/requestSchemas')

const router = express.Router()
router.use(protect)
router.route('/').get(getProjects).post(validateBody(projectCreateBody), createProject)
router.route('/:id').get(getProject).put(validateBody(projectUpdateBody), updateProject).delete(deleteProject)
router.post('/:id/members', validateBody(addMemberBody), addMember)
router.delete('/:id/members/:userId', removeMember)
router.put('/:id/members/:userId/role', validateBody(updateMemberRoleBody), updateMemberRole)
module.exports = router
