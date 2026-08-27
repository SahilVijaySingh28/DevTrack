const User = require('../models/User')

const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, avatar: user.avatar, createdAt: user.createdAt, updatedAt: user.updatedAt })

const searchUsers = async (request, response, next) => {
  try {
    const search = request.query.search?.trim()
    const filter = search ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] } : {}
    const users = await User.find(filter).select('name email avatar').limit(10)
    response.json({ success: true, users })
  } catch (error) { next(error) }
}

const updateProfile = async (request, response, next) => {
  try {
    const { name, avatar } = request.body
    if (name !== undefined && name.trim().length < 2) return response.status(400).json({ success: false, message: 'Name must be at least 2 characters' })
    request.user.name = name === undefined ? request.user.name : name.trim()
    request.user.avatar = avatar === undefined ? request.user.avatar : avatar.trim()
    await request.user.save()
    response.json({ success: true, user: publicUser(request.user) })
  } catch (error) { next(error) }
}

module.exports = { searchUsers, updateProfile }
