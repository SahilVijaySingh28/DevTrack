const User = require('../models/User')
const { getOrLoad } = require('./cache')

const userCacheTtlSeconds = 30

const getCachedUser = (userId) => getOrLoad(`user:${userId}`, userCacheTtlSeconds, () => (
  User.findById(userId).select('name email avatar createdAt updatedAt').lean()
))

module.exports = getCachedUser
