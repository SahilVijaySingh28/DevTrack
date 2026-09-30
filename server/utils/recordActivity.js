const Activity = require('../models/Activity')
const { emitEvent } = require('./socket')

const recordActivity = async ({ user, project, task, type, message }) => {
  try {
    const activity = await Activity.create({ user, project, task, type, message })
    const populated = await Activity.findById(activity._id).populate('user', 'name avatar').populate('project', 'title').populate('task', 'title')
    emitEvent('activity_created', populated)
  } catch (error) {
    process.stderr.write(`Activity recording failed: ${error.message}\n`)
  }
}

module.exports = recordActivity
