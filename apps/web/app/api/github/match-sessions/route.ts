import { NextRequest, NextResponse } from 'next/server'

interface ClaudeSession {
  sessionId: string
  startTime: string
  endTime?: string
  filesModified: number
  events: Array<{
    type: string
    timestamp: string
    metadata?: {
      filePath?: string
      fileName?: string
      command?: string
      branch?: string
    }
  }>
  repository?: string
  branch?: string
}

interface PullRequest {
  id: number
  number: number
  title: string
  created_at: string
  updated_at: string
  merged_at?: string
  files?: string[]
  head: {
    ref: string // branch name
  }
  base: {
    ref: string
  }
}

interface MatchResult {
  prId: number
  prNumber: number
  sessionId: string
  confidence: number
  matchReasons: string[]
  matchedFactors: {
    timeProximity?: number
    fileOverlap?: number
    branchMatch?: boolean
    commitMessage?: boolean
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessions, pullRequests, options = {} } = await request.json()

    if (!sessions || !pullRequests) {
      return NextResponse.json(
        { error: 'Sessions and pull requests required' },
        { status: 400 }
      )
    }

    // Perform matching
    const matches = await matchSessionsToPRs(
      sessions,
      pullRequests,
      options
    )

    // Sort by confidence
    matches.sort((a, b) => b.confidence - a.confidence)

    return NextResponse.json({
      matches,
      summary: {
        totalSessions: sessions.length,
        totalPRs: pullRequests.length,
        matchedPairs: matches.filter(m => m.confidence > 0.5).length,
        highConfidenceMatches: matches.filter(m => m.confidence > 0.8).length
      }
    })
  } catch (error) {
    console.error('Session matching error:', error)
    return NextResponse.json(
      { error: 'Failed to match sessions to PRs' },
      { status: 500 }
    )
  }
}

async function matchSessionsToPRs(
  sessions: ClaudeSession[],
  pullRequests: PullRequest[],
  options: any
): Promise<MatchResult[]> {
  const matches: MatchResult[] = []

  for (const session of sessions) {
    for (const pr of pullRequests) {
      const matchResult = calculateMatch(session, pr, options)

      if (matchResult.confidence > options.minConfidence || 0.3) {
        matches.push({
          prId: pr.id,
          prNumber: pr.number,
          sessionId: session.sessionId,
          ...matchResult
        })
      }
    }
  }

  // Ensure each session matches to at most one PR (highest confidence)
  const uniqueMatches = new Map<string, MatchResult>()

  for (const match of matches) {
    const existing = uniqueMatches.get(match.sessionId)
    if (!existing || match.confidence > existing.confidence) {
      uniqueMatches.set(match.sessionId, match)
    }
  }

  return Array.from(uniqueMatches.values())
}

function calculateMatch(
  session: ClaudeSession,
  pr: PullRequest,
  options: any
): { confidence: number; matchReasons: string[]; matchedFactors: any } {
  const matchReasons: string[] = []
  const matchedFactors: any = {}
  let totalScore = 0
  let totalWeight = 0

  // 1. Time Proximity Matching (weight: 30%)
  const timeScore = calculateTimeProximity(session, pr)
  if (timeScore > 0) {
    totalScore += timeScore * 0.3
    totalWeight += 0.3
    matchedFactors.timeProximity = timeScore
    if (timeScore > 0.8) {
      matchReasons.push('Session occurred near PR creation time')
    }
  }

  // 2. File Overlap Matching (weight: 40%)
  const fileScore = calculateFileOverlap(session, pr)
  if (fileScore > 0) {
    totalScore += fileScore * 0.4
    totalWeight += 0.4
    matchedFactors.fileOverlap = fileScore
    if (fileScore > 0.7) {
      matchReasons.push(`${Math.round(fileScore * 100)}% file overlap`)
    }
  }

  // 3. Branch Name Matching (weight: 20%)
  const branchScore = calculateBranchMatch(session, pr)
  if (branchScore > 0) {
    totalScore += branchScore * 0.2
    totalWeight += 0.2
    matchedFactors.branchMatch = branchScore === 1
    if (branchScore === 1) {
      matchReasons.push('Same branch name')
    }
  }

  // 4. Commit Message Similarity (weight: 10%)
  const commitScore = calculateCommitSimilarity(session, pr)
  if (commitScore > 0) {
    totalScore += commitScore * 0.1
    totalWeight += 0.1
    matchedFactors.commitMessage = commitScore > 0.5
    if (commitScore > 0.7) {
      matchReasons.push('Similar commit patterns')
    }
  }

  // Calculate final confidence
  const confidence = totalWeight > 0 ? totalScore / totalWeight : 0

  // Boost confidence for multiple matching factors
  const factorCount = Object.keys(matchedFactors).length
  const confidenceBoost = factorCount >= 3 ? 0.1 : factorCount >= 2 ? 0.05 : 0
  const finalConfidence = Math.min(1, confidence + confidenceBoost)

  if (confidenceBoost > 0) {
    matchReasons.push(`Multiple factors match (${factorCount})`)
  }

  return {
    confidence: finalConfidence,
    matchReasons,
    matchedFactors
  }
}

