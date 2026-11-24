const User = require('../models/User')
const jwt = require('jsonwebtoken')
const generateAccessToken = require('../utils/generateAccessToken')
const {
  createRefreshSession,
  revokeRefreshSession,
  rotateRefreshSession,
} = require('../utils/refreshSessions')
const getCachedUser = require('../utils/cachedUser')
const { getAccessTokenSecret } = require('../utils/tokenConfig')

const authCookieName = 'devtrack_token'
const refreshCookieName = 'devtrack_refresh'
const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
}
const refreshCookieOptions = {
  ...authCookieOptions,
  path: '/api/auth',
}

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})

const setAuthCookies = (response, userId, refreshSession) => {
  const token = generateAccessToken(userId)
  const { exp } = jwt.decode(token)
  response.cookie(authCookieName, token, {
    ...authCookieOptions,
    maxAge: Math.max(0, exp * 1000 - Date.now()),
  })
  response.cookie(refreshCookieName, refreshSession.token, {
    ...refreshCookieOptions,
    maxAge: Math.max(0, refreshSession.expiresAt.getTime() - Date.now()),
  })
}

const clearAuthCookies = (response) => {
  response.clearCookie(authCookieName, authCookieOptions)
  response.clearCookie(refreshCookieName, refreshCookieOptions)
}

const sendAuthenticatedUser = async (response, status, user) => {
  const refreshSession = await createRefreshSession(user._id)
  setAuthCookies(response, user._id, refreshSession)
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
    return await sendAuthenticatedUser(response, 201, user)
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

    return await sendAuthenticatedUser(response, 200, user)
  } catch (error) {
    next(error)
  }
}

const refresh = async (request, response, next) => {
  const token = request.cookies?.[refreshCookieName]
  if (!token) {
    clearAuthCookies(response)
    return response.status(401).json({ success: false, message: 'Invalid or expired refresh token' })
  }

  try {
    const rotated = await rotateRefreshSession(token)
    if (!rotated) {
      clearAuthCookies(response)
      return response.status(401).json({ success: false, message: 'Invalid or expired refresh token' })
    }

    setAuthCookies(response, rotated.user._id, rotated)
    return response.json({ success: true, user: publicUser(rotated.user) })
  } catch (error) {
    next(error)
  }
}

const getCurrentUser = async (request, response, next) => {
  try {
    const accessToken = request.cookies?.[authCookieName]
    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, getAccessTokenSecret())
        if (decoded.tokenUse === 'access' && typeof decoded.userId === 'string') {
          const user = await getCachedUser(decoded.userId)
          if (user) return response.json({ success: true, user: publicUser(user) })
        }
      } catch (error) {
        if (!['TokenExpiredError', 'JsonWebTokenError'].includes(error.name)) throw error
      }
    }

    const refreshToken = request.cookies?.[refreshCookieName]
    if (!refreshToken) {
      clearAuthCookies(response)
      return response.json({ success: true, user: null })
    }

    const rotated = await rotateRefreshSession(refreshToken)
    if (!rotated) {
      clearAuthCookies(response)
      return response.json({ success: true, user: null })
    }

    setAuthCookies(response, rotated.user._id, rotated)
    return response.json({ success: true, user: publicUser(rotated.user) })
  } catch (error) {
    next(error)
  }
}

const logout = async (request, response, next) => {
  try {
    await revokeRefreshSession(request.cookies?.[refreshCookieName])
    clearAuthCookies(response)
    return response.json({ success: true })
  } catch (error) {
    next(error)
  }
}

module.exports = { getCurrentUser, login, logout, refresh, register }
