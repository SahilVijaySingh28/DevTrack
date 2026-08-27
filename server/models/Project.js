const mongoose = require('mongoose')

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Project title is required'], trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['Active', 'Completed', 'Archived'], default: 'Active' },
  },
  { timestamps: true },
)

projectSchema.pre('validate', function includeOwner() {
  const memberIds = new Set()
  const uniqueMembers = []
  for (const member of this.members || []) {
    const memberId = String(member._id || member)
    if (!memberIds.has(memberId)) {
      memberIds.add(memberId)
      uniqueMembers.push(member._id || member)
    }
  }

  const ownerId = String(this.owner._id || this.owner)
  if (!memberIds.has(ownerId)) uniqueMembers.push(this.owner._id || this.owner)
  this.members = uniqueMembers
})

module.exports = mongoose.model('Project', projectSchema)
