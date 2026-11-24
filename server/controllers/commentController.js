const mongoose = require('mongoose')
const Comment = require('../models/Comment')
const Task = require('../models/Task')
const recordActivity = require('../utils/recordActivity')
const runTransaction = require('../utils/runTransaction')
const { emitEvent } = require('../utils/socket')
const { canManageProject } = require('../utils/projectAccess')
const { isProjectMember } = require('../utils/projectMembership')

const defaultCommentLimit = 20
const maximumCommentLimit = 100

const getTaskWithAccess = async (taskId, userId) => {
  const task = await Task.findById(taskId).select('title project')
  if (!task || !(await isProjectMember(task.project, userId))) return null
  return task
}

const getComments = async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.taskId)) return response.status(400).json({ success: false, message: 'Invalid task ID' })
    const limit = Number(request.query.limit || defaultCommentLimit)
    if (!Number.isInteger(limit) || limit < 1 || limit > maximumCommentLimit) {
      return response.status(400).json({ success: false, message: `Comment limit must be between 1 and ${maximumCommentLimit}` })
    }
    const before = request.query.before
    if (before !== undefined && (typeof before !== 'string' || !mongoose.isValidObjectId(before))) {
      return response.status(400).json({ success: false, message: 'Invalid comment cursor' })
    }
    const task = await getTaskWithAccess(request.params.taskId, request.user._id)
    if (!task || !task.project) return response.status(404).json({ success: false, message: 'Task not found' })
    const filter = { task: task._id }
    if (before) {
      const cursorComment = await Comment.findOne({ _id: before, task: task._id }).select('createdAt')
      if (!cursorComment) return response.status(400).json({ success: false, message: 'Invalid comment cursor' })
      filter.$or = [
        { createdAt: { $lt: cursorComment.createdAt } },
        { createdAt: cursorComment.createdAt, _id: { $lt: cursorComment._id } },
      ]
    }
    const results = await Comment.find(filter)
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
    const hasMore = results.length > limit
    const pageComments = results.slice(0, limit)
    const nextCursor = hasMore ? pageComments[pageComments.length - 1]._id : null
    response.json({
      success: true,
      comments: pageComments.reverse(),
      pagination: { limit, hasMore, nextCursor },
    })
  } catch (error) { next(error) }
}

const createComment = async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.taskId)) return response.status(400).json({ success: false, message: 'Invalid task ID' })
    const task = await getTaskWithAccess(request.params.taskId, request.user._id)
    if (!task || !task.project) return response.status(404).json({ success: false, message: 'Task not found' })
    const result = await runTransaction(async (session) => {
      const [comment] = await Comment.create([{ task: task._id, user: request.user._id, message: request.body.message, attachments: request.body.attachments || [] }], { session })
      const activity = await recordActivity({ user: request.user._id, project: task.project, task: task._id, type: 'comment_added', message: `Commented on "${task.title}"`, session })
      return { commentId: comment._id, activity }
    })
    const populatedComment = await Comment.findById(result.commentId).populate('user', 'name email avatar')
    emitEvent('activity_created', task.project, result.activity)
    emitEvent('comment_added', task.project, { taskId: task._id, comment: populatedComment })
    response.status(201).json({ success: true, comment: populatedComment })
  } catch (error) { next(error) }
}

const deleteComment = async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ success: false, message: 'Invalid comment ID' })
    const comment = await Comment.findById(request.params.id).populate({ path: 'task', populate: { path: 'project' } })
    if (!comment || !comment.task || !comment.task.project) return response.status(404).json({ success: false, message: 'Comment not found' })
    const isCommentOwner = comment.user.equals(request.user._id)
    const canModerate = canManageProject(comment.task.project, request.user._id)
    if (!isCommentOwner && !canModerate) return response.status(403).json({ success: false, message: 'You cannot delete this comment' })
    const activity = await runTransaction(async (session) => {
      await Comment.deleteOne({ _id: comment._id }, { session })
      return recordActivity({ user: request.user._id, project: comment.task.project._id, task: comment.task._id, type: 'comment_deleted', message: 'Deleted a task comment', session })
    })
    emitEvent('activity_created', comment.task.project._id, activity)
    emitEvent('comment_deleted', comment.task.project._id, { commentId: comment._id, taskId: comment.task._id })
    response.json({ success: true, message: 'Comment deleted' })
  } catch (error) { next(error) }
}

module.exports = { createComment, deleteComment, getComments }
