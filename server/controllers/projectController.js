const mongoose = require('mongoose')
const Project = require('../models/Project')
const Task = require('../models/Task')
const Comment = require('../models/Comment')
const Activity = require('../models/Activity')
const User = require('../models/User')
const recordActivity = require('../utils/recordActivity')
const runTransaction = require('../utils/runTransaction')
const { emitEvent, revokeProjectRoom } = require('../utils/socket')
const { canManageProject } = require('../utils/projectAccess')
const { invalidateProjectMembership } = require('../utils/projectMembership')

const projectQuery = (id) => Project.findById(id).populate('owner', 'name email avatar').populate('members', 'name email avatar').populate('memberRoles.user', 'name email avatar')
const isMember = (project, userId) => project.members.some((member) => member._id.equals(userId))
const isOwner = (project, userId) => project.owner._id.equals(userId)

const getProjects = async (request, response, next) => {
  try {
    const page = Number(request.query.page || 1)
    const limit = Number(request.query.limit || 50)
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return response.status(400).json({ success: false, message: 'Page must be positive and limit must be between 1 and 100' })
    }
    const filter = { members: request.user._id }
    const [projects, total] = await Promise.all([
      Project.find(filter).populate('owner', 'name email avatar').populate('members', 'name email avatar').populate('memberRoles.user', 'name email avatar').sort({ updatedAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
      Project.countDocuments(filter),
    ])
    response.json({ success: true, projects, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error) { next(error) }
}

const getProject = async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: 'Invalid project ID' })
    const project = await projectQuery(request.params.id)
    if (!project) return response.status(404).json({ success: false, message: 'Project not found' })
    if (!isMember(project, request.user._id)) return response.status(403).json({ success: false, message: 'Project membership required' })
    response.json({ success: true, project })
  } catch (error) { next(error) }
}

const createProject = async (request, response, next) => {
  try {
    const { title, description, status } = request.body
    const result = await runTransaction(async (session) => {
      const [project] = await Project.create([{ title, description, status, owner: request.user._id, members: [request.user._id] }], { session })
      const activity = await recordActivity({ user: request.user._id, project: project._id, type: 'project_created', message: `Created project "${project.title}"`, session })
      return { projectId: project._id, activity }
    })
    emitEvent('activity_created', result.projectId, result.activity)
    response.status(201).json({ success: true, project: await projectQuery(result.projectId) })
  } catch (error) { next(error) }
}

const updateProject = async (request, response, next) => {
  try {
    const project = await projectQuery(request.params.id)
    if (!project) return response.status(404).json({ success: false, message: 'Project not found' })
    if (!canManageProject(project, request.user._id)) return response.status(403).json({ success: false, message: 'Admin or Manager role required' })
    const { title, description, status } = request.body
    Object.assign(project, { title, description, status })
    const activity = await runTransaction(async (session) => {
      await project.save({ session })
      return recordActivity({ user: request.user._id, project: project._id, type: 'project_updated', message: `Updated project "${project.title}"`, session })
    })
    emitEvent('activity_created', project._id, activity)
    response.json({ success: true, project: await projectQuery(project._id) })
  } catch (error) { next(error) }
}

const deleteProject = async (request, response, next) => {
  try {
    const project = await projectQuery(request.params.id)
    if (!project) return response.status(404).json({ success: false, message: 'Project not found' })
    if (!isOwner(project, request.user._id)) return response.status(403).json({ success: false, message: 'Only the project owner can delete it' })
    const memberIds = project.members.map((member) => member._id)
    await runTransaction(async (session) => {
      const tasks = await Task.find({ project: project._id }).select('_id').session(session)
      const taskIds = tasks.map((task) => task._id)
      await Comment.deleteMany({ task: { $in: taskIds } }, { session })
      await Task.deleteMany({ project: project._id }, { session })
      await Activity.deleteMany({ project: project._id }, { session })
      await Project.deleteOne({ _id: project._id }, { session })
    })
    await Promise.all(memberIds.map((memberId) => invalidateProjectMembership(project._id, memberId)))
    await revokeProjectRoom(project._id)
    response.json({ success: true, message: 'Project deleted' })
  } catch (error) { next(error) }
}

const addMember = async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id) || !mongoose.isValidObjectId(request.body.userId)) return response.status(400).json({ success: false, message: 'Valid project and user IDs are required' })
    const project = await projectQuery(request.params.id)
    if (!project) return response.status(404).json({ success: false, message: 'Project not found' })
    if (!canManageProject(project, request.user._id)) return response.status(403).json({ success: false, message: 'Admin or Manager role required' })
    const member = await User.findById(request.body.userId)
    if (!member) return response.status(404).json({ success: false, message: 'User not found' })
    if (!project.members.some((item) => String(item._id || item) === String(member._id))) project.members.push(member._id)
    const activity = await runTransaction(async (session) => {
      await project.save({ session })
      return recordActivity({ user: request.user._id, project: project._id, type: 'member_added', message: `Added ${member.name} to "${project.title}"`, session })
    })
    await invalidateProjectMembership(project._id, member._id)
    emitEvent('activity_created', project._id, activity)
    response.json({ success: true, project: await projectQuery(project._id) })
  } catch (error) { next(error) }
}

const removeMember = async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id) || !mongoose.isValidObjectId(request.params.userId)) return response.status(400).json({ success: false, message: 'Valid project and user IDs are required' })
    const project = await projectQuery(request.params.id)
    if (!project) return response.status(404).json({ success: false, message: 'Project not found' })
    if (!canManageProject(project, request.user._id)) return response.status(403).json({ success: false, message: 'Admin or Manager role required' })
    if (String(project.owner._id) === request.params.userId) return response.status(400).json({ success: false, message: 'The project owner cannot be removed' })
    project.members = project.members.filter((member) => String(member._id) !== request.params.userId)
    const activity = await runTransaction(async (session) => {
      await project.save({ session })
      return recordActivity({ user: request.user._id, project: project._id, type: 'member_removed', message: `Removed a member from "${project.title}"`, session })
    })
    await invalidateProjectMembership(project._id, request.params.userId)
    await revokeProjectRoom(project._id, request.params.userId)
    emitEvent('activity_created', project._id, activity)
    response.json({ success: true, project: await projectQuery(project._id) })
  } catch (error) { next(error) }
}

const updateMemberRole = async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id) || !mongoose.isValidObjectId(request.params.userId)) return response.status(400).json({ success: false, message: 'Valid project and user IDs are required' })
    const project = await projectQuery(request.params.id)
    if (!project) return response.status(404).json({ success: false, message: 'Project not found' })
    if (!isOwner(project, request.user._id)) return response.status(403).json({ success: false, message: 'Only the project owner can change roles' })
    if (!['Admin', 'Manager', 'Member'].includes(request.body.role)) return response.status(400).json({ success: false, message: 'Invalid member role' })
    if (String(project.owner._id) === request.params.userId && request.body.role !== 'Admin') return response.status(400).json({ success: false, message: 'The project owner must remain an Admin' })
    const roleEntry = project.memberRoles.find((entry) => String(entry.user._id || entry.user) === request.params.userId)
    if (!roleEntry) return response.status(404).json({ success: false, message: 'Project member not found' })
    roleEntry.role = request.body.role
    await project.save()
    response.json({ success: true, project: await projectQuery(project._id) })
  } catch (error) { next(error) }
}

module.exports = { addMember, createProject, deleteProject, getProject, getProjects, removeMember, updateMemberRole, updateProject }
