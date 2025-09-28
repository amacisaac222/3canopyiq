import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Mock pull request data with linked Claude sessions
const mockPullRequests = [
  {
    id: 1,
    number: 42,
    title: "Add automatic Claude Code tracking system",
    description: "Implements file system watcher to track changes in real-time",
    state: "open",
    draft: false,
    author: {
      login: "developer",
      avatar_url: "https://github.com/github.png"
    },
    repository: "canopyiq/main",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    additions: 245,
    deletions: 32,
    changed_files: 8,
    comments: 3,
    reviews: 1,
    mergeable: true,
    labels: ["enhancement", "tracking"],
    sessionId: "claude-auto-1759020386445", // Link to Claude session
    documentation_status: "pending"
  },
  {
    id: 2,
    number: 41,
    title: "Fix dashboard layout responsiveness",
    description: "Updates grid layout for better mobile experience",
    state: "open",
    draft: false,
    author: {
      login: "developer",
      avatar_url: "https://github.com/github.png"
    },
    repository: "canopyiq/main",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    additions: 128,
    deletions: 45,
    changed_files: 4,
    comments: 2,
    reviews: 2,
    mergeable: true,
    labels: ["bug", "ui"],
    documentation_status: "completed"
  },
  {
    id: 3,
    number: 40,
    title: "Add WebSocket support for real-time updates",
    description: "Implements WebSocket endpoint for live session tracking",
    state: "merged",
    draft: false,
    author: {
      login: "developer",
      avatar_url: "https://github.com/github.png"
    },
    repository: "canopyiq/main",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    merged_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    additions: 512,
    deletions: 23,
    changed_files: 12,
    comments: 5,
    reviews: 3,
    mergeable: false,
    labels: ["feature"],
    sessionId: "claude-1758920000000",
    documentation_status: "completed"
  }
]

export async function GET(request: Request) {
  try {
    // Check authentication (allow in dev mode)
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('github_session')

    if (!sessionCookie && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state') // open, closed, merged, all
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    // Filter pull requests
    let filteredPRs = [...mockPullRequests]

    if (state && state !== 'all') {
      filteredPRs = filteredPRs.filter(pr => pr.state === state)
    }

    // Sort by updated time (most recent first)
    filteredPRs.sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )

    // Apply limit if specified
    if (limit) {
      filteredPRs = filteredPRs.slice(0, limit)
    }

    // In production, this would fetch from GitHub API using Octokit
    // const octokit = await getOctokit(sessionCookie.value)
    // const { data } = await octokit.pulls.list({ ... })

    return NextResponse.json(filteredPRs)
  } catch (error) {
    console.error('Failed to fetch pull requests:', error)
    return NextResponse.json({ error: 'Failed to fetch pull requests' }, { status: 500 })
  }
}

// Create or update a pull request
export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('github_session')

    if (!sessionCookie && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { title, body: description, head, base, draft = false } = body

    // In production, create PR via GitHub API
    // const octokit = await getOctokit(sessionCookie.value)
    // const { data } = await octokit.pulls.create({ ... })

    // For now, return mock response
    const newPR = {
      id: Date.now(),
      number: mockPullRequests.length + 43,
      title,
      description,
      state: 'open',
      draft,
      author: {
        login: 'developer',
        avatar_url: 'https://github.com/github.png'
      },
      repository: 'canopyiq/main',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      additions: 0,
      deletions: 0,
      changed_files: 0,
      comments: 0,
      reviews: 0,
      mergeable: true,
      labels: [],
      documentation_status: 'pending'
    }

    return NextResponse.json(newPR)
  } catch (error) {
    console.error('Failed to create pull request:', error)
    return NextResponse.json({ error: 'Failed to create pull request' }, { status: 500 })
  }
}