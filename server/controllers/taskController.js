const mongoose = require('mongoose')
const Project = require('../models/Project')
const Task = require('../models/Task')
const recordActivity = require('../utils/recordActivity')
const { emitEvent } = require('../utils/socket')

const taskQuery = (filter) => Task.find(filter).populate('project', 'title status').populate('assignedTo', 'name email avatar').populate('createdBy', 'name email avatar').sort('-updatedAt')
const canAccess = (project, userId) => project.members.some((member) => member.equals(userId))

const getTasks = async (request, response, next) => {
  try {
    const filter = {}
    if (request.query.project) filter.project = request.query.project
    if (request.query.status) filter.status = request.query.status
    if (request.query.priority) filter.priority = request.query.priority
    if (request.query.search) filter.title = { $regex: request.query.search, $options: 'i' }

    const projects = await Project.find({ members: request.user._id }).select('_id')
    const projectIds = projects.map((project) => String(project._id))
    if (filter.project && !projectIds.includes(String(filter.project))) {
      return response.json({ success: true, tasks: [] })
    }
    filter.project = filter.project || { $in: projects.map((project) => project._id) }
    const tasks = await taskQuery(filter)
    response.json({ success: true, tasks })
  } catch (error) { next(error) }
}

const getTask = async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: 'Invalid task ID' })
    const task = await Task.findById(request.params.id).populate('project')
    if (!task) return response.status(404).json({ success: false, message: 'Task not found' })
    if (!canAccess(task.project, request.user._id)) return response.status(403).json({ success: false, message: 'Project membership required' })
    response.json({ success: true, task })
  } catch (error) { next(error) }
}

const createTask = async (request, response, next) => {
  try {
    const { title, description, project, assignedTo, status, priority, dueDate, attachments } = request.body
    if (!mongoose.isValidObjectId(project)) return response.status(400).json({ success: false, message: 'Valid project ID is required' })
    const projectRecord = await Project.findOne({ _id: project, members: request.user._id })
    if (!projectRecord) return response.status(403).json({ success: false, message: 'Project membership required' })
    if (assignedTo && (!mongoose.isValidObjectId(assignedTo) || !projectRecord.members.some((member) => member.equals(assignedTo)))) return response.status(400).json({ success: false, message: 'Assigned user must be a project member' })
    const task = await Task.create({ title, description, project, assignedTo, status, priority, dueDate, attachments: attachments || [], createdBy: request.user._id })
    await recordActivity({ user: request.user._id, project: projectRecord._id, task: task._id, type: 'task_created', message: `Created task "${task.title}"` })
    const populatedTask = (await taskQuery({ _id: task._id }))[0]
    emitEvent('task_created', populatedTask)
    response.status(201).json({ success: true, task: populatedTask })
  } catch (error) { next(error) }
}

const updateTask = async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: 'Invalid task ID' })
    const task = await Task.findById(request.params.id).populate('project')
    if (!task) return response.status(404).json({ success: false, message: 'Task not found' })
    if (!canAccess(task.project, request.user._id)) return response.status(403).json({ success: false, message: 'Project membership required' })
    const allowedFields = ['title', 'description', 'assignedTo', 'status', 'priority', 'dueDate', 'attachments']
    if (request.body.assignedTo && (!mongoose.isValidObjectId(request.body.assignedTo) || !task.project.members.some((member) => member.equals(request.body.assignedTo)))) return response.status(400).json({ success: false, message: 'Assigned user must be a project member' })
    allowedFields.forEach((field) => { if (request.body[field] !== undefined) task[field] = request.body[field] })
    await task.save()
    await recordActivity({ user: request.user._id, project: task.project._id, task: task._id, type: 'task_updated', message: `Updated task "${task.title}"` })
    const populatedTask = (await taskQuery({ _id: task._id }))[0]
    emitEvent('task_updated', populatedTask)
    response.json({ success: true, task: populatedTask })
  } catch (error) { next(error) }
}

const deleteTask = async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: 'Invalid task ID' })
    const task = await Task.findById(request.params.id).populate('project')
    if (!task) return response.status(404).json({ success: false, message: 'Task not found' })
    if (!canAccess(task.project, request.user._id)) return response.status(403).json({ success: false, message: 'Project membership required' })
    await task.deleteOne()
    await recordActivity({ user: request.user._id, project: task.project._id, task: task._id, type: 'task_deleted', message: `Deleted task "${task.title}"` })
    emitEvent('task_deleted', { taskId: task._id, projectId: task.project._id })
    response.json({ success: true, message: 'Task deleted' })
  } catch (error) { next(error) }
}

module.exports = { createTask, deleteTask, getTask, getTasks, updateTask }
