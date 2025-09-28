import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { db, lineageTracker } from '@canopyiq/database'
import { Octokit } from '@octokit/rest'
import { App } from '@octokit/app'
import { generatePRDocumentation } from '../../lib/documentation-generator'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Initialize GitHub App
const githubApp = new App({
  appId: process.env.GITHUB_APP_ID!,
  privateKey: process.env.GITHUB_PRIVATE_KEY!,
})

/**
 * Verify GitHub webhook signature
 */
function verifyWebhookSignature(payload: string, signature: string | null): boolean {
  if (!signature) return false

  const secret = process.env.GITHUB_WEBHOOK_SECRET || ''
  const hmac = createHmac('sha256', secret)
  const digest = 'sha256=' + hmac.update(payload).digest('hex')

  return signature === digest
}

/**
 * Handle GitHub webhook
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-hub-signature-256')

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const event = JSON.parse(body)
    const eventType = req.headers.get('x-github-event') || 'unknown'

    console.log(`Received GitHub webhook: ${eventType}`)

    // Create event with GitHub source
    const githubEvent = await lineageTracker.createEvent({
      sourceType: 'github',
      sourceId: event.pull_request?.number?.toString() || event.issue?.number?.toString() || 'unknown',
      sourceUrl: event.pull_request?.html_url || event.issue?.html_url || null,
      userId: event.sender?.login || 'github',
      category: 'code_change',
      action: `github_${eventType}`,
      label: event.action || eventType,
      value: {
        repository: event.repository?.full_name,
        action: event.action,
        ...event,
      },
      gitCommit: event.pull_request?.head?.sha || null,
      gitBranch: event.pull_request?.head?.ref || null,
      gitRepository: event.repository?.html_url || null,
      prNumber: event.pull_request?.number || null,
      organizationId: await getOrganizationId(event.repository?.id),
      projectId: await getProjectId(event.repository?.full_name),
      environmentType: 'production',
    })

    // Handle specific events
    if (eventType === 'pull_request' && event.action === 'opened') {
      await handleNewPR(event.pull_request, githubEvent.id, event.repository)
    }

    return NextResponse.json({
      success: true,
      eventId: githubEvent.id,
      eventType,
    })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

/**
 * Handle new pull request
 */
async function handleNewPR(pr: any, eventId: string, repository: any) {
  try {
    // Find related Claude events from last 24 hours
    const recentEvents = await db
      .select()
      .from('events' as any)
      .where('project_id', '=', await getProjectId(repository.full_name))
      .and('timestamp', '>', new Date(Date.now() - 24 * 60 * 60 * 1000))
      .and('source_type', '=', 'claude_code')
      .orderBy('timestamp', 'desc')
      .limit(100)

    // Find related Claude sessions
    const sessions = await findRelatedSessions(pr.head.sha, repository)

    // Generate comprehensive documentation
    const documentation = await generatePRDocumentation({
      pr,
      repository,
      events: recentEvents,
      sessions,
      eventId,
    })

    // Get installation access token
    const octokit = await githubApp.getInstallationOctokit(repository.installation.id)

    // Post documentation as PR comment
    await octokit.issues.createComment({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: pr.number,
      body: documentation,
    })

    // Store PR in database with lineage
    await db.insert('pull_requests' as any).values({
      pr_number: pr.number,
      github_url: pr.html_url,
      title: pr.title,
      state: pr.state,
      generated_description: documentation,
      compliance_report: await checkCompliance(recentEvents),
      metrics_report: await generateMetricsReport(recentEvents, sessions),
      claude_session_ids: sessions.map(s => s.session_id),
      source_event_ids: [eventId, ...recentEvents.map(e => e.id)],
      base_branch: pr.base.ref,
      head_branch: pr.head.ref,
      files_changed: pr.changed_files || 0,
      additions: pr.additions || 0,
      deletions: pr.deletions || 0,
      created_at: new Date(pr.created_at),
      author_user_id: pr.user.login,
      project_id: await getProjectId(repository.full_name),
      organization_id: await getOrganizationId(repository.id),
    })

    console.log(`Documentation posted for PR #${pr.number}`)
  } catch (error) {
    console.error('Failed to handle new PR:', error)
  }
}

