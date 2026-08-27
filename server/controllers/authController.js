const User = require('../models/User')
const generateToken = require('../utils/generateToken')

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})

const register = async (request, response, next) => {
  try {
    const { name, email, password } = request.body
    if (!name || !email || !password) {
      return response.status(400).json({ success: false, message: 'Name, email, and password are required' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return response.status(409).json({ success: false, message: 'An account with that email already exists' })
    }

    const user = await User.create({ name, email: normalizedEmail, password })
    return response.status(201).json({ success: true, user: publicUser(user), token: generateToken(user._id) })
  } catch (error) {
    next(error)
  }
}

const login = async (request, response, next) => {
  try {
    const { email, password } = request.body
    if (!email || !password) {
      return response.status(400).json({ success: false, message: 'Email and password are required' })
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password')
    if (!user || !(await user.comparePassword(password))) {
      return response.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    return response.json({ success: true, user: publicUser(user), token: generateToken(user._id) })
  } catch (error) {
    next(error)
  }
}

const getCurrentUser = (request, response) => {
  response.json({ success: true, user: publicUser(request.user) })
}

module.exports = { register, login, getCurrentUser }
