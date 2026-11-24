const { rateLimit } = require('express-rate-limit')

const createAuthRateLimit = (windowMs, limit, skipSuccessfulRequests = true) => rateLimit({
  windowMs,
  limit,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests,
  handler: (request, response) => response.status(429).json({
    success: false,
    message: 'Too many authentication requests. Please try again later.',
  }),
})

const loginRateLimit = createAuthRateLimit(15 * 60 * 1000, 10)
const registerRateLimit = createAuthRateLimit(60 * 60 * 1000, 5, false)
const refreshRateLimit = createAuthRateLimit(15 * 60 * 1000, 30)

module.exports = { loginRateLimit, refreshRateLimit, registerRateLimit }
