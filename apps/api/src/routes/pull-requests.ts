import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

router.get('/', async (req, res, next) => {
  try {
    const prs = await prisma.pullRequest.findMany({
      where: { organizationId: req.user!.organizationId },
      include: {
        repository: true,
        author: true,
        documentation: true,
        _count: { select: { sessions: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    res.json(prs)
  } catch (error) {
    next(error)
  }
})

export default router