function calculateTimeProximity(
  session: ClaudeSession,
  pr: PullRequest
): number {
  // Get session end time or current time if still active
  const sessionEnd = session.endTime
    ? new Date(session.endTime).getTime()
    : Date.now()
  const sessionStart = new Date(session.startTime).getTime()

  const prCreated = new Date(pr.created_at).getTime()
  const prUpdated = new Date(pr.updated_at).getTime()

  // Check if session occurred before PR creation
  if (sessionEnd < prCreated) {
    // Session happened before PR was created
    const hoursBeforePR = (prCreated - sessionEnd) / (1000 * 60 * 60)

    // Strong match if within 4 hours before PR
    if (hoursBeforePR <= 4) return 1.0
    if (hoursBeforePR <= 12) return 0.8
    if (hoursBeforePR <= 24) return 0.6
    if (hoursBeforePR <= 48) return 0.4
    if (hoursBeforePR <= 72) return 0.2
    return 0
  }

  // Check if session overlaps with PR activity
  if (sessionStart <= prUpdated && sessionEnd >= prCreated) {
    return 0.9 // Session active during PR lifecycle
  }

  // Session after PR (less likely to be related)
  const hoursAfterPR = (sessionStart - prUpdated) / (1000 * 60 * 60)
  if (hoursAfterPR <= 2) return 0.5 // Might be fixing PR feedback
  if (hoursAfterPR <= 12) return 0.3
  return 0
}

function calculateFileOverlap(
  session: ClaudeSession,
  pr: PullRequest
): number {
  if (!pr.files || pr.files.length === 0) return 0

  // Extract files from session events
  const sessionFiles = new Set<string>()
  for (const event of session.events) {
    if (event.metadata?.filePath) {
      // Normalize file path
      const normalizedPath = event.metadata.filePath
        .replace(/\\/g, '/')
        .replace(/^.*\/(apps|packages)\//, '')
      sessionFiles.add(normalizedPath)
    } else if (event.metadata?.fileName) {
      sessionFiles.add(event.metadata.fileName)
    }
  }

  if (sessionFiles.size === 0) return 0

  // Calculate intersection
  const prFiles = new Set(pr.files.map(f =>
    f.replace(/\\/g, '/').replace(/^.*\/(apps|packages)\//, '')
  ))

  let matchCount = 0
  for (const file of sessionFiles) {
    if (prFiles.has(file)) {
      matchCount++
    }
    // Also check for partial matches (same file name in different paths)
    const fileName = file.split('/').pop()
    for (const prFile of prFiles) {
      if (prFile.endsWith(fileName!)) {
        matchCount += 0.5
        break
      }
    }
  }

  // Calculate overlap percentage
  const overlapPercentage = matchCount / Math.max(sessionFiles.size, prFiles.size)
  return Math.min(1, overlapPercentage)
}

function calculateBranchMatch(
  session: ClaudeSession,
  pr: PullRequest
): number {
  if (!session.branch || !pr.head?.ref) return 0

  // Exact match
  if (session.branch === pr.head.ref) return 1.0

  // Partial match (e.g., feature/auth vs auth)
  const sessionBranchParts = session.branch.toLowerCase().split(/[\/\-_]/)
  const prBranchParts = pr.head.ref.toLowerCase().split(/[\/\-_]/)

  // Check for common significant parts
  const commonParts = sessionBranchParts.filter(part =>
    prBranchParts.includes(part) && part.length > 2
  )

  if (commonParts.length > 0) {
    return 0.5 + (0.5 * commonParts.length / Math.max(sessionBranchParts.length, prBranchParts.length))
  }

  return 0
}

function calculateCommitSimilarity(
  session: ClaudeSession,
  pr: PullRequest
): number {
  // Look for commit commands in session
  const commitCommands = session.events.filter(e =>
    e.type === 'command' &&
    e.metadata?.command?.includes('git commit')
  )

  if (commitCommands.length === 0) return 0

  // Extract commit messages
  const commitMessages = commitCommands
    .map(c => {
      const match = c.metadata?.command?.match(/-m\s*["']([^"']+)["']/)
      return match ? match[1] : null
    })
    .filter(Boolean)

  if (commitMessages.length === 0) return 0

  // Compare with PR title
  const prTitleWords = new Set(
    pr.title.toLowerCase()
      .split(/\W+/)
      .filter(w => w.length > 2)
  )

  let totalSimilarity = 0
  for (const message of commitMessages) {
    const messageWords = message!.toLowerCase()
      .split(/\W+/)
      .filter(w => w.length > 2)

    const commonWords = messageWords.filter(w => prTitleWords.has(w))
    const similarity = commonWords.length / Math.max(messageWords.length, prTitleWords.size)
    totalSimilarity = Math.max(totalSimilarity, similarity)
  }

  return totalSimilarity
}

// GET endpoint to retrieve existing matches
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get('sessionId')
  const prNumber = searchParams.get('prNumber')

  // This would fetch from database in production
  const mockMatches = [
    {
      prNumber: 42,
      sessionId: 'claude-auto-1759020386445',
      confidence: 0.85,
      matchReasons: ['Same branch name', '80% file overlap'],
      matchedFactors: {
        timeProximity: 0.9,
        fileOverlap: 0.8,
        branchMatch: true
      }
    }
  ]

  let results = mockMatches
  if (sessionId) {
    results = results.filter(m => m.sessionId === sessionId)
  }
  if (prNumber) {
    results = results.filter(m => m.prNumber === parseInt(prNumber))
  }

  return NextResponse.json(results)
}