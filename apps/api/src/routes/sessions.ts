import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { AppError } from '../middleware/error'
import { linkSessionToPR } from '../services/session-matcher'

const router = Router()
const prisma = new PrismaClient()

// Validation schemas
const sessionStartSchema = z.object({
  sessionId: z.string(),
  userId: z.string().optional(),
  repositoryPath: z.string().optional()
})

const sessionUpdateSchema = z.object({
  sessionId: z.string(),
  conversationChunk: z.object({
    timestamp: z.string(),
    type: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    files: z.array(z.string()).optional()
  }).optional(),
  fileChange: z.object({
    path: z.string(),
    action: z.enum(['created', 'modified', 'deleted']),
    linesAdded: z.number(),
    linesRemoved: z.number()
  }).optional(),
  decision: z.string().optional()
})

const sessionEndSchema = z.object({
  sessionId: z.string(),
  duration: z.number(), // seconds
  summary: z.string().optional()
})

// Start a new Claude session
router.post('/start', async (req, res, next) => {
  try {
    const data = sessionStartSchema.parse(req.body)

    // Check if session already exists
    const existing = await prisma.claudeSession.findUnique({
      where: { sessionId: data.sessionId }
    })

    if (existing) {
      throw new AppError('Session already exists', 400)
    }

    // Try to find repository by path
    let repositoryId = undefined
    if (data.repositoryPath) {
      const repoName = data.repositoryPath.split('/').pop()
      const repo = await prisma.repository.findFirst({
        where: {
          organizationId: req.user!.organizationId,
          name: repoName
        }
      })
      repositoryId = repo?.id
    }

    // Create session
    const session = await prisma.claudeSession.create({
      data: {
        sessionId: data.sessionId,
        organizationId: req.user!.organizationId,
        userId: data.userId || req.user!.userId,
        repositoryId,
        conversationChunks: '[]',
        filesChanged: '[]',
        decisionsExtracted: '[]'
      }
    })

    console.log(`Started Claude session ${session.sessionId}`)

    res.status(201).json({
      message: 'Session started',
      sessionId: session.sessionId
    })
  } catch (error) {
    next(error)
  }
})

// Update session with new data
router.put('/update', async (req, res, next) => {
  try {
    const data = sessionUpdateSchema.parse(req.body)

    const session = await prisma.claudeSession.findUnique({
      where: { sessionId: data.sessionId }
    })

    if (!session) {
      throw new AppError('Session not found', 404)
    }

    // Ensure user has access to this session
    if (session.organizationId !== req.user!.organizationId) {
      throw new AppError('Access denied', 403)
    }

    const updates: any = {}

    // Add conversation chunk
    if (data.conversationChunk) {
      const chunks = JSON.parse(session.conversationChunks || '[]')
      chunks.push(data.conversationChunk)
      updates.conversationChunks = JSON.stringify(chunks)
    }

    // Track file changes
    if (data.fileChange) {
      const fileChanges = JSON.parse(session.filesChanged || '[]')
      if (!fileChanges.includes(data.fileChange.path)) {
        fileChanges.push(data.fileChange.path)
        updates.filesChanged = JSON.stringify(fileChanges)
      }

      updates.linesAdded = (session.linesAdded || 0) + data.fileChange.linesAdded
      updates.linesRemoved = (session.linesRemoved || 0) + data.fileChange.linesRemoved
    }

    // Add decision
    if (data.decision) {
      const decisions = JSON.parse(session.decisionsExtracted || '[]')
      decisions.push(data.decision)
      updates.decisionsExtracted = JSON.stringify(decisions)
    }

    // Update session
    await prisma.claudeSession.update({
      where: { id: session.id },
      data: updates
    })

    res.json({ message: 'Session updated' })
  } catch (error) {
    next(error)
  }
})

// End session and trigger PR matching
router.post('/end', async (req, res, next) => {
  try {
    const data = sessionEndSchema.parse(req.body)

    const session = await prisma.claudeSession.findUnique({
      where: { sessionId: data.sessionId }
    })

    if (!session) {
      throw new AppError('Session not found', 404)
    }

    if (session.organizationId !== req.user!.organizationId) {
      throw new AppError('Access denied', 403)
    }

    // Calculate AI contribution percentage
    const aiContribution = calculateAIContribution(session)

    // Update session
    const updatedSession = await prisma.claudeSession.update({
      where: { id: session.id },
      data: {
        endedAt: new Date(),
        duration: data.duration,
        aiContribution
      }
    })

    console.log(`Ended Claude session ${session.sessionId}`)

    // Try to match session to a pull request
    await linkSessionToPR(updatedSession)

    res.json({
      message: 'Session ended',
      sessionId: session.sessionId,
      aiContribution,
      decisions: session.decisionsExtracted.length
    })
  } catch (error) {
    next(error)
  }
})

// Get session details
router.get('/:sessionId', async (req, res, next) => {
  try {
    const session = await prisma.claudeSession.findUnique({
      where: { sessionId: req.params.sessionId },
      include: {
        user: true,
        repository: true,
        pullRequest: true
      }
    })

    if (!session) {
      throw new AppError('Session not found', 404)
    }

    if (session.organizationId !== req.user!.organizationId) {
      throw new AppError('Access denied', 403)
    }

    res.json(session)
  } catch (error) {
    next(error)
  }
})

// List sessions for organization
router.get('/', async (req, res, next) => {
  try {
    const { userId, pullRequestId, limit = 50 } = req.query

    const where: any = {
      organizationId: req.user!.organizationId
    }

    if (userId) {
      where.userId = userId as string
    }

    if (pullRequestId) {
      where.pullRequestId = pullRequestId as string
    }

    const sessions = await prisma.claudeSession.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: parseInt(limit as string),
      include: {
        user: true,
        repository: true,
        pullRequest: true
      }
    })

    res.json(sessions)
  } catch (error) {
    next(error)
  }
})

// Helper function to calculate AI contribution
function calculateAIContribution(session: any): number {
  // Simple heuristic: look at conversation patterns
  const chunks = session.conversationChunks || []

  let userTokens = 0
  let assistantTokens = 0

  for (const chunk of chunks) {
    const tokenCount = chunk.content.split(' ').length * 1.3 // rough estimate

    if (chunk.type === 'user') {
      userTokens += tokenCount
    } else if (chunk.type === 'assistant') {
      assistantTokens += tokenCount
    }
  }

  // If user provided more context/decisions, their contribution is higher
  const totalTokens = userTokens + assistantTokens
  if (totalTokens === 0) return 50

  const userContribution = (userTokens / totalTokens) * 100

  // Adjust based on decisions made
  const decisionBonus = Math.min(session.decisionsExtracted.length * 5, 20)

  // AI contribution is inverse of user contribution
  const aiContribution = Math.max(0, Math.min(100, 100 - userContribution - decisionBonus))

  return Math.round(aiContribution)
}

export default router