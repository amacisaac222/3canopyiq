'use client'

import { Users, Clock, FileCode, CheckCircle, XCircle, Loader } from 'lucide-react'

interface Session {
  id: string
  sessionId: string
  userId: string
  startTime: string
  endTime?: string
  status: 'active' | 'completed' | 'failed'
  taskDescription?: string
  filesModified: number
  eventsCount: number
}

interface SessionsPanelProps {
  sessions: Session[]
  onSessionClick?: (session: Session) => void
}

export function SessionsPanel({ sessions, onSessionClick }: SessionsPanelProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Loader className="w-4 h-4 text-accent animate-spin" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-text-muted" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'border-accent/30 bg-accent/5'
      case 'completed':
        return 'border-green-500/30 bg-green-500/5'
      case 'failed':
        return 'border-red-500/30 bg-red-500/5'
      default:
        return 'border-border bg-surface/30'
    }
  }

  const getDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime).getTime()
    const end = endTime ? new Date(endTime).getTime() : Date.now()
    const diff = end - start
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m`
  }

  const activeSessions = sessions.filter(s => s.status === 'active')
  const completedSessions = sessions.filter(s => s.status === 'completed')

  return (
    <div className="bg-surface/50 rounded-lg border border-border backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <h3 className="text-text font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-secondary" />
          Claude Sessions
        </h3>
        <div className="flex gap-4 mt-2 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            {activeSessions.length} active
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            {completedSessions.length} completed
          </span>
        </div>
      </div>

      {/* Session list */}
      <div className="max-h-[300px] overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-sm">
            No active sessions
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {sessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                onClick={() => onSessionClick?.(session)}
                className={`p-3 hover:bg-surface/50 cursor-pointer transition-colors border-l-2 ${
                  getStatusColor(session.status)
                }`}
              >
                {/* Session header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(session.status)}
                    <div>
                      <div className="text-sm font-medium text-text">
                        {session.userId === 'claude' ? '🤖' : '👤'} {session.userId}
                      </div>
                      <div className="text-xs text-text-muted">
                        {session.sessionId.slice(0, 12)}...
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-text-muted">
                    {getDuration(session.startTime, session.endTime)}
                  </span>
                </div>

                {/* Task description */}
                {session.taskDescription && (
                  <div className="text-xs text-text-muted mb-2 line-clamp-2">
                    {session.taskDescription}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <FileCode className="w-3 h-3" />
                    {session.filesModified} files
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {session.eventsCount} events
                  </span>
                  <span className="text-xs">
                    {new Date(session.startTime).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View all link */}
      {sessions.length > 5 && (
        <div className="p-3 border-t border-border/50 text-center">
          <button className="text-xs text-accent hover:text-accent/80 transition-colors">
            View all {sessions.length} sessions →
          </button>
        </div>
      )}
    </div>
  )
}