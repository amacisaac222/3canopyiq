import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// In production, this would come from a database
// For now, using in-memory storage
let sessions: any[] = []

export async function GET(request: Request) {
  try {
    // Check authentication (skip in development for testing)
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('github_session')

    // In development, allow unauthenticated access for testing
    if (!sessionCookie && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    // Filter and sort sessions
    let filteredSessions = [...sessions]

    // Sort by most recent first
    filteredSessions.sort((a, b) =>
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    )

    // Apply limit if specified
    if (limit) {
      filteredSessions = filteredSessions.slice(0, limit)
    }

    return NextResponse.json(filteredSessions)
  } catch (error) {
    console.error('Failed to fetch sessions:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}

// Create a new session or update existing one
export async function POST(request: Request) {
  try {
    // Check authentication (skip in development for testing)
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('github_session')

    // In development, allow unauthenticated access for testing
    if (!sessionCookie && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, action, data } = body

    if (action === 'start') {
      // Start a new session
      const newSession = {
        id: `session-${Date.now()}`,
        sessionId: sessionId || `claude-${Date.now()}`,
        startTime: new Date().toISOString(),
        status: 'active',
        filesModified: 0,
        linesChanged: 0,
        commands: 0,
        events: [],
        ...data
      }
      sessions.push(newSession)
      return NextResponse.json(newSession)
    } else if (action === 'update') {
      // Update an existing session
      const sessionIndex = sessions.findIndex(s => s.sessionId === sessionId)
      if (sessionIndex === -1) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }

      sessions[sessionIndex] = {
        ...sessions[sessionIndex],
        ...data
      }
      return NextResponse.json(sessions[sessionIndex])
    } else if (action === 'end') {
      // End a session
      const sessionIndex = sessions.findIndex(s => s.sessionId === sessionId)
      if (sessionIndex === -1) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }

      sessions[sessionIndex] = {
        ...sessions[sessionIndex],
        endTime: new Date().toISOString(),
        status: 'completed',
        duration: calculateDuration(sessions[sessionIndex].startTime, new Date().toISOString()),
        ...data
      }
      return NextResponse.json(sessions[sessionIndex])
    } else if (action === 'addEvent') {
      // Add an event to a session
      let sessionIndex = sessions.findIndex(s => s.sessionId === sessionId)

      // If session doesn't exist, create it
      if (sessionIndex === -1) {
        const newSession = {
          id: `session-${Date.now()}`,
          sessionId: sessionId,
          startTime: new Date().toISOString(),
          status: 'active',
          filesModified: 0,
          linesChanged: 0,
          commands: 0,
          events: [],
          summary: 'Auto-tracked session'
        }
        sessions.push(newSession)
        sessionIndex = sessions.length - 1
      }

      const event = {
        id: `event-${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...data
      }

      sessions[sessionIndex].events.push(event)

      // Update stats based on event type
      if (data.type === 'file_edit') {
        sessions[sessionIndex].filesModified++
        sessions[sessionIndex].linesChanged += (data.linesAdded || 0) + (data.linesRemoved || 0)
      } else if (data.type === 'command') {
        sessions[sessionIndex].commands++
      }

      return NextResponse.json(sessions[sessionIndex])
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Failed to manage session:', error)
    return NextResponse.json({ error: 'Failed to manage session' }, { status: 500 })
  }
}

function calculateDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  const diff = end - start

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}