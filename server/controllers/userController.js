const User = require('../models/User')
const { invalidateUserCache } = require('../middleware/authMiddleware')

const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, avatar: user.avatar, createdAt: user.createdAt, updatedAt: user.updatedAt })
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const searchUsers = async (request, response, next) => {
  try {
    const rawSearch = request.query.search
    if (rawSearch !== undefined && (typeof rawSearch !== 'string' || rawSearch.length > 100)) {
      return response.status(400).json({ success: false, message: 'Search must be a string of at most 100 characters' })
    }
    const search = rawSearch?.trim()
    if (!search || search.length < 2) return response.json({ success: true, users: [] })
    const safeSearch = escapeRegex(search)
    const filter = { $or: [{ name: { $regex: `^${safeSearch}`, $options: 'i' } }, { email: { $regex: `^${safeSearch}`, $options: 'i' } }] }
    const users = await User.find(filter).select('name email avatar').limit(10)
    response.json({ success: true, users })
  } catch (error) { next(error) }
}

const updateProfile = async (request, response, next) => {
  try {
    const { name, avatar } = request.body
    if (name !== undefined && name.trim().length < 2) return response.status(400).json({ success: false, message: 'Name must be at least 2 characters' })
    const user = await User.findById(request.user._id)
    if (!user) return response.status(404).json({ success: false, message: 'User no longer exists' })
    user.name = name === undefined ? user.name : name.trim()
    user.avatar = avatar === undefined ? user.avatar : avatar.trim()
    await user.save()
    await invalidateUserCache(user._id)
    response.json({ success: true, user: publicUser(user) })
  } catch (error) { next(error) }
}

module.exports = { searchUsers, updateProfile }
