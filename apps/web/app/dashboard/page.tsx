'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DetailPanel from '@/components/DetailPanel'
import {
  GitPullRequest,
  GitMerge,
  GitPullRequestDraft,
  CheckCircle,
  Clock,
  MessageSquare,
  FileText,
  Code2,
  Activity,
  Terminal,
  AlertCircle,
  Eye,
  ChevronRight,
  Plus,
  Filter,
  Search,
  ExternalLink,
  Zap
} from 'lucide-react'

interface PullRequest {
  id: number
  number: number
  title: string
  description: string
  state: 'open' | 'closed' | 'merged'
  draft: boolean
  author: {
    login: string
    avatar_url: string
  }
  repository: string
  created_at: string
  updated_at: string
  merged_at?: string
  additions: number
  deletions: number
  changed_files: number
  comments: number
  reviews: number
  mergeable: boolean
  labels: string[]
  sessionId?: string
  documentation_status: 'pending' | 'in_progress' | 'completed'
}

interface ClaudeSession {
  id: string
  sessionId: string
  startTime: string
  endTime?: string
  status: 'active' | 'completed'
  filesModified: number
  linesChanged: number
  commands: number
  events?: any[]
}

export default function DashboardOverview() {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([])
  const [sessions, setSessions] = useState<ClaudeSession[]>([])
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null)
  const [selectedSession, setSelectedSession] = useState<ClaudeSession | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [filterState, setFilterState] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const loadData = () => {
      // Load pull requests
      fetch('/api/github/pulls')
        .then(res => res.json())
        .then(data => {
          setPullRequests(Array.isArray(data) ? data : [])
          setLoading(false)
        })
        .catch(() => {
          setPullRequests([])
          setLoading(false)
        })

      // Load Claude sessions
      fetch('/api/claude/sessions?limit=10')
        .then(res => res.json())
        .then(data => {
          setSessions(Array.isArray(data) ? data : [])
        })
        .catch(() => {
          setSessions([])
        })
    }

    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  // Load session data when PR is selected
  useEffect(() => {
    if (selectedPR?.sessionId) {
      const session = sessions.find(s => s.sessionId === selectedPR.sessionId)
      if (session) {
        setSelectedSession(session)
      }
    }
  }, [selectedPR, sessions])

  const filteredPRs = pullRequests.filter(pr => {
    const matchesSearch = searchTerm === '' ||
      pr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterState === 'all' ||
      (filterState === 'open' && pr.state === 'open') ||
      (filterState === 'merged' && pr.state === 'merged') ||
      (filterState === 'draft' && pr.draft)

    return matchesSearch && matchesFilter
  })

  const getStateIcon = (pr: PullRequest) => {
    if (pr.state === 'merged') return <GitMerge className="w-4 h-4 text-purple-500" />
    if (pr.draft) return <GitPullRequestDraft className="w-4 h-4 text-gray-500" />
    return <GitPullRequest className="w-4 h-4 text-green-500" />
  }

  const getStateColor = (pr: PullRequest) => {
    if (pr.state === 'merged') return 'bg-purple-500/10 text-purple-500'
    if (pr.draft) return 'bg-gray-500/10 text-gray-500'
    if (pr.state === 'open') return 'bg-green-500/10 text-green-500'
    return 'bg-red-500/10 text-red-500'
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text">Pull Requests</h1>
              <p className="text-sm text-text-muted mt-1">
                Manage pull requests and their documentation
              </p>
            </div>
            <Link
              href="/dashboard/prs/new"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create PR
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Compact Pipeline Status */}
        <div className="mb-6 bg-surface/50 border border-border rounded-lg p-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Claude Sessions</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {sessions.filter(s => s.status === 'active').length} active
              </span>
            </div>
            <Zap className="w-3 h-3 text-text-muted" />
            <div className="flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Pull Requests</span>
              <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
                {pullRequests.filter(pr => pr.state === 'open').length} open
              </span>
            </div>
            <Zap className="w-3 h-3 text-text-muted" />
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Documentation</span>
              <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                {pullRequests.filter(pr => pr.documentation_status === 'completed').length} completed
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search pull requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-muted" />
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">All PRs</option>
              <option value="open">Open</option>
              <option value="merged">Merged</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
        </div>

        {/* Pull Requests List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Activity className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : filteredPRs.length === 0 ? (
          <div className="bg-surface/50 border border-border rounded-xl p-12 text-center">
            <GitPullRequest className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No pull requests found</h3>
            <p className="text-text-muted max-w-md mx-auto">
              {searchTerm ? 'Try adjusting your search or filters' : 'Create your first pull request to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPRs.map((pr) => (
              <div
                key={pr.id}
                onClick={() => {
                  setSelectedPR(pr)
                  setActiveTab('overview')
                }}
                className="bg-surface/50 border border-border rounded-xl p-6 hover:border-primary/50 cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getStateColor(pr)}`}>
                        {getStateIcon(pr)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-text group-hover:text-primary transition-colors">
                            {pr.title}
                          </h3>
                          <span className="text-sm text-text-muted">
                            #{pr.number}
                          </span>
                        </div>
                        <p className="text-sm text-text-muted mb-3">{pr.description}</p>

                        <div className="flex items-center gap-4 text-xs text-text-muted">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Updated {new Date(pr.updated_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {pr.comments}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {pr.reviews}
                          </span>
                          <span>
                            +{pr.additions} -{pr.deletions} in {pr.changed_files} files
                          </span>
                        </div>

                        {/* Labels */}
                        {pr.labels.length > 0 && (
                          <div className="flex items-center gap-2 mt-3">
                            {pr.labels.map(label => (
                              <span
                                key={label}
                                className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 ml-4">
                    {/* Documentation Status */}
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${
                      pr.documentation_status === 'completed'
                        ? 'bg-green-500/10 text-green-500'
                        : pr.documentation_status === 'in_progress'
                        ? 'bg-yellow-500/10 text-yellow-500'
                        : 'bg-gray-500/10 text-gray-500'
                    }`}>
                      {pr.documentation_status === 'completed' ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Documented
                        </>
                      ) : pr.documentation_status === 'in_progress' ? (
                        <>
                          <Clock className="w-3 h-3" />
                          In Progress
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          Pending
                        </>
                      )}
                    </div>

                    {/* Linked Session */}
                    {pr.sessionId && (
                      <div className="flex items-center gap-1 text-xs text-primary">
                        <Terminal className="w-3 h-3" />
                        Claude Session
                      </div>
                    )}

                    <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Panel */}
      <DetailPanel
        isOpen={!!selectedPR}
        onClose={() => {
          setSelectedPR(null)
          setSelectedSession(null)
        }}
        title={selectedPR?.title || ''}
        tabs={selectedPR ? [
          { id: 'overview', label: 'Overview', content: (
            <div className="space-y-6">
              {/* PR Details */}
              <div>
                <h3 className="font-semibold text-text mb-3">Pull Request Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-text-muted">Status</span>
                    <span className={`flex items-center gap-1 text-sm ${getStateColor(selectedPR)}`}>
                      {getStateIcon(selectedPR)}
                      {selectedPR.state === 'merged' ? 'Merged' : selectedPR.draft ? 'Draft' : 'Open'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-text-muted">Repository</span>
                    <span className="text-sm text-text">{selectedPR.repository}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-text-muted">Author</span>
                    <span className="text-sm text-text">{selectedPR.author.login}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-text-muted">Changes</span>
                    <span className="text-sm text-text">
                      +{selectedPR.additions} -{selectedPR.deletions} in {selectedPR.changed_files} files
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                  <ExternalLink className="w-4 h-4" />
                  View on GitHub
                </button>
                {selectedPR.sessionId && (
                  <button
                    onClick={() => setActiveTab('session')}
                    className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg hover:bg-surface-hover transition-colors"
                  >
                    <Terminal className="w-4 h-4" />
                    View Session
                  </button>
                )}
              </div>
            </div>
          )},
          { id: 'session', label: 'Claude Session', content: selectedSession ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-text mb-3">Session Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-text-muted">Session ID</span>
                    <span className="text-sm text-text font-mono">{selectedSession.sessionId}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-text-muted">Status</span>
                    <span className={`text-sm ${selectedSession.status === 'active' ? 'text-green-500' : 'text-blue-500'}`}>
                      {selectedSession.status}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-text-muted">Files Modified</span>
                    <span className="text-sm text-text">{selectedSession.filesModified}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-text-muted">Lines Changed</span>
                    <span className="text-sm text-text">{selectedSession.linesChanged}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-text-muted">Commands Run</span>
                    <span className="text-sm text-text">{selectedSession.commands}</span>
                  </div>
                </div>
              </div>

              {/* Session Timeline */}
              {selectedSession.events && selectedSession.events.length > 0 && (
                <div>
                  <h3 className="font-semibold text-text mb-3">Timeline</h3>
                  <div className="space-y-3">
                    {selectedSession.events.slice(0, 10).map((event: any, index: number) => (
                      <div key={event.id || index} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          {event.type === 'file_edit' ? (
                            <FileText className="w-4 h-4 text-primary" />
                          ) : event.type === 'command' ? (
                            <Terminal className="w-4 h-4 text-green-500" />
                          ) : (
                            <Activity className="w-4 h-4 text-secondary" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-text">{event.description}</p>
                          <p className="text-xs text-text-muted mt-1">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-text-muted">
              No session data available
            </div>
          )},
          { id: 'documentation', label: 'Documentation', content: (
            <div className="space-y-6">
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h3 className="font-semibold text-text mb-2">Documentation</h3>
                <p className="text-sm text-text-muted mb-4">
                  {selectedPR.documentation_status === 'completed'
                    ? 'Documentation has been generated for this PR'
                    : 'Documentation will be auto-generated from the Claude session'}
                </p>
                {selectedPR.documentation_status !== 'completed' && (
                  <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                    Generate Documentation
                  </button>
                )}
              </div>
            </div>
          )}
        ] : []}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  )
}