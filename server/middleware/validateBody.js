const validateBody = (schema) => (request, response, next) => {
  const result = schema.safeParse(request.body)
  if (!result.success) {
    return response.status(400).json({
      success: false,
      message: result.error.issues[0]?.message || 'Invalid request body',
    })
  }

  request.body = result.data
  next()
}

module.exports = validateBody
