const jwt = require('jsonwebtoken')
const { getAccessTokenSecret } = require('./tokenConfig')

const generateAccessToken = (userId) => jwt.sign(
  { userId: String(userId), tokenUse: 'access' },
  getAccessTokenSecret(),
  {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m',
  },
)

module.exports = generateAccessToken
