const Activity = require('../models/Activity')

const recordActivity = async ({ user, project, task, type, message }) => {
  try {
    await Activity.create({ user, project, task, type, message })
  } catch (error) {
    process.stderr.write(`Activity recording failed: ${error.message}\n`)
  }
}

module.exports = recordActivity
