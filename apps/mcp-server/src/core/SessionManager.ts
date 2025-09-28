import { nanoid } from 'nanoid'
import Redis from 'ioredis'
import { db } from '@canopyiq/database'
import { z } from 'zod'

const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  projectId: z.string().optional(),
  organizationId: z.string(),
  startTime: z.date(),
  endTime: z.date().optional(),
  currentIntent: z.string().optional(),
  taskDescription: z.string().optional(),
  environment: z.enum(['development', 'staging', 'production', 'testing', 'local']).optional(),
  recentEventIds: z.array(z.string()),
  decisions: z.array(z.object({
    id: z.string(),
    timestamp: z.date(),
    type: z.string(),
    decision: z.string(),
    reasoning: z.string(),
    alternatives: z.array(z.string()),
    confidence: z.number(),
  })),
  filesInScope: z.array(z.string()),
  metrics: z.object({
    eventsCount: z.number(),
    decisionsCount: z.number(),
    filesModified: z.number(),
    linesAdded: z.number(),
    linesRemoved: z.number(),
  }),
  metadata: z.record(z.any()).optional(),
})

export type Session = z.infer<typeof SessionSchema>

export class SessionManager {
  private redis: Redis
  private currentSession: Session | null = null
  private sessionCache: Map<string, Session> = new Map()
  private readonly SESSION_TTL = 24 * 60 * 60 // 24 hours in seconds

  constructor(redis: Redis) {
    this.redis = redis
  }

  /**
   * Create a new session
   */
  async createSession(params: {
    userId: string
    organizationId: string
    projectId?: string
    taskDescription?: string
    environment?: 'development' | 'staging' | 'production' | 'testing' | 'local'
    metadata?: Record<string, any>
  }): Promise<Session> {
    const sessionId = `cs_${Date.now()}_${nanoid(6)}`

    const session: Session = {
      id: sessionId,
      userId: params.userId,
      organizationId: params.organizationId,
      projectId: params.projectId,
      startTime: new Date(),
      currentIntent: params.taskDescription,
      taskDescription: params.taskDescription,
      environment: params.environment || 'development',
      recentEventIds: [],
      decisions: [],
      filesInScope: [],
      metrics: {
        eventsCount: 0,
        decisionsCount: 0,
        filesModified: 0,
        linesAdded: 0,
        linesRemoved: 0,
      },
      metadata: params.metadata,
    }

    // Store in Redis
    await this.redis.setex(
      `session:${sessionId}`,
      this.SESSION_TTL,
      JSON.stringify(session)
    )

    // Store in database
    await db.insert('claude_sessions' as any).values({
      session_id: sessionId,
      user_id: params.userId,
      organization_id: params.organizationId,
      project_id: params.projectId,
      start_time: session.startTime,
      task_description: params.taskDescription,
      environment: params.environment || 'development',
      event_ids: [],
      files_in_scope: [],
      conversation_tokens: 0,
      tool_calls_count: 0,
    })

    // Set as current session
    this.currentSession = session
    this.sessionCache.set(sessionId, session)

    console.log(`Session created: ${sessionId}`)

    return session
  }

  /**
   * Get the current active session
   */
  async getCurrentSession(): Promise<Session | null> {
    if (this.currentSession && !this.isSessionExpired(this.currentSession)) {
      return this.currentSession
    }

    // Try to recover from Redis
    const sessions = await this.redis.keys('session:*')
    if (sessions.length > 0) {
      // Get the most recent session
      const latestKey = sessions[sessions.length - 1]
      const sessionData = await this.redis.get(latestKey)

      if (sessionData) {
        const session = JSON.parse(sessionData)
        session.startTime = new Date(session.startTime)
        if (session.endTime) {
          session.endTime = new Date(session.endTime)
        }
        session.decisions = session.decisions.map((d: any) => ({
          ...d,
          timestamp: new Date(d.timestamp),
        }))

        this.currentSession = session
        return session
      }
    }

    return null
  }

