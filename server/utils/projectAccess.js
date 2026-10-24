const hasProjectRole = (project, userId, roles) => {
  const role = project.memberRoles.find((entry) => String(entry.user._id || entry.user) === String(userId))?.role
  return roles.includes(role)
}

const canManageProject = (project, userId) => hasProjectRole(project, userId, ['Admin', 'Manager'])

module.exports = { canManageProject, hasProjectRole }
