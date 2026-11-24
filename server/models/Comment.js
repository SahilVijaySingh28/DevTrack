const mongoose = require('mongoose')

const attachmentSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 255 },
  url: { type: String, required: true, maxlength: 2048, match: [/^https:\/\/\S+$/i, 'Attachment URL must use HTTPS'] },
  fileType: { type: String, enum: ['image', 'pdf', 'document', 'other'], default: 'other' },
  size: { type: Number, min: 0, max: 10485760, default: 0 },
}, { _id: true })

const commentSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: [true, 'Comment message is required'], trim: true, maxlength: 2000 },
    attachments: { type: [attachmentSchema], default: [], validate: [(items) => items.length <= 10, 'A comment can have at most 10 attachments'] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

commentSchema.index({ task: 1, createdAt: -1, _id: -1 })

module.exports = mongoose.model('Comment', commentSchema)
