'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

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

interface Metric {
  healthScore: number
  healthTrend?: number
  healthEventCount: number
  healthConfidence: number
  healthMetricId?: string
  growthRate: number
  growthTrend?: number
  growthEventCount: number
  growthConfidence: number
  growthMetricId?: string
  coverage: number
  coverageTrend?: number
  coverageEventCount: number
  coverageConfidence: number
  coverageMetricId?: string
  dependencyHealth: number
  dependencyTrend?: number
  dependencyEventCount: number
  dependencyConfidence: number
  dependencyMetricId?: string
  forest?: {
    trees: Array<{
      id: string
      name: string
      health: number
      coverage: number
      complexity: number
      linesOfCode: number
      dependencies: string[]
      circularDeps: number
    }>
  }
  insights?: Array<{
    id: string
    message: string
    severity: 'info' | 'warning' | 'error'
    timestamp: string
  }>
  growthRings?: Array<{
    date: string
    growth: number
    health: number
  }>
}

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

export function useRealtimeData() {
  const [events, setEvents] = useState<Event[]>([])
  const [metrics, setMetrics] = useState<Metric>({
    healthScore: 85,
    healthTrend: 5,
    healthEventCount: 142,
    healthConfidence: 92,
    growthRate: 120,
    growthTrend: 8,
    growthEventCount: 89,
    growthConfidence: 87,
    coverage: 78,
    coverageTrend: -2,
    coverageEventCount: 56,
    coverageConfidence: 95,
    dependencyHealth: 92,
    dependencyTrend: 0,
    dependencyEventCount: 23,
    dependencyConfidence: 88,
    forest: {
      trees: [
        {
          id: 'auth-module',
          name: 'Auth',
          health: 95,
          coverage: 88,
          complexity: 45,
          linesOfCode: 2340,
          dependencies: ['Database', 'Redis'],
          circularDeps: 0,
        },
        {
          id: 'database-module',
          name: 'Database',
          health: 78,
          coverage: 72,
          complexity: 68,
          linesOfCode: 4560,
          dependencies: [],
          circularDeps: 0,
        },
        {
          id: 'api-module',
          name: 'API',
          health: 82,
          coverage: 75,
          complexity: 52,
          linesOfCode: 3420,
          dependencies: ['Auth', 'Database', 'Cache'],
          circularDeps: 1,
        },
        {
          id: 'frontend-module',
          name: 'Frontend',
          health: 68,
          coverage: 65,
          complexity: 72,
          linesOfCode: 8920,
          dependencies: ['API', 'Auth'],
          circularDeps: 0,
        },
        {
          id: 'cache-module',
          name: 'Cache',
          health: 92,
          coverage: 95,
          complexity: 28,
          linesOfCode: 980,
          dependencies: ['Redis'],
          circularDeps: 0,
        },
        {
          id: 'redis-module',
          name: 'Redis',
          health: 88,
          coverage: 80,
          complexity: 35,
          linesOfCode: 1250,
          dependencies: [],
          circularDeps: 0,
        },
        {
          id: 'worker-module',
          name: 'Worker',
          health: 45,
          coverage: 42,
          complexity: 85,
          linesOfCode: 5670,
          dependencies: ['Database', 'Cache', 'API'],
          circularDeps: 2,
        },
        {
          id: 'analytics-module',
          name: 'Analytics',
          health: 72,
          coverage: 68,
          complexity: 62,
          linesOfCode: 3890,
          dependencies: ['Database', 'Worker'],
          circularDeps: 0,
        },
      ],
    },
    insights: [
      {
        id: '1',
        message: 'Worker module health critically low - consider refactoring',
        severity: 'error',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        message: 'Circular dependency detected between API and Worker modules',
        severity: 'warning',
        timestamp: new Date().toISOString(),
      },
    ],
    growthRings: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      growth: Math.floor(Math.random() * 50 + 30),
      health: Math.floor(Math.random() * 30 + 70),
    })).reverse(),
  })
  const [sessions, setSessions] = useState<Session[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080')
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)

          if (message.type === 'event') {
            const newEvent: Event = {
              id: message.data.id || Math.random().toString(36).substr(2, 9),
              timestamp: message.data.timestamp || message.timestamp,
              category: message.data.category || 'unknown',
              action: message.data.action || 'unknown',
              label: message.data.label || '',
              value: message.data.value,
              confidence: message.data.confidence || 0.8,
              userId: message.data.userId || 'system',
              sourceType: message.data.sourceType || 'unknown',
            }

            setEvents(prev => [newEvent, ...prev].slice(0, 100))

            // Update metrics based on event
            if (message.data.category === 'analysis') {
              updateMetricsFromEvent(message.data)
            }
          }

          if (message.type === 'session') {
            const session: Session = {
              id: message.data.id || Math.random().toString(36).substr(2, 9),
              sessionId: message.data.sessionId,
              userId: message.data.userId || 'unknown',
              startTime: message.data.startTime,
              endTime: message.data.endTime,
              status: message.data.status || 'active',
              taskDescription: message.data.taskDescription,
              filesModified: message.data.filesModified || 0,
              eventsCount: message.data.eventsCount || 0,
            }

            setSessions(prev => {
              const existing = prev.findIndex(s => s.sessionId === session.sessionId)
              if (existing >= 0) {
                const updated = [...prev]
                updated[existing] = session
                return updated
              }
              return [session, ...prev].slice(0, 20)
            })
          }

          if (message.type === 'metrics') {
            setMetrics(prev => ({ ...prev, ...message.data }))
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        wsRef.current = null

        // Reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 5000)
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
      setIsConnected(false)

      // Retry connection
      reconnectTimeoutRef.current = setTimeout(connect, 5000)
    }
  }, [])

  const updateMetricsFromEvent = useCallback((eventData: any) => {
    setMetrics(prev => {
      const updated = { ...prev }

      // Update health score
      if (eventData.action === 'health_check') {
        updated.healthScore = eventData.value?.score || prev.healthScore
        updated.healthEventCount++
      }

      // Update coverage
      if (eventData.action === 'coverage_report') {
        updated.coverage = eventData.value?.coverage || prev.coverage
        updated.coverageEventCount++
      }

      // Update growth rate
      if (eventData.action === 'growth_calculation') {
        updated.growthRate = eventData.value?.rate || prev.growthRate
        updated.growthEventCount++
      }

      // Update dependency health
      if (eventData.action === 'dependency_scan') {
        updated.dependencyHealth = eventData.value?.health || prev.dependencyHealth
        updated.dependencyEventCount++
      }

      return updated
    })
  }, [])

  useEffect(() => {
    connect()

    // Generate sample events for demo
    const eventInterval = setInterval(() => {
      const sampleEvent: Event = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        category: ['code_change', 'analysis', 'decision', 'review'][Math.floor(Math.random() * 4)],
        action: ['file_edit', 'complexity_check', 'test_added', 'dependency_update'][Math.floor(Math.random() * 4)],
        label: ['Component updated', 'Tests passed', 'Refactoring complete', 'Security scan'][Math.floor(Math.random() * 4)],
        confidence: Math.random() * 0.3 + 0.7,
        userId: ['claude', 'user', 'system'][Math.floor(Math.random() * 3)],
        sourceType: 'claude_code',
      }
      setEvents(prev => [sampleEvent, ...prev].slice(0, 100))
    }, 3000)

    // Generate sample sessions
    const sessionInterval = setInterval(() => {
      const sampleSession: Session = {
        id: Math.random().toString(36).substr(2, 9),
        sessionId: `session_${Math.random().toString(36).substr(2, 9)}`,
        userId: ['claude', 'user'][Math.floor(Math.random() * 2)],
        startTime: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        status: Math.random() > 0.3 ? 'active' : 'completed',
        taskDescription: ['Refactoring auth module', 'Adding tests', 'Fixing bug'][Math.floor(Math.random() * 3)],
        filesModified: Math.floor(Math.random() * 10 + 1),
        eventsCount: Math.floor(Math.random() * 50 + 10),
      }
      setSessions(prev => {
        const updated = [...prev]
        if (updated.length > 0 && Math.random() > 0.5) {
          // Update existing session
          const idx = Math.floor(Math.random() * Math.min(3, updated.length))
          updated[idx] = {
            ...updated[idx],
            status: 'completed',
            endTime: new Date().toISOString(),
            eventsCount: updated[idx].eventsCount + Math.floor(Math.random() * 10),
          }
        } else {
          // Add new session
          updated.unshift(sampleSession)
        }
        return updated.slice(0, 20)
      })
    }, 5000)

    return () => {
      clearInterval(eventInterval)
      clearInterval(sessionInterval)
      clearTimeout(reconnectTimeoutRef.current)
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return {
    events,
    metrics,
    sessions,
    isConnected,
  }
}