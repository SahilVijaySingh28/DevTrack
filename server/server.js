require('dotenv').config()

const http = require('http')
const cors = require('cors')
const express = require('express')
const connectDatabase = require('./config/db')
const authRoutes = require('./routes/authRoutes')
const activityRoutes = require('./routes/activityRoutes')
const commentDeleteRoutes = require('./routes/commentDeleteRoutes')
const commentRoutes = require('./routes/commentRoutes')
const { errorHandler, notFound } = require('./middleware/errorMiddleware')
const projectRoutes = require('./routes/projectRoutes')
const taskRoutes = require('./routes/taskRoutes')
const userRoutes = require('./routes/userRoutes')
const { initSocket } = require('./utils/socket')

const app = express()
const server = http.createServer(app)
initSocket(server)

const port = process.env.PORT || 5000

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json({ limit: '15mb' }))
app.use(express.urlencoded({ extended: true, limit: '15mb' }))

app.get('/api/health', (request, response) => {
  response.json({ success: true, message: 'DevTrack API is running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/activity', activityRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/tasks/:taskId/comments', commentRoutes)
app.use('/api/comments', commentDeleteRoutes)
app.use('/api/users', userRoutes)
app.use(notFound)
app.use(errorHandler)

const startServer = async () => {
  await connectDatabase()
  server.listen(port, () => {
    process.stdout.write(`DevTrack API listening on port ${port}\n`)
  })
}

if (require.main === module) {
  startServer().catch((error) => {
    process.stderr.write(`Failed to start server: ${error.message}\n`)
    process.exitCode = 1
  })
}

module.exports = app
