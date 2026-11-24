const mongoose = require('mongoose')
const Project = require('../models/Project')
const Task = require('../models/Task')
const recordActivity = require('../utils/recordActivity')
const runTransaction = require('../utils/runTransaction')
const { emitEvent } = require('../utils/socket')
const Comment = require('../models/Comment')
const { isProjectMember } = require('../utils/projectMembership')

const taskQuery = (filter) => Task.find(filter).populate('project', 'title status').populate('assignedTo', 'name email avatar').populate('createdBy', 'name email avatar').sort({ updatedAt: -1, _id: -1 })
const defaultLimit = 50
const maximumLimit = 100
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getTasks = async (request, response, next) => {
  try {
    const page = Number(request.query.page || 1)
    const limit = Number(request.query.limit || defaultLimit)
    const search = request.query.search
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > maximumLimit) {
      return response.status(400).json({ success: false, message: `Page must be positive and limit must be between 1 and ${maximumLimit}` })
    }
    if (search !== undefined && (typeof search !== 'string' || search.length > 100)) {
      return response.status(400).json({ success: false, message: 'Search must be a string of at most 100 characters' })
    }
    if (request.query.project !== undefined && (typeof request.query.project !== 'string' || !mongoose.isValidObjectId(request.query.project))) {
      return response.status(400).json({ success: false, message: 'Invalid project ID' })
    }
    const status = request.query.status || undefined
    const priority = request.query.priority || undefined
    if (status !== undefined && !['Todo', 'In Progress', 'Completed'].includes(status)) {
      return response.status(400).json({ success: false, message: 'Invalid task status' })
    }
    if (priority !== undefined && !['Low', 'Medium', 'High'].includes(priority)) {
      return response.status(400).json({ success: false, message: 'Invalid task priority' })
    }

    const filter = {}
    if (request.query.project) filter.project = request.query.project
    if (status) filter.status = status
    if (priority) filter.priority = priority
    if (search?.trim()) filter.title = { $regex: escapeRegex(search.trim()), $options: 'i' }

    const projects = await Project.find({ members: request.user._id }).select('_id')
    const projectIds = projects.map((project) => String(project._id))
    if (filter.project && !projectIds.includes(String(filter.project))) {
      return response.json({ success: true, tasks: [], pagination: { page, limit, total: 0, pages: 0 } })
    }
    filter.project = filter.project || { $in: projects.map((project) => project._id) }
    const tasksQuery = taskQuery(filter).skip((page - 1) * limit).limit(limit)
    const countQuery = Task.countDocuments(filter)
    if (search?.trim()) {
      tasksQuery.maxTimeMS(2000)
      countQuery.maxTimeMS(2000)
    }
    const [tasks, total] = await Promise.all([tasksQuery, countQuery])
    response.json({ success: true, tasks, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error) { next(error) }
}

const getTaskStats = async (request, response, next) => {
  try {
    const projects = await Project.find({ members: request.user._id }).select('_id')
    const stats = await Task.aggregate([
      { $match: { project: { $in: projects.map((project) => project._id) } } },
      { $group: { _id: '$project', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } } } },
    ])
    response.json({ success: true, stats })
  } catch (error) { next(error) }
}

const getTaskSummary = async (request, response, next) => {
  try {
    const projects = await Project.find({ members: request.user._id }).select('_id')
    const projectIds = projects.map((project) => project._id)
    const dueDateLimit = new Date()
    const dueDateStart = new Date()
    dueDateLimit.setDate(dueDateLimit.getDate() + 7)
    dueDateStart.setHours(0, 0, 0, 0)
    const [counts, dueSoon] = await Promise.all([
      Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: null, total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } }, inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } } } },
      ]),
      Task.find({ project: { $in: projectIds }, status: { $ne: 'Completed' }, dueDate: { $gte: dueDateStart, $lte: dueDateLimit } })
        .populate('project', 'title status')
        .populate('assignedTo', 'name email avatar')
        .populate('createdBy', 'name email avatar')
        .sort({ dueDate: 1, _id: 1 })
        .limit(5),
    ])
    response.json({ success: true, summary: counts[0] || { total: 0, completed: 0, inProgress: 0 }, dueSoon })
  } catch (error) { next(error) }
}