  /**
   * Get a specific session by ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    // Check cache first
    if (this.sessionCache.has(sessionId)) {
      return this.sessionCache.get(sessionId)!
    }

    // Check Redis
    const sessionData = await this.redis.get(`session:${sessionId}`)
    if (sessionData) {
      const session = JSON.parse(sessionData)
      session.startTime = new Date(session.startTime)
      if (session.endTime) {
        session.endTime = new Date(session.endTime)
      }
      session.decisions = session.decisions.map((d: any) => ({
        ...d,
        timestamp: new Date(d.timestamp),
      }))

      this.sessionCache.set(sessionId, session)
      return session
    }

    return null
  }

  /**
   * Update the current intent/context
   */
  async updateIntent(sessionId: string, intent: string): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    session.currentIntent = intent

    await this.saveSession(session)
  }

  /**
   * Add an event to the session
   */
  async addEventToSession(sessionId: string, eventId: string): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    session.recentEventIds.push(eventId)
    session.metrics.eventsCount++

    // Keep only last 100 events in memory
    if (session.recentEventIds.length > 100) {
      session.recentEventIds = session.recentEventIds.slice(-100)
    }

    await this.saveSession(session)
  }

  /**
   * Add a decision to the session
   */
  async addDecision(
    sessionId: string,
    decision: {
      type: string
      decision: string
      reasoning: string
      alternatives: string[]
      confidence: number
    }
  ): Promise<string> {
    const session = await this.getSession(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    const decisionId = `dec_${nanoid(8)}`

    session.decisions.push({
      id: decisionId,
      timestamp: new Date(),
      ...decision,
    })
    session.metrics.decisionsCount++

    await this.saveSession(session)

    return decisionId
  }

  /**
   * Add files to the session scope
   */
  async addFilesToScope(sessionId: string, files: string[]): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    session.filesInScope.push(...files)
    session.filesInScope = [...new Set(session.filesInScope)]

    await this.saveSession(session)
  }

  /**
   * Update session metrics
   */
  async updateMetrics(
    sessionId: string,
    metrics: Partial<Session['metrics']>
  ): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    session.metrics = {
      ...session.metrics,
      ...metrics,
    }

    await this.saveSession(session)
  }

  /**
   * End a session
   */
  async endSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    session.endTime = new Date()

    await this.saveSession(session)

    // Update database
    await db.update('claude_sessions' as any)
      .set({
        end_time: session.endTime,
        event_ids: session.recentEventIds,
        files_in_scope: session.filesInScope,
        decisions: session.decisions,
        code_changes: {
          filesModified: session.metrics.filesModified,
          linesAdded: session.metrics.linesAdded,
          linesRemoved: session.metrics.linesRemoved,
        },
        updated_at: new Date(),
      })
      .where('session_id', '=', sessionId)

    // Clear from current if it matches
    if (this.currentSession?.id === sessionId) {
      this.currentSession = null
    }

    console.log(`Session ended: ${sessionId}`)
  }

  /**
   * Save session to Redis
   */
  private async saveSession(session: Session): Promise<void> {
    await this.redis.setex(
      `session:${session.id}`,
      this.SESSION_TTL,
      JSON.stringify(session)
    )

    // Update cache
    this.sessionCache.set(session.id, session)

    // Update current if it matches
    if (this.currentSession?.id === session.id) {
      this.currentSession = session
    }
  }

  /**
   * Check if a session is expired
   */
  private isSessionExpired(session: Session): boolean {
    if (session.endTime) return true

    const now = new Date()
    const sessionAge = now.getTime() - session.startTime.getTime()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours

    return sessionAge > maxAge
  }

  /**
   * Get all active sessions
   */
  async getActiveSessions(): Promise<Session[]> {
    const keys = await this.redis.keys('session:*')
    const sessions: Session[] = []

    for (const key of keys) {
      const data = await this.redis.get(key)
      if (data) {
        const session = JSON.parse(data)
        session.startTime = new Date(session.startTime)
        if (session.endTime) {
          session.endTime = new Date(session.endTime)
        }
        session.decisions = session.decisions.map((d: any) => ({
          ...d,
          timestamp: new Date(d.timestamp),
        }))

        if (!this.isSessionExpired(session)) {
          sessions.push(session)
        }
      }
    }

    return sessions
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const sessions = await this.getActiveSessions()
    let cleaned = 0

    for (const session of sessions) {
      if (this.isSessionExpired(session)) {
        await this.redis.del(`session:${session.id}`)
        this.sessionCache.delete(session.id)
        cleaned++
      }
    }

    console.log(`Cleaned up ${cleaned} expired sessions`)
    return cleaned
  }
}