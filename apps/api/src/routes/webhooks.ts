import { Router } from 'express'
import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'
import { processWebhook } from '../services/github-webhook'

const router = Router()
const prisma = new PrismaClient()

// Verify GitHub webhook signature
const verifyWebhookSignature = (
  payload: string,
  signature: string | undefined
): boolean => {
  if (!signature) return false

  const secret = process.env.GITHUB_WEBHOOK_SECRET || ''
  const hmac = crypto.createHmac('sha256', secret)
  const digest = 'sha256=' + hmac.update(payload).digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  )
}

// GitHub webhook endpoint
router.post('/github', async (req, res) => {
  const signature = req.headers['x-hub-signature-256'] as string
  const event = req.headers['x-github-event'] as string
  const deliveryId = req.headers['x-github-delivery'] as string

  // Verify signature
  if (process.env.NODE_ENV === 'production') {
    const payload = JSON.stringify(req.body)
    if (!verifyWebhookSignature(payload, signature)) {
      return res.status(401).json({ error: 'Invalid signature' })
    }
  }

  console.log(`Received GitHub webhook: ${event} (${deliveryId})`)

  // Process different webhook events
  try {
    switch (event) {
      case 'pull_request':
        await handlePullRequestEvent(req.body)
        break

      case 'installation':
        await handleInstallationEvent(req.body)
        break

      case 'installation_repositories':
        await handleRepositoryEvent(req.body)
        break

      default:
        console.log(`Unhandled webhook event: ${event}`)
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

// Handle pull request events
async function handlePullRequestEvent(payload: any) {
  const { action, pull_request, repository, installation } = payload

  if (!installation) {
    console.log('No installation found in webhook payload')
    return
  }

  // Find organization by installation ID
  const org = await prisma.organization.findUnique({
    where: { githubInstallationId: installation.id }
  })

  if (!org) {
    console.log(`No organization found for installation ${installation.id}`)
    return
  }

  // Handle different PR actions
  if (action === 'opened' || action === 'synchronize') {
    // Check if repository exists
    let repo = await prisma.repository.findUnique({
      where: { githubId: repository.id }
    })

    if (!repo) {
      // Create repository
      repo = await prisma.repository.create({
        data: {
          githubId: repository.id,
          name: repository.name,
          fullName: repository.full_name,
          isPrivate: repository.private,
          organizationId: org.id
        }
      })
    }

    // Create or update pull request
    const existingPR = await prisma.pullRequest.findUnique({
      where: { githubId: pull_request.id }
    })

    if (!existingPR) {
      const pr = await prisma.pullRequest.create({
        data: {
          githubId: pull_request.id,
          number: pull_request.number,
          title: pull_request.title,
          state: pull_request.state,
          draft: pull_request.draft || false,
          githubUrl: pull_request.html_url,
          additions: pull_request.additions || 0,
          deletions: pull_request.deletions || 0,
          changedFiles: pull_request.changed_files || 0,
          organizationId: org.id,
          repositoryId: repo.id
        }
      })

      console.log(`Created PR #${pr.number} in ${repo.fullName}`)

      // Queue documentation generation
      await processWebhook({
        type: 'generate_documentation',
        pullRequestId: pr.id,
        organizationId: org.id
      })
    } else {
      // Update existing PR
      await prisma.pullRequest.update({
        where: { id: existingPR.id },
        data: {
          title: pull_request.title,
          state: pull_request.state,
          draft: pull_request.draft || false,
          additions: pull_request.additions || 0,
          deletions: pull_request.deletions || 0,
          changedFiles: pull_request.changed_files || 0
        }
      })

      console.log(`Updated PR #${existingPR.number} in ${repo.fullName}`)
    }
  } else if (action === 'closed') {
    // Update PR state
    await prisma.pullRequest.updateMany({
      where: { githubId: pull_request.id },
      data: {
        state: pull_request.merged ? 'merged' : 'closed',
        mergedAt: pull_request.merged_at ? new Date(pull_request.merged_at) : null
      }
    })
  }
}

// Handle GitHub App installation
async function handleInstallationEvent(payload: any) {
  const { action, installation } = payload

  if (action === 'created') {
    console.log(`GitHub App installed for ${installation.account.login}`)

    // This will be linked during the OAuth flow
    // For now, just log it
  } else if (action === 'deleted') {
    // Remove GitHub connection from organization
    await prisma.organization.updateMany({
      where: { githubInstallationId: installation.id },
      data: {
        githubInstallationId: null,
        githubAppInstalled: false,
        githubAccessToken: null
      }
    })

    console.log(`GitHub App uninstalled for installation ${installation.id}`)
  }
}

// Handle repository added/removed
async function handleRepositoryEvent(payload: any) {
  const { action, installation, repositories_added, repositories_removed } = payload

  const org = await prisma.organization.findUnique({
    where: { githubInstallationId: installation.id }
  })

  if (!org) {
    console.log(`No organization found for installation ${installation.id}`)
    return
  }

  if (action === 'added' && repositories_added) {
    for (const repo of repositories_added) {
      await prisma.repository.upsert({
        where: { githubId: repo.id },
        create: {
          githubId: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          isPrivate: repo.private,
          organizationId: org.id
        },
        update: {
          enabled: true
        }
      })

      console.log(`Added repository ${repo.full_name} to ${org.name}`)
    }
  }

  if (action === 'removed' && repositories_removed) {
    for (const repo of repositories_removed) {
      await prisma.repository.updateMany({
        where: {
          githubId: repo.id,
          organizationId: org.id
        },
        data: {
          enabled: false
        }
      })

      console.log(`Disabled repository ${repo.full_name} for ${org.name}`)
    }
  }
}

export default router