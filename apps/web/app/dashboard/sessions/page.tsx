'use client'

import { useState, useEffect } from 'react'
import {
  Code2,
  Clock,
  FileText,
  GitBranch,
  Activity,
  Terminal,
  CheckCircle,
  AlertCircle,
  Search,
  Calendar,
  ArrowRight,
  Link2,
  Database,
  Zap,
  Copy,
  Check
} from 'lucide-react'

interface ClaudeSession {
  id: string
  sessionId: string
  startTime: string
  endTime?: string
  duration?: string
  status: 'active' | 'completed' | 'error'
  filesModified: number
  linesChanged: number
  commands: number
  prNumber?: number
  prTitle?: string
  repository?: string
  summary?: string
  events: SessionEvent[]
}

interface SessionEvent {
  id: string
  timestamp: string
  type: 'file_edit' | 'command' | 'search' | 'read' | 'pr_created' | 'commit'
  description: string
  details?: any
}

export default function ClaudeSessionsPage() {
  const [sessions, setSessions] = useState<ClaudeSession[]>([])
  const [selectedSession, setSelectedSession] = useState<ClaudeSession | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [timeFilter, setTimeFilter] = useState('all')
  const [isConnected, setIsConnected] = useState(false)
  const [copied, setCopied] = useState(false)

  // Check Claude connection status
  useEffect(() => {
    // This will be replaced with actual WebSocket connection
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/claude/status')
        if (response.ok) {
          const data = await response.json()
          setIsConnected(data.connected)
        }
      } catch (error) {
        console.error('Failed to check Claude connection:', error)
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  // Load sessions from API with polling for real-time updates
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const response = await fetch('/api/claude/sessions')
        if (response.ok) {
          const data = await response.json()
          // Ensure data is an array
          setSessions(Array.isArray(data) ? data : [])
        } else {
          setSessions([])
        }
      } catch (error) {
        console.error('Failed to load sessions:', error)
        setSessions([])
      }
    }

    loadSessions()
    // Poll every 2 seconds for real-time updates
    const interval = setInterval(loadSessions, 2000)

    return () => clearInterval(interval)
  }, [])

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = searchTerm === '' ||
      session.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.prTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.repository?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTime = timeFilter === 'all' ||
      (timeFilter === 'today' && new Date(session.startTime).toDateString() === new Date().toDateString()) ||
      (timeFilter === 'week' && new Date(session.startTime) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))

    return matchesSearch && matchesTime
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text">Claude Sessions</h1>
              <p className="text-sm text-text-muted mt-1">
                Track your Claude Code sessions and their connection to PR documentation
              </p>
            </div>
            <div className="flex items-center gap-3">
              {sessions.some(s => s.status === 'active') && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 animate-pulse">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                  <span className="text-sm font-medium text-green-500">
                    Tracking Active
                  </span>
                </div>
              )}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                sessions.length > 0 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
              }`}>
                <Activity className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {sessions.length > 0 ? `${sessions.length} Sessions` : 'Waiting for sessions'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm"
          >
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="week">This week</option>
          </select>
        </div>

        {/* Connection Setup Message */}
        {!isConnected && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <Terminal className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-text mb-2">Connect Claude Code</h3>
                <p className="text-sm text-text-muted mb-4">
                  To start tracking your Claude Code sessions, add the CanopyIQ MCP server to your Claude Code configuration.
                </p>
                <div className="bg-surface/50 border border-border rounded-lg p-4 mb-4 relative">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-mono text-text-muted">Add to your Claude Code config:</p>
                    <button
                      onClick={() => {
                        const config = {
                          mcpServers: {
                            canopyiq: {
                              command: "npx",
                              args: ["@canopyiq/mcp-server"],
                              env: {
                                CANOPYIQ_API_KEY: "your-api-key",
                                CANOPYIQ_ENDPOINT: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'}/api/claude`
                              }
                            }
                          }
                        }
                        navigator.clipboard.writeText(JSON.stringify(config, null, 2))
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-sm font-mono bg-black/50 p-3 rounded overflow-x-auto">
                    <code className="text-green-400">{JSON.stringify({
  mcpServers: {
    canopyiq: {
      command: "npx",
      args: ["@canopyiq/mcp-server"],
      env: {
        CANOPYIQ_API_KEY: "your-api-key",
        CANOPYIQ_ENDPOINT: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'}/api/claude`
      }
    }
  }
}, null, 2)}</code>
                  </pre>
                </div>
                <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm">
                  View Setup Instructions
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <div className="bg-surface/50 border border-border rounded-xl p-12 text-center">
            <Code2 className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Sessions Yet</h3>
            <p className="text-text-muted max-w-md mx-auto">
              {searchTerm
                ? 'No sessions match your search'
                : 'Claude Code sessions will appear here once you start coding with the CanopyIQ MCP server connected.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sessions List */}
            <div className="lg:col-span-2 space-y-4">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`bg-surface/50 border rounded-xl p-6 cursor-pointer transition-all ${
                    selectedSession?.id === session.id
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        session.status === 'active'
                          ? 'bg-green-500/10'
                          : session.status === 'completed'
                          ? 'bg-blue-500/10'
                          : 'bg-red-500/10'
                      }`}>
                        {session.status === 'active' ? (
                          <Activity className="w-5 h-5 text-green-500" />
                        ) : session.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-text">Session {session.sessionId.slice(0, 8)}</p>
                          {session.status === 'active' && (
                            <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-500 rounded-full font-medium animate-pulse">
                              LIVE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted">
                          {new Date(session.startTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {session.duration && (
                      <div className="flex items-center gap-1 text-sm text-text-muted">
                        <Clock className="w-4 h-4" />
                        <span>{session.duration}</span>
                      </div>
                    )}
                  </div>

                  {session.summary && (
                    <p className="text-sm text-text-muted mb-3">{session.summary}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-text-muted">
                      <FileText className="w-3 h-3" />
                      {session.filesModified} files
                    </span>
                    <span className="flex items-center gap-1 text-text-muted">
                      <Code2 className="w-3 h-3" />
                      {session.linesChanged} lines
                    </span>
                    <span className="flex items-center gap-1 text-text-muted">
                      <Terminal className="w-3 h-3" />
                      {session.commands} commands
                    </span>
                  </div>

                  {session.prNumber && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-4 h-4 text-primary" />
                          <span className="text-sm text-primary">
                            PR #{session.prNumber}: {session.prTitle}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-text-muted" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Session Details Panel */}
            {selectedSession && (
              <div className="bg-surface/50 border border-border rounded-xl p-6">
                <h3 className="font-semibold text-text mb-4">Session Timeline</h3>
                <div className="space-y-3">
                  {selectedSession.events.map((event, index) => (
                    <div key={event.id} className="relative">
                      {index < selectedSession.events.length - 1 && (
                        <div className="absolute left-4 top-8 w-0.5 h-full bg-border" />
                      )}
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          event.type === 'file_edit'
                            ? 'bg-blue-500/10'
                            : event.type === 'command'
                            ? 'bg-green-500/10'
                            : event.type === 'pr_created'
                            ? 'bg-primary/10'
                            : 'bg-surface'
                        }`}>
                          {event.type === 'file_edit' ? (
                            <FileText className="w-4 h-4 text-blue-500" />
                          ) : event.type === 'command' ? (
                            <Terminal className="w-4 h-4 text-green-500" />
                          ) : event.type === 'pr_created' ? (
                            <GitBranch className="w-4 h-4 text-primary" />
                          ) : (
                            <Activity className="w-4 h-4 text-text-muted" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm text-text">{event.description}</p>
                          <p className="text-xs text-text-muted mt-1">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedSession.prNumber && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <h4 className="text-sm font-medium text-text mb-3">Data Lineage</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Database className="w-4 h-4 text-text-muted" />
                        <span className="text-text-muted">Session tracked</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Link2 className="w-4 h-4 text-text-muted" />
                        <span className="text-text-muted">Linked to PR #{selectedSession.prNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="w-4 h-4 text-text-muted" />
                        <span className="text-text-muted">Documentation generated</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 bg-surface/50 border border-border rounded-xl p-6">
          <h3 className="font-semibold text-text mb-4">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <Terminal className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm text-text mb-1">1. Code with Claude</p>
                <p className="text-xs text-text-muted">
                  Use Claude Code with the CanopyIQ MCP server to track your coding sessions
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm text-text mb-1">2. Track Changes</p>
                <p className="text-xs text-text-muted">
                  All file edits, commands, and searches are logged with full context
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm text-text mb-1">3. Auto-Document</p>
                <p className="text-xs text-text-muted">
                  When you create a PR, documentation is automatically generated from the session
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}