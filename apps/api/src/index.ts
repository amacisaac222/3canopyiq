import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Routes
import authRoutes from './routes/auth'
import githubRoutes from './routes/github'
import sessionsRoutes from './routes/sessions'
import organizationsRoutes from './routes/organizations'
import pullRequestsRoutes from './routes/pull-requests'
import webhooksRoutes from './routes/webhooks'

// Middleware
import { errorHandler } from './middleware/error'
import { authenticateToken } from './middleware/auth'

dotenv.config()

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Public routes
app.use('/api/auth', authRoutes)
app.use('/api/webhooks', webhooksRoutes) // GitHub webhooks don't have auth

// Protected routes
app.use('/api/github', authenticateToken, githubRoutes)
app.use('/api/sessions', authenticateToken, sessionsRoutes)
app.use('/api/organizations', authenticateToken, organizationsRoutes)
app.use('/api/pull-requests', authenticateToken, pullRequestsRoutes)

// Error handling
app.use(errorHandler)

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(() => {
    prisma.$disconnect()
    process.exit(0)
  })
})

export { app, prisma }