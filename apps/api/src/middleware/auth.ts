import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface JWTPayload {
  userId: string
  organizationId: string
  email: string
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || 'development-secret'
    ) as JWTPayload

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { organization: true }
    })

    if (!user || !user.organization) {
      return res.status(403).json({ error: 'User or organization not found' })
    }

    req.user = payload
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    next()
  }
}

export const generateTokens = (user: any) => {
  const payload: JWTPayload = {
    userId: user.id,
    organizationId: user.organizationId,
    email: user.email,
    role: user.role
  }

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET || 'development-secret',
    { expiresIn: '1h' }
  )

  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || 'development-refresh-secret',
    { expiresIn: '7d' }
  )

  return { accessToken, refreshToken }
}