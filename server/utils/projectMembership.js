const { deleteCacheKey, getOrLoad } = require('./cache')
const Project = require('../models/Project')

const membershipCacheKey = (projectId, userId) => `project-member:${projectId}:${userId}`
const membershipTtlSeconds = 15

const isProjectMember = (projectId, userId) => getOrLoad(
  membershipCacheKey(projectId, userId),
  membershipTtlSeconds,
  async () => Boolean(await Project.exists({ _id: projectId, members: userId })),
)

const invalidateProjectMembership = (projectId, userId) => deleteCacheKey(membershipCacheKey(projectId, userId))

module.exports = { invalidateProjectMembership, isProjectMember }
