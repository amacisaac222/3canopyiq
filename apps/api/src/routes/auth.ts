import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { generateTokens } from '../middleware/auth'
import { AppError } from '../middleware/error'

const router = Router()
const prisma = new PrismaClient()

// Validation schemas
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string(),
  organizationName: z.string(),
  organizationSlug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only')
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
})

// Sign up - create organization and first user
router.post('/signup', async (req, res, next) => {
  try {
    const data = signupSchema.parse(req.body)

    // Check if email or org slug already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      throw new AppError('Email already registered', 400)
    }

    const existingOrg = await prisma.organization.findUnique({
      where: { slug: data.organizationSlug }
    })

    if (existingOrg) {
      throw new AppError('Organization slug already taken', 400)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Create organization and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: data.organizationName,
          slug: data.organizationSlug
        }
      })

      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          role: 'admin', // First user is admin
          organizationId: organization.id
        }
      })

      return { organization, user }
    })

    // Generate tokens
    const tokens = generateTokens(result.user)

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role
      },
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug
      },
      ...tokens
    })
  } catch (error) {
    next(error)
  }
})

// Login
router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body)

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { organization: true }
    })

    if (!user || !user.password) {
      throw new AppError('Invalid email or password', 401)
    }

    const validPassword = await bcrypt.compare(data.password, user.password)

    if (!validPassword) {
      throw new AppError('Invalid email or password', 401)
    }

    const tokens = generateTokens(user)

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug
      },
      ...tokens
    })
  } catch (error) {
    next(error)
  }
})

// GitHub OAuth callback (will be implemented with GitHub App)
router.post('/github/callback', async (req, res, next) => {
  try {
    const { code, installationId } = req.body

    // TODO: Exchange code for access token with GitHub
    // TODO: Get user info from GitHub
    // TODO: Create or update user and link to organization

    res.json({ message: 'GitHub authentication successful' })
  } catch (error) {
    next(error)
  }
})

// Check auth status
router.get('/status', async (req, res) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.json({
      authenticated: false,
      github: false,
      claude: false
    })
  }

  // TODO: Verify token and check GitHub/Claude connections
  res.json({
    authenticated: true,
    github: true, // Check if org has GitHub app installed
    claude: true  // Check if user has MCP server configured
  })
})

export default router