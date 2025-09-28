import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

router.get('/current', async (req, res, next) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.user!.organizationId },
      include: {
        _count: {
          select: {
            users: true,
            repositories: true,
            pullRequests: true
          }
        }
      }
    })
    res.json(org)
  } catch (error) {
    next(error)
  }
})

export default router