const mongoose = require('mongoose')

const activitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    type: { type: String, required: true, enum: ['project_created', 'project_updated', 'task_created', 'task_updated', 'task_deleted', 'comment_added', 'comment_deleted', 'member_added', 'member_removed'] },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Activity', activitySchema)
