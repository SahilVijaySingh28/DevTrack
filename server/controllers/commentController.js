const mongoose = require('mongoose')
const Comment = require('../models/Comment')
const Project = require('../models/Project')
const Task = require('../models/Task')
const recordActivity = require('../utils/recordActivity')

const getTaskWithAccess = (taskId, userId) => Task.findById(taskId).populate({ path: 'project', match: { members: userId } })

const getComments = async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.taskId)) return response.status(400).json({ success: false, message: 'Invalid task ID' })
    const task = await getTaskWithAccess(request.params.taskId, request.user._id)
    if (!task || !task.project) return response.status(404).json({ success: false, message: 'Task not found' })
    const comments = await Comment.find({ task: task._id }).populate('user', 'name email avatar').sort('createdAt')
    response.json({ success: true, comments })
  } catch (error) { next(error) }
}

const createComment = async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.taskId)) return response.status(400).json({ success: false, message: 'Invalid task ID' })
    const task = await getTaskWithAccess(request.params.taskId, request.user._id)
    if (!task || !task.project) return response.status(404).json({ success: false, message: 'Task not found' })
    const comment = await Comment.create({ task: task._id, user: request.user._id, message: request.body.message })
    await recordActivity({ user: request.user._id, project: task.project._id, task: task._id, type: 'comment_added', message: `Commented on "${task.title}"` })
    response.status(201).json({ success: true, comment: await comment.populate('user', 'name email avatar') })
  } catch (error) { next(error) }
}

const deleteComment = async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: 'Invalid comment ID' })
    const comment = await Comment.findById(request.params.id).populate({ path: 'task', populate: { path: 'project' } })
    if (!comment) return response.status(404).json({ success: false, message: 'Comment not found' })
    const isCommentOwner = comment.user.equals(request.user._id)
    const project = await Project.findOne({ _id: comment.task.project._id, owner: request.user._id })
    if (!isCommentOwner && !project) return response.status(403).json({ success: false, message: 'You cannot delete this comment' })
    await comment.deleteOne()
    await recordActivity({ user: request.user._id, project: comment.task.project._id, task: comment.task._id, type: 'comment_deleted', message: 'Deleted a task comment' })
    response.json({ success: true, message: 'Comment deleted' })
  } catch (error) { next(error) }
}

module.exports = { createComment, deleteComment, getComments }
