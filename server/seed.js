require('dotenv').config()

const mongoose = require('mongoose')
const Activity = require('./models/Activity')
const Comment = require('./models/Comment')
const Project = require('./models/Project')
const RefreshSession = require('./models/RefreshSession')
const Task = require('./models/Task')
const User = require('./models/User')

const demoPassword = 'Demo123!'
const demoUsers = [
  { name: 'Demo User One', email: 'demo@devtrack.com' },
  { name: 'Demo User Two', email: 'demo2@devtrack.com' },
  { name: 'Demo User Three', email: 'demo3@devtrack.com' },
  { name: 'Demo User Four', email: 'demo4@devtrack.com' },
  { name: 'Demo User Five', email: 'demo5@devtrack.com' },
]

const demoProjectDefinitions = [
  { title: 'Launch Planning', description: 'Coordinate the next product release.', status: 'Active' },
  { title: 'Design System', description: 'Build a consistent component library.', status: 'Active' },
  { title: 'Website Refresh', description: 'Modernize the marketing experience.', status: 'Active' },
  { title: 'Mobile Experience', description: 'Improve the product experience on mobile.', status: 'Active' },
  { title: 'Customer Research', description: 'Understand user needs and product opportunities.', status: 'Active' },
  { title: 'Analytics Platform', description: 'Improve product metrics and reporting.', status: 'Active' },
  { title: 'Developer Experience', description: 'Make local development and delivery smoother.', status: 'Active' },
  { title: 'Documentation', description: 'Create clear guides for users and contributors.', status: 'Active' },
  { title: 'Quality Initiative', description: 'Raise reliability through testing and review.', status: 'Active' },
  { title: 'Release Operations', description: 'Coordinate dependable production releases.', status: 'Active' },
]

const legacyProjectTitles = ['Launch Planning', 'Design System', 'Website Refresh']
const taskTitles = [
  'Review project requirements',
  'Prepare implementation plan',
  'Design the first iteration',
  'Implement core workflow',
  'Add validation and error handling',
  'Write automated tests',
  'Review accessibility',
  'Update project documentation',
  'Verify release readiness',
  'Collect team feedback',
]

const buildDemoProjects = (users) => demoProjectDefinitions.map((definition, index) => {
  const owner = users[Math.floor(index / 2)]
  return {
    ...definition,
    title: `Demo Workspace ${String(index + 1).padStart(2, '0')}: ${definition.title}`,
    owner: owner._id,
    members: users.map((user) => user._id),
    memberRoles: users.map((user) => ({
      user: user._id,
      role: String(user._id) === String(owner._id) ? 'Admin' : 'Member',
    })),
  }
})

const buildDemoTasks = (users, projects) => Array.from({ length: 75 }, (_, index) => {
  const userIndex = index % users.length
  const projectIndex = index % projects.length
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + (index % 12))
  return {
    title: `${taskTitles[index % taskTitles.length]} ${String(index + 1).padStart(2, '0')}`,
    description: `Demo task ${index + 1} for ${projects[projectIndex].title}.`,
    project: projects[projectIndex]._id,
    createdBy: users[userIndex]._id,
    assignedTo: users[(userIndex + 1) % users.length]._id,
    status: ['Todo', 'In Progress', 'Completed'][index % 3],
    priority: ['Low', 'Medium', 'High'][index % 3],
    dueDate,
  }
})

const revokeDemoRefreshSessions = (userIds) => RefreshSession.deleteMany({ user: { $in: userIds } })

const seed = async () => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured')

  await mongoose.connect(process.env.MONGODB_URI)

  const users = []
  for (const demoUser of demoUsers) {
    let user = await User.findOne({ email: demoUser.email })
    if (!user) user = new User({ ...demoUser, password: demoPassword })
    else {
      user.name = demoUser.name
      user.password = demoPassword
    }
    await user.save()
    users.push(user)
  }

  const userIds = users.map((user) => user._id)
  await revokeDemoRefreshSessions(userIds)

  const seededProjects = await Project.find({
    owner: { $in: userIds },
    $or: [
      { title: /^Demo Workspace \d{2}:/ },
      { owner: users[0]._id, title: { $in: legacyProjectTitles } },
    ],
  }).select('_id')
  const seededProjectIds = seededProjects.map((project) => project._id)

  if (seededProjectIds.length) {
    const seededTaskIds = await Task.find({ project: { $in: seededProjectIds } }).distinct('_id')
    await Comment.deleteMany({ task: { $in: seededTaskIds } })
    await Activity.deleteMany({ project: { $in: seededProjectIds } })
    await Task.deleteMany({ project: { $in: seededProjectIds } })
    await Project.deleteMany({ _id: { $in: seededProjectIds } })
  }

  const projects = await Project.create(buildDemoProjects(users))
  const tasks = await Task.create(buildDemoTasks(users, projects))

  await Comment.create(tasks.slice(0, 10).map((task, index) => ({
    task: task._id,
    user: users[index % users.length]._id,
    message: `Demo team update ${index + 1}: work is progressing and ready for review.`,
  })))
  await Activity.create([
    ...projects.map((project, index) => ({
      user: project.owner,
      project: project._id,
      type: 'project_created',
      message: `Created project "${project.title}"`,
    })),
    ...tasks.map((task) => ({
      user: task.createdBy,
      project: task.project,
      task: task._id,
      type: 'task_created',
      message: `Created task "${task.title}"`,
    })),
  ])

  process.stdout.write(`Seed complete: ${users.length} users, ${projects.length} projects, ${tasks.length} tasks.\n`)
  process.stdout.write(`All demo accounts use password: ${demoPassword}\n`)
  for (const user of users) process.stdout.write(`  ${user.email}\n`)
}

if (require.main === module) {
  seed().catch((error) => {
    process.stderr.write(`Seed failed: ${error.message}\n`)
    process.exitCode = 1
  }).finally(async () => {
    await mongoose.disconnect()
  })
}

module.exports = { buildDemoProjects, buildDemoTasks, demoPassword, demoUsers, revokeDemoRefreshSessions }
