const jwt = require('jsonwebtoken')
const { deleteCacheKey } = require('../utils/cache')
const getCachedUser = require('../utils/cachedUser')
const { getAccessTokenSecret } = require('../utils/tokenConfig')

const protect = async (request, response, next) => {
  try {
    const token = request.cookies?.devtrack_token
    if (!token) {
      return response.status(401).json({ success: false, message: 'Authentication required' })
    }

    const decoded = jwt.verify(token, getAccessTokenSecret())
    if (decoded.tokenUse !== 'access' || typeof decoded.userId !== 'string' || typeof decoded.exp !== 'number') {
      return response.status(401).json({ success: false, message: 'Invalid or expired token' })
    }
    const user = await getCachedUser(decoded.userId)

    if (!user) {
      return response.status(401).json({ success: false, message: 'User no longer exists' })
    }

    request.user = user
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return response.status(401).json({ success: false, message: 'Invalid or expired token' })
    }
    next(error)
  }
}

const invalidateUserCache = (userId) => deleteCacheKey(`user:${userId}`)

module.exports = { protect, invalidateUserCache }
