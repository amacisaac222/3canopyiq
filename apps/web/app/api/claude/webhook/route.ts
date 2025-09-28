import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Verify webhook signature (if using signatures)
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  const digest = 'sha256=' + hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const data = JSON.parse(body)

    // Optional: Verify webhook signature
    const signature = request.headers.get('x-canopyiq-signature')
    if (signature && process.env.CLAUDE_WEBHOOK_SECRET) {
      const isValid = verifySignature(body, signature, process.env.CLAUDE_WEBHOOK_SECRET)
      if (!isValid) {
        console.error('Invalid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const { event, sessionId, payload } = data

    console.log(`Received Claude webhook event: ${event} for session: ${sessionId}`)

    // Handle different event types
    switch (event) {
      case 'session.started':
        // Session started - create a new session record
        await handleSessionStarted(sessionId, payload)
        break

      case 'session.ended':
        // Session ended - update session with summary
        await handleSessionEnded(sessionId, payload)
        break

      case 'file.edited':
        // File was edited - track the change
        await handleFileEdited(sessionId, payload)
        break

      case 'command.executed':
        // Command was executed - track it
        await handleCommandExecuted(sessionId, payload)
        break

      case 'pr.created':
        // PR was created - link to session
        await handlePRCreated(sessionId, payload)
        break

      case 'search.performed':
        // Search was performed - track context
        await handleSearchPerformed(sessionId, payload)
        break

      default:
        console.log(`Unhandled event type: ${event}`)
    }

    return NextResponse.json({ success: true, received: event })
  } catch (error) {
    console.error('Failed to process Claude webhook:', error)
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 })
  }
}

async function handleSessionStarted(sessionId: string, payload: any) {
  // Create a new session
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/claude/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'start',
      sessionId,
      data: {
        summary: payload.summary || 'New Claude Code session started',
        repository: payload.repository,
        branch: payload.branch
      }
    })
  })

  if (!response.ok) {
    console.error('Failed to create session')
  }
}

async function handleSessionEnded(sessionId: string, payload: any) {
  // End the session with summary
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/claude/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'end',
      sessionId,
      data: {
        summary: payload.summary,
        filesModified: payload.filesModified,
        linesChanged: payload.linesChanged,
        commands: payload.commands
      }
    })
  })

  if (!response.ok) {
    console.error('Failed to end session')
  }
}

async function handleFileEdited(sessionId: string, payload: any) {
  // Add file edit event to session
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/claude/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'addEvent',
      sessionId,
      data: {
        type: 'file_edit',
        description: `Edited ${payload.fileName}`,
        fileName: payload.fileName,
        linesChanged: payload.linesChanged,
        changes: payload.changes
      }
    })
  })

  if (!response.ok) {
    console.error('Failed to add file edit event')
  }
}

async function handleCommandExecuted(sessionId: string, payload: any) {
  // Add command execution event to session
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/claude/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'addEvent',
      sessionId,
      data: {
        type: 'command',
        description: `Executed: ${payload.command}`,
        command: payload.command,
        output: payload.output
      }
    })
  })

  if (!response.ok) {
    console.error('Failed to add command event')
  }
}

async function handlePRCreated(sessionId: string, payload: any) {
  // Link PR to session and trigger documentation
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/claude/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'update',
      sessionId,
      data: {
        prNumber: payload.prNumber,
        prTitle: payload.prTitle,
        repository: payload.repository
      }
    })
  })

  if (!response.ok) {
    console.error('Failed to link PR to session')
  }

  // Trigger documentation generation
  await generatePRDocumentation(sessionId, payload)
}

async function handleSearchPerformed(sessionId: string, payload: any) {
  // Add search event to session
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/claude/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'addEvent',
      sessionId,
      data: {
        type: 'search',
        description: `Searched for: ${payload.query}`,
        query: payload.query,
        results: payload.results
      }
    })
  })

  if (!response.ok) {
    console.error('Failed to add search event')
  }
}

async function generatePRDocumentation(sessionId: string, prData: any) {
  // This would trigger the documentation generation process
  // using the session data and Claude API
  console.log(`Generating documentation for PR #${prData.prNumber} from session ${sessionId}`)

  // In production, this would:
  // 1. Fetch the complete session data
  // 2. Use Claude API to generate documentation
  // 3. Post the documentation to GitHub
  // 4. Update the PR status in the database
}