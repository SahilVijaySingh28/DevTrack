const mongoose = require('mongoose')

const attachmentSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 255 },
  url: { type: String, required: true, maxlength: 2048, match: [/^https:\/\/\S+$/i, 'Attachment URL must use HTTPS'] },
  fileType: { type: String, enum: ['image', 'pdf', 'document', 'other'], default: 'other' },
  size: { type: Number, min: 0, max: 10485760, default: 0 },
}, { _id: true })

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Task title is required'], trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Todo', 'In Progress', 'Completed'], default: 'Todo' },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    dueDate: { type: Date, default: null },
    attachments: { type: [attachmentSchema], default: [], validate: [(items) => items.length <= 10, 'A task can have at most 10 attachments'] },
  },
  { timestamps: true, optimisticConcurrency: true },
)

taskSchema.index({ project: 1, updatedAt: -1 })
taskSchema.index({ project: 1, status: 1, updatedAt: -1 })
taskSchema.index({ project: 1, dueDate: 1 })

module.exports = mongoose.model('Task', taskSchema)