const getTask = async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: 'Invalid task ID' })
    const task = await Task.findById(request.params.id)
    if (!task) return response.status(404).json({ success: false, message: 'Task not found' })
    if (!(await isProjectMember(task.project, request.user._id))) return response.status(403).json({ success: false, message: 'Project membership required' })
    await task.populate('project', 'title status')
    await task.populate('assignedTo', 'name email avatar')
    await task.populate('createdBy', 'name email avatar')
    response.json({ success: true, task })
  } catch (error) { next(error) }
}

const createTask = async (request, response, next) => {
  try {
    const { title, description, project, assignedTo, status, priority, dueDate, attachments } = request.body
    if (!mongoose.isValidObjectId(project)) return response.status(400).json({ success: false, message: 'Valid project ID is required' })
    const projectRecord = await Project.findById(project)
    if (!projectRecord) return response.status(404).json({ success: false, message: 'Project not found' })
    if (!projectRecord.members.some((member) => member.equals(request.user._id))) {
      return response.status(403).json({ success: false, message: 'Project membership required' })
    }
    if (assignedTo && (!mongoose.isValidObjectId(assignedTo) || !projectRecord.members.some((member) => member.equals(assignedTo)))) return response.status(400).json({ success: false, message: 'Assigned user must be a project member' })
    const result = await runTransaction(async (session) => {
      const [task] = await Task.create([{ title, description, project, assignedTo, status, priority, dueDate, attachments: attachments || [], createdBy: request.user._id }], { session })
      const activity = await recordActivity({ user: request.user._id, project: projectRecord._id, task: task._id, type: 'task_created', message: `Created task "${task.title}"`, session })
      return { taskId: task._id, activity }
    })
    const populatedTask = (await taskQuery({ _id: result.taskId }))[0]
    emitEvent('task_created', projectRecord._id, populatedTask)
    emitEvent('activity_created', projectRecord._id, result.activity)
    response.status(201).json({ success: true, task: populatedTask })
  } catch (error) { next(error) }
}

const updateTask = async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: 'Invalid task ID' })
    const task = await Task.findById(request.params.id)
    if (!task) return response.status(404).json({ success: false, message: 'Task not found' })
    if (!(await isProjectMember(task.project, request.user._id))) return response.status(403).json({ success: false, message: 'Project membership required' })
    const allowedFields = ['title', 'description', 'assignedTo', 'status', 'priority', 'dueDate', 'attachments']
    if (request.body.assignedTo && (!mongoose.isValidObjectId(request.body.assignedTo) || !(await isProjectMember(task.project, request.body.assignedTo)))) return response.status(400).json({ success: false, message: 'Assigned user must be a project member' })
    allowedFields.forEach((field) => { if (request.body[field] !== undefined) task[field] = request.body[field] })
    const activity = await runTransaction(async (session) => {
      await task.save({ session })
      return recordActivity({ user: request.user._id, project: task.project, task: task._id, type: 'task_updated', message: `Updated task "${task.title}"`, session })
    })
    const populatedTask = (await taskQuery({ _id: task._id }))[0]
    emitEvent('task_updated', task.project, populatedTask)
    emitEvent('activity_created', task.project, activity)
    response.json({ success: true, task: populatedTask })
  } catch (error) { next(error) }
}

const deleteTask = async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: 'Invalid task ID' })
    const task = await Task.findById(request.params.id)
    if (!task) return response.status(404).json({ success: false, message: 'Task not found' })
    if (!(await isProjectMember(task.project, request.user._id))) return response.status(403).json({ success: false, message: 'Project membership required' })
    const result = await runTransaction(async (session) => {
      await Comment.deleteMany({ task: task._id }, { session })
      await Task.deleteOne({ _id: task._id }, { session })
      const activity = await recordActivity({ user: request.user._id, project: task.project, type: 'task_deleted', message: `Deleted task "${task.title}"`, session })
      return activity
    })
    emitEvent('task_deleted', task.project, { taskId: task._id, projectId: task.project })
    emitEvent('activity_created', task.project, result)
    response.json({ success: true, message: 'Task deleted' })
  } catch (error) { next(error) }
}

module.exports = { createTask, deleteTask, getTask, getTasks, getTaskStats, getTaskSummary, updateTask }
