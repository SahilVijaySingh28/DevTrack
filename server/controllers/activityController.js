const Activity = require('../models/Activity')
const Project = require('../models/Project')

const getActivities = async (request, response, next) => {
  try {
    const projects = await Project.find({ members: request.user._id }).select('_id')
    const activities = await Activity.find({ project: { $in: projects.map((project) => project._id) } }).populate('user', 'name avatar').populate('project', 'title').populate('task', 'title').sort('-createdAt').limit(30)
    response.json({ success: true, activities })
  } catch (error) { next(error) }
}

module.exports = { getActivities }
