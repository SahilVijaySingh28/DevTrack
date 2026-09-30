const mongoose = require('mongoose')

const attachmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  fileType: { type: String, default: 'other' },
  size: { type: Number, default: 0 },
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
    attachments: { type: [attachmentSchema], default: [] },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Task', taskSchema)
