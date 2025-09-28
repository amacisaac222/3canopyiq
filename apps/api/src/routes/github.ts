import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// Placeholder for GitHub routes
router.get('/repos', async (req, res, next) => {
  try {
    const repos = await prisma.repository.findMany({
      where: { organizationId: req.user!.organizationId }
    })
    res.json(repos)
  } catch (error) {
    next(error)
  }
})

export default router