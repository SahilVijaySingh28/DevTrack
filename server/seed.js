require('dotenv').config()

const mongoose = require('mongoose')
const Comment = require('./models/Comment')
const Project = require('./models/Project')
const Task = require('./models/Task')
const User = require('./models/User')

const demoEmail = 'demo@devtrack.com'

const seed = async () => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured')

  await mongoose.connect(process.env.MONGODB_URI)
  const existingUser = await User.findOne({ email: demoEmail })
  if (existingUser) {
    const existingProjects = await Project.find({ owner: existingUser._id }).select('_id')
    const projectIds = existingProjects.map((project) => project._id)
    await Comment.deleteMany({ task: { $in: await Task.find({ project: { $in: projectIds } }).distinct('_id') } })
    await Task.deleteMany({ project: { $in: projectIds } })
    await Project.deleteMany({ owner: existingUser._id })
    await User.deleteOne({ _id: existingUser._id })
  }

  const user = await User.create({ name: 'Demo User', email: demoEmail, password: 'Demo123!' })
  const projects = await Project.create([
    { title: 'Launch Planning', description: 'Coordinate the next product release.', owner: user._id, members: [user._id], status: 'Active' },
    { title: 'Design System', description: 'Build a consistent component library.', owner: user._id, members: [user._id], status: 'Active' },
    { title: 'Website Refresh', description: 'Modernize the marketing experience.', owner: user._id, members: [user._id], status: 'Completed' },
  ])
  const tasks = await Task.create([
    { title: 'Define release checklist', project: projects[0]._id, createdBy: user._id, assignedTo: user._id, status: 'Completed', priority: 'High' },
    { title: 'Review onboarding flow', project: projects[0]._id, createdBy: user._id, assignedTo: user._id, status: 'In Progress', priority: 'Medium' },
    { title: 'Document color tokens', project: projects[1]._id, createdBy: user._id, assignedTo: user._id, status: 'Todo', priority: 'Low' },
    { title: 'Publish refreshed homepage', project: projects[2]._id, createdBy: user._id, assignedTo: user._id, status: 'Completed', priority: 'High' },
  ])
  await Comment.create({ task: tasks[1]._id, user: user._id, message: 'I will review this with the team today.' })
  process.stdout.write(`Seed complete. Login with ${demoEmail} / Demo123!\n`)
}

seed().catch((error) => {
  process.stderr.write(`Seed failed: ${error.message}\n`)
  process.exitCode = 1
}).finally(async () => {
  await mongoose.disconnect()
})
