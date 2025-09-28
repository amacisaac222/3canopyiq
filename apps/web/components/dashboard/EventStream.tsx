'use client'

import { useState, useEffect, useRef } from 'react'
import { Activity, Code, GitBranch, FileEdit, Shield, Zap, ChevronRight } from 'lucide-react'

interface Event {
  id: string
  timestamp: string
  category: string
  action: string
  label: string
  value?: any
  confidence: number
  userId: string
  sourceType: string
}

interface EventStreamProps {
  events: Event[]
  onEventClick?: (event: Event) => void
}

export function EventStream({ events, onEventClick }: EventStreamProps) {
  const [filter, setFilter] = useState<string>('all')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  // Auto-scroll to latest events
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [events, autoScroll])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'code_change':
        return <Code className="w-4 h-4" />
      case 'analysis':
        return <Shield className="w-4 h-4" />
      case 'decision':
        return <Zap className="w-4 h-4" />
      case 'review':
        return <GitBranch className="w-4 h-4" />
      default:
        return <FileEdit className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'code_change':
        return 'text-accent border-accent/30 bg-accent/10'
      case 'analysis':
        return 'text-secondary border-secondary/30 bg-secondary/10'
      case 'decision':
        return 'text-primary border-primary/30 bg-primary/10'
      case 'review':
        return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10'
      default:
        return 'text-text-muted border-border bg-surface/30'
    }
  }

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(e => e.category === filter)

  const categories = ['all', 'code_change', 'analysis', 'decision', 'review']

  return (
    <div className="bg-surface/50 rounded-lg border border-border backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-text font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            Event Stream
          </h3>
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              autoScroll
                ? 'bg-accent/20 text-accent border border-accent/30'
                : 'bg-surface text-text-muted border border-border'
            }`}
          >
            {autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                filter === cat
                  ? 'bg-accent text-background'
                  : 'bg-surface/50 text-text-muted hover:bg-surface'
              }`}
            >
              {cat === 'all' ? 'All' : cat.replace('_', ' ')}
              {cat === 'all' && (
                <span className="ml-1 opacity-60">({events.length})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Event list */}
      <div
        ref={scrollRef}
        className="h-[400px] overflow-y-auto p-2 space-y-2"
        onScroll={(e) => {
          const target = e.currentTarget
          if (target.scrollTop > 50) {
            setAutoScroll(false)
          }
        }}
      >
        {filteredEvents.length === 0 ? (
          <div className="text-center text-text-muted py-8">
            No events to display
          </div>
        ) : (
          filteredEvents.map((event, index) => (
            <div
              key={event.id}
              onClick={() => onEventClick?.(event)}
              className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md hover:scale-[1.02] ${
                getCategoryColor(event.category)
              } ${
                index === 0 ? 'animate-slideIn' : ''
              }`}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              {/* Event header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(event.category)}
                  <span className="font-medium text-sm">
                    {event.action.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      event.confidence > 0.8
                        ? 'bg-green-500'
                        : event.confidence > 0.6
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    title={`Confidence: ${(event.confidence * 100).toFixed(0)}%`}
                  />
                  <ChevronRight className="w-3 h-3 text-text-muted" />
                </div>
              </div>

              {/* Event details */}
              <div className="text-xs text-text-muted mb-1">
                {event.label}
              </div>

              {/* Event metadata */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-text-muted">
                    {event.userId === 'claude' ? '🤖' : '👤'} {event.userId}
                  </span>
                  <span className="text-text-muted">
                    {event.sourceType}
                  </span>
                </div>
                <span className="text-text-muted">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer stats */}
      <div className="p-3 border-t border-border/50 flex items-center justify-between text-xs text-text-muted">
        <span>{filteredEvents.length} events shown</span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          Live streaming
        </span>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}