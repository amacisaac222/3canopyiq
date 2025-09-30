'use client'

import { useState, useEffect } from 'react'
import {
  FileText,
  Search,
  Terminal,
  AlertCircle,
  CheckCircle,
  GitBranch,
  Clock,
  Activity,
  Code2,
  Zap,
  Eye,
  RefreshCw,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  Lightbulb
} from 'lucide-react'

interface SessionEvent {
  id: string
  type: string
  subtype?: string
  description: string
  timestamp: string
  metadata?: any
}

interface JourneyViewProps {
  events: SessionEvent[]
  insights?: any
  className?: string
}

export default function JourneyView({ events, insights, className = '' }: JourneyViewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['exploration', 'solutions']))
  const [selectedEvent, setSelectedEvent] = useState<SessionEvent | null>(null)

  // Group events by type and phase
  const groupedEvents = groupEvents(events)
  const timeline = createTimeline(events)
  const patterns = detectPatterns(events)

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Journey Overview */}
      {insights && (
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 rounded-xl p-6">
          <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Journey Insights
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface/50 rounded-lg p-3">
              <p className="text-xs text-text-muted">Exploration Depth</p>
              <p className="text-xl font-bold text-primary">{insights.explorationDepth || 0}</p>
              <p className="text-xs text-text-muted">files explored</p>
            </div>
            <div className="bg-surface/50 rounded-lg p-3">
              <p className="text-xs text-text-muted">Search Complexity</p>
              <p className="text-xl font-bold text-secondary">{insights.searchPatterns || 0}</p>
              <p className="text-xs text-text-muted">search patterns</p>
            </div>
            <div className="bg-surface/50 rounded-lg p-3">
              <p className="text-xs text-text-muted">Iterations</p>
              <p className="text-xl font-bold text-accent">{insights.failedAttempts || 0}</p>
              <p className="text-xs text-text-muted">attempts made</p>
            </div>
            <div className="bg-surface/50 rounded-lg p-3">
              <p className="text-xs text-text-muted">Time to Solution</p>
              <p className="text-xl font-bold text-green-500">{insights.timeToSolution || 0}m</p>
              <p className="text-xs text-text-muted">minutes</p>
            </div>
          </div>
        </div>
      )}

      {/* Pattern Detection */}
      {patterns.length > 0 && (
        <div className="bg-surface/50 border border-border rounded-xl p-6">
          <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Detected Patterns
          </h3>
          <div className="space-y-2">
            {patterns.map((pattern, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-text-muted">{pattern}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exploration Phase */}
      <div className="bg-surface/50 border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('exploration')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-text">Exploration & Discovery</h3>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              {groupedEvents.exploration?.length || 0} events
            </span>
          </div>
          {expandedSections.has('exploration') ? (
            <ChevronDown className="w-5 h-5 text-text-muted" />
          ) : (
            <ChevronRight className="w-5 h-5 text-text-muted" />
          )}
        </button>

        {expandedSections.has('exploration') && groupedEvents.exploration && (
          <div className="px-6 pb-4 space-y-3">
            {groupedEvents.exploration.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isSelected={selectedEvent?.id === event.id}
                onClick={() => setSelectedEvent(event)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Search Patterns */}
      {groupedEvents.searches && groupedEvents.searches.length > 0 && (
        <div className="bg-surface/50 border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('searches')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-secondary" />
              <h3 className="font-semibold text-text">Search & Investigation</h3>
              <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">
                {groupedEvents.searches.length} searches
              </span>
            </div>
            {expandedSections.has('searches') ? (
              <ChevronDown className="w-5 h-5 text-text-muted" />
            ) : (
              <ChevronRight className="w-5 h-5 text-text-muted" />
            )}
          </button>

          {expandedSections.has('searches') && (
            <div className="px-6 pb-4 space-y-3">
              {groupedEvents.searches.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isSelected={selectedEvent?.id === event.id}
                  onClick={() => setSelectedEvent(event)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Failed Attempts & Recovery */}
      {groupedEvents.failures && groupedEvents.failures.length > 0 && (
        <div className="bg-surface/50 border border-red-500/20 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('failures')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-text">Challenges & Recovery</h3>
              <span className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded-full">
                {groupedEvents.failures.length} attempts
              </span>
            </div>
            {expandedSections.has('failures') ? (
              <ChevronDown className="w-5 h-5 text-text-muted" />
            ) : (
              <ChevronRight className="w-5 h-5 text-text-muted" />
            )}
          </button>

          {expandedSections.has('failures') && (
            <div className="px-6 pb-4 space-y-3">
              {groupedEvents.failures.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isSelected={selectedEvent?.id === event.id}
                  onClick={() => setSelectedEvent(event)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Solutions & Implementations */}
      <div className="bg-surface/50 border border-green-500/20 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('solutions')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-text">Solutions & Changes</h3>
            <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded-full">
              {groupedEvents.solutions?.length || 0} edits
            </span>
          </div>
          {expandedSections.has('solutions') ? (
            <ChevronDown className="w-5 h-5 text-text-muted" />
          ) : (
            <ChevronRight className="w-5 h-5 text-text-muted" />
          )}
        </button>

        {expandedSections.has('solutions') && groupedEvents.solutions && (
          <div className="px-6 pb-4 space-y-3">
            {groupedEvents.solutions.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isSelected={selectedEvent?.id === event.id}
                onClick={() => setSelectedEvent(event)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Event Details Panel */}
      {selectedEvent && (
        <div className="bg-surface border border-primary/30 rounded-xl p-6">
          <h4 className="font-semibold text-text mb-3">Event Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-text-muted">Type</span>
              <span className="text-text">{selectedEvent.type}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-text-muted">Time</span>
              <span className="text-text">{new Date(selectedEvent.timestamp).toLocaleTimeString()}</span>
            </div>
            {selectedEvent.metadata && (
              <div className="pt-3">
                <p className="text-text-muted mb-2">Metadata</p>
                <pre className="bg-black/30 p-3 rounded text-xs text-green-400 overflow-x-auto">
                  {JSON.stringify(selectedEvent.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Event Card Component
function EventCard({ event, isSelected, onClick }: {
  event: SessionEvent
  isSelected: boolean
  onClick: () => void
}) {
  const icon = getEventIcon(event.type, event.subtype)
  const color = getEventColor(event.type)

  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
        isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-surface/80'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text">{event.description}</p>
        {event.metadata?.pattern && (
          <p className="text-xs text-text-muted mt-1 font-mono">Pattern: {event.metadata.pattern}</p>
        )}
        {event.metadata?.resultCount !== undefined && (
          <p className="text-xs text-text-muted mt-1">{event.metadata.resultCount} results</p>
        )}
        {event.metadata?.linesAdded !== undefined && (
          <p className="text-xs text-text-muted mt-1">
            +{event.metadata.linesAdded} -{event.metadata.linesRemoved || 0}
          </p>
        )}
      </div>
      <span className="text-xs text-text-muted">
        {new Date(event.timestamp).toLocaleTimeString()}
      </span>
    </div>
  )
}

// Helper functions
function groupEvents(events: SessionEvent[]) {
  return {
    exploration: events.filter(e => e.type === 'exploration'),
    searches: events.filter(e => e.type === 'search'),
    failures: events.filter(e =>
      e.type === 'failed_attempt' ||
      (e.type === 'command' && e.metadata?.hasError)
    ),
    solutions: events.filter(e => e.type === 'file_edit'),
    decisions: events.filter(e => e.type === 'decision')
  }
}

function createTimeline(events: SessionEvent[]) {
  // Create a timeline visualization data structure
  return events.map((event, index) => ({
    ...event,
    position: index,
    relativeTime: index > 0 ?
      new Date(event.timestamp).getTime() - new Date(events[0].timestamp).getTime() : 0
  }))
}

function detectPatterns(events: SessionEvent[]) {
  const patterns: string[] = []

  // Detect exploration before edit pattern
  const explorations = events.filter(e => e.type === 'exploration')
  const edits = events.filter(e => e.type === 'file_edit')
  if (explorations.length > edits.length * 2) {
    patterns.push('Thorough exploration before implementation')
  }

  // Detect search-driven development
  const searches = events.filter(e => e.type === 'search')
  if (searches.length > 5) {
    patterns.push('Search-driven problem solving')
  }

  // Detect iterative approach
  const failures = events.filter(e => e.type === 'failed_attempt')
  if (failures.length > 0) {
    patterns.push(`Iterative refinement (${failures.length} attempts)`)
  }

  // Detect revisits
  const revisits = events.filter(e =>
    e.type === 'exploration' && e.metadata?.isRevisit
  )
  if (revisits.length > 0) {
    patterns.push('Multiple file revisits for verification')
  }

  return patterns
}

function getEventIcon(type: string, subtype?: string) {
  switch (type) {
    case 'exploration':
      return <FileText className="w-4 h-4 text-primary" />
    case 'search':
      return <Search className="w-4 h-4 text-secondary" />
    case 'file_edit':
      return <Code2 className="w-4 h-4 text-green-500" />
    case 'command':
      return <Terminal className="w-4 h-4 text-blue-500" />
    case 'failed_attempt':
      return <AlertCircle className="w-4 h-4 text-red-500" />
    case 'decision':
      return <GitBranch className="w-4 h-4 text-purple-500" />
    default:
      return <Activity className="w-4 h-4 text-text-muted" />
  }
}

function getEventColor(type: string) {
  switch (type) {
    case 'exploration':
      return 'bg-primary/10'
    case 'search':
      return 'bg-secondary/10'
    case 'file_edit':
      return 'bg-green-500/10'
    case 'command':
      return 'bg-blue-500/10'
    case 'failed_attempt':
      return 'bg-red-500/10'
    case 'decision':
      return 'bg-purple-500/10'
    default:
      return 'bg-surface'
  }
}