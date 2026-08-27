const jwt = require('jsonwebtoken')
const User = require('../models/User')

const protect = async (request, response, next) => {
  try {
    const authorization = request.headers.authorization
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return response.status(401).json({ success: false, message: 'Authentication required' })
    }

    if (!process.env.JWT_SECRET) {
      return response.status(500).json({ success: false, message: 'Authentication is not configured' })
    }

    const token = authorization.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId)

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

module.exports = { protect }
