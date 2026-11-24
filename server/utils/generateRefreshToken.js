const crypto = require('node:crypto')
const jwt = require('jsonwebtoken')
const { getRefreshTokenSecret } = require('./tokenConfig')

const generateRefreshToken = (userId) => jwt.sign(
  { userId: String(userId), tokenUse: 'refresh' },
  getRefreshTokenSecret(),
  {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '10d',
    jwtid: crypto.randomBytes(16).toString('hex'),
  },
)

module.exports = generateRefreshToken
