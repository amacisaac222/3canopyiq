import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Track active WebSocket connections (in production, use Redis)
let activeConnections = new Set<string>()

export async function GET() {
  try {
    // Check if user is authenticated (allow in dev mode)
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('github_session')

    // In development, allow status check without auth
    if (!sessionCookie && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({
        connected: false,
        message: 'Not authenticated'
      })
    }

    // In production, check actual WebSocket connections via Redis
    // For now, just return the connection status
    return NextResponse.json({
      connected: activeConnections.size > 0,
      activeConnections: activeConnections.size,
      message: activeConnections.size > 0 ? 'Claude MCP server connected' : 'Waiting for Claude MCP connection'
    })
  } catch (error) {
    console.error('Failed to check Claude status:', error)
    return NextResponse.json({
      connected: false,
      message: 'Error checking status'
    }, { status: 500 })
  }
}

// For WebSocket connection tracking (called by WebSocket server)
export async function POST(request: Request) {
  try {
    const { connectionId, action } = await request.json()

    if (action === 'connect') {
      activeConnections.add(connectionId)
    } else if (action === 'disconnect') {
      activeConnections.delete(connectionId)
    }

    return NextResponse.json({
      success: true,
      activeConnections: activeConnections.size
    })
  } catch (error) {
    console.error('Failed to update connection status:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update status'
    }, { status: 500 })
  }
}