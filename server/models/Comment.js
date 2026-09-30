const mongoose = require('mongoose')

const attachmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  fileType: { type: String, default: 'other' },
  size: { type: Number, default: 0 },
}, { _id: true })

const commentSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: [true, 'Comment message is required'], trim: true, maxlength: 2000 },
    attachments: { type: [attachmentSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

module.exports = mongoose.model('Comment', commentSchema)
