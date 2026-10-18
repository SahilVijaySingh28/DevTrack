const User = require('../models/User')
const jwt = require('jsonwebtoken')
const generateToken = require('../utils/generateToken')

const authCookieName = 'devtrack_token'
const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
}

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})

const sendAuthenticatedUser = (response, status, user) => {
  const token = generateToken(user._id)
  const { exp } = jwt.decode(token)
  response.cookie(authCookieName, token, {
    ...authCookieOptions,
    maxAge: Math.max(0, exp * 1000 - Date.now()),
  })
  return response.status(status).json({ success: true, user: publicUser(user) })
}

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
    return sendAuthenticatedUser(response, 201, user)
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

    return sendAuthenticatedUser(response, 200, user)
  } catch (error) {
    next(error)
  }
}

const getCurrentUser = (request, response) => {
  response.json({ success: true, user: publicUser(request.user) })
}

const logout = (request, response) => {
  response.clearCookie(authCookieName, authCookieOptions)
  response.json({ success: true })
}

module.exports = { register, login, getCurrentUser, logout }
