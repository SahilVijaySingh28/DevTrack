const requireTrustedOrigin = (request, response, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return next()

  const origin = request.get('origin')
  const trustedOrigin = process.env.CLIENT_URL || 'http://localhost:5173'
  if (origin && origin !== trustedOrigin) {
    return response.status(403).json({ success: false, message: 'Untrusted request origin' })
  }

  next()
}

module.exports = { requireTrustedOrigin }