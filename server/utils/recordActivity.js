const Activity = require('../models/Activity')
const recordActivity = async ({ user, project, task, type, message, session }) => {
  const activity = new Activity({ user, project, task, type, message })
  await activity.save({ session })
  return Activity.findById(activity._id)
    .session(session)
    .populate('user', 'name avatar')
    .populate('project', 'title')
    .populate('task', 'title')
}

module.exports = recordActivity
