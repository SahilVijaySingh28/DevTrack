const notFound = (request, response) => {
  response.status(404).json({ success: false, message: `Route not found: ${request.method} ${request.originalUrl}` })
}

const errorHandler = (error, request, response, next) => {
  if (response.headersSent) return next(error)

  const statusCode = error.name === 'ValidationError' || error.name === 'CastError' ? 400 : error.code === 11000 ? 409 : 500
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : error.message

  response.status(statusCode).json({ success: false, message })
}

module.exports = { notFound, errorHandler }
