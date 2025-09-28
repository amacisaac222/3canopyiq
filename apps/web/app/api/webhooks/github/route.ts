import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/github-app'

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || ''

interface PullRequestWebhook {
  action: 'opened' | 'closed' | 'reopened' | 'synchronize'
  number: number
  pull_request: {
    id: number
    number: number
    state: 'open' | 'closed'
    title: string
    body: string | null
    html_url: string
    user: {
      login: string
      avatar_url: string
    }
    base: {
      ref: string
      repo: {
        name: string
        full_name: string
      }
    }
    head: {
      ref: string
      sha: string
    }
    created_at: string
    updated_at: string
    merged: boolean
    merged_at: string | null
  }
  repository: {
    id: number
    name: string
    full_name: string
    owner: {
      login: string
    }
  }
}


export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-hub-signature-256')
    const event = request.headers.get('x-github-event')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 401 })
    }

    const body = await request.text()

    // Verify webhook signature using GitHub App utility
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(body)

    // Handle different GitHub events
    switch (event) {
      case 'ping':
        console.log('GitHub webhook ping received')
        return NextResponse.json({ message: 'Pong' })

      case 'pull_request':
        await handlePullRequest(payload as PullRequestWebhook)
        break

      case 'push':
        console.log('Push event received:', payload.ref)
        // Handle push events if needed
        break

      case 'installation':
      case 'installation_repositories':
        console.log('Installation event received')
        // Handle GitHub App installation events
        break

      default:
        console.log(`Unhandled event type: ${event}`)
    }

    return NextResponse.json({ message: 'Webhook processed' })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handlePullRequest(webhook: PullRequestWebhook) {
  const { action, pull_request, repository } = webhook

  console.log(`PR ${action}: #${pull_request.number} in ${repository.full_name}`)

  switch (action) {
    case 'opened':
      // New PR opened - check for Claude session data
      await checkForClaudeSession(pull_request, repository)
      break

    case 'synchronize':
      // PR updated with new commits
      await updatePRDocumentation(pull_request, repository)
      break

    case 'closed':
      if (pull_request.merged) {
        console.log(`PR #${pull_request.number} was merged`)
        // Handle merged PR
      }
      break
  }
}

async function checkForClaudeSession(pr: any, repo: any) {
  // This is where you would:
  // 1. Check if there's a Claude session associated with this PR's branch
  // 2. Extract relevant documentation from the Claude session
  // 3. Update the PR description with the documentation

  console.log(`Checking for Claude session data for PR #${pr.number}`)

  // TODO: Implement Claude session lookup
  // TODO: Generate PR documentation
  // TODO: Update PR description via GitHub API
}

async function updatePRDocumentation(pr: any, repo: any) {
  // Update existing PR documentation when new commits are pushed
  console.log(`Updating documentation for PR #${pr.number}`)

  // TODO: Fetch updated Claude session data
  // TODO: Regenerate documentation
  // TODO: Update PR description
}