/**
 * Find related Claude sessions
 */
async function findRelatedSessions(commitSha: string, repository: any) {
  // Look for sessions that modified files in this commit
  const sessions = await db
    .select()
    .from('claude_sessions' as any)
    .where('project_id', '=', await getProjectId(repository.full_name))
    .and('end_time', '>', new Date(Date.now() - 48 * 60 * 60 * 1000))
    .orderBy('start_time', 'desc')
    .limit(10)

  // Filter sessions that have events related to this commit
  const relatedSessions = []
  for (const session of sessions) {
    const hasRelatedEvents = await db
      .select()
      .from('events' as any)
      .where('source_id', '=', session.session_id)
      .and('git_commit', '=', commitSha)
      .limit(1)

    if (hasRelatedEvents.length > 0) {
      relatedSessions.push(session)
    }
  }

  return relatedSessions
}

/**
 * Check compliance
 */
async function checkCompliance(events: any[]) {
  const checks = {
    passedChecks: [] as string[],
    failedChecks: [] as string[],
    warnings: [] as string[],
    score: 100,
    standards: ['OWASP', 'SOC2'],
  }

  // Run compliance checks
  const securityEvents = events.filter(e => e.category === 'analysis' && e.action.includes('security'))

  if (securityEvents.length > 0) {
    checks.passedChecks.push('security_scan')
  } else {
    checks.warnings.push('No security scan detected')
    checks.score -= 10
  }

  const testEvents = events.filter(e => e.action.includes('test'))
  if (testEvents.length > 0) {
    checks.passedChecks.push('tests_added')
  } else {
    checks.warnings.push('No tests added')
    checks.score -= 15
  }

  const reviewEvents = events.filter(e => e.category === 'review')
  if (reviewEvents.length > 0) {
    checks.passedChecks.push('code_reviewed')
  }

  return checks
}

/**
 * Generate metrics report
 */
async function generateMetricsReport(events: any[], sessions: any[]) {
  const report = {
    complexity: {
      before: 0,
      after: 0,
      change: 0,
    },
    coverage: {
      before: 0,
      after: 0,
      change: 0,
    },
    performance: {
      before: {} as any,
      after: {} as any,
    },
    security: {
      issuesFixed: 0,
      newIssues: 0,
      score: 100,
    },
  }

  // Extract metrics from events
  for (const event of events) {
    if (event.action === 'complexity_calculation' && event.value) {
      report.complexity.after = event.value.complexity || 0
    }
    if (event.action === 'tests_added' && event.value) {
      report.coverage.after = event.value.coverage || 0
    }
    if (event.action === 'security_scan' && event.value) {
      report.security.issuesFixed = event.value.fixed || 0
      report.security.newIssues = event.value.new || 0
    }
  }

  // Calculate changes from session snapshots
  for (const session of sessions) {
    if (session.metric_snapshots) {
      const snapshots = session.metric_snapshots
      if (snapshots.before) {
        report.complexity.before = snapshots.before.complexity || report.complexity.before
        report.coverage.before = snapshots.before.coverage || report.coverage.before
      }
      if (snapshots.after) {
        report.complexity.after = snapshots.after.complexity || report.complexity.after
        report.coverage.after = snapshots.after.coverage || report.coverage.after
      }
    }
  }

  // Calculate changes
  report.complexity.change = report.complexity.after - report.complexity.before
  report.coverage.change = report.coverage.after - report.coverage.before

  return report
}

/**
 * Get organization ID for repository
 */
async function getOrganizationId(repoId: string): Promise<string> {
  // In production, lookup from database
  // For now, return default
  return process.env.ORGANIZATION_ID || 'default-org'
}

/**
 * Get project ID for repository
 */
async function getProjectId(repoFullName: string): Promise<string | undefined> {
  const project = await db
    .select()
    .from('projects' as any)
    .where('repository_url', 'like', `%${repoFullName}%`)
    .limit(1)

  return project[0]?.id
}