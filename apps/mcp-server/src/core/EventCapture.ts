import { nanoid } from 'nanoid'
import { z } from 'zod'
import { db, lineageTracker, type NewEvent } from '@canopyiq/database'
import { EventType } from '@canopyiq/shared'
import Redis from 'ioredis'
import { SessionManager } from './SessionManager'
import { LineageTracker } from './LineageTracker'

// Event schema validation
const EventSchema = z.object({
  category: z.string(),
  action: z.string(),
  label: z.string().optional(),
  value: z.any(),
  parentEventId: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  gitContext: z.object({
    commit: z.string().optional(),
    branch: z.string().optional(),
    repository: z.string().optional(),
    prNumber: z.number().optional(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
})

export type CaptureEventInput = z.infer<typeof EventSchema>

export class EventCapture {
  private redis: Redis
  private sessionManager: SessionManager
  private lineageTracker: LineageTracker
  private eventQueue: NewEvent[] = []
  private batchInterval: NodeJS.Timeout | null = null
  private readonly BATCH_SIZE = 100
  private readonly BATCH_INTERVAL_MS = 1000

  constructor(redis: Redis, sessionManager: SessionManager, lineageTracker: LineageTracker) {
    this.redis = redis
    this.sessionManager = sessionManager
    this.lineageTracker = lineageTracker
    this.startBatchProcessor()
  }

  /**
   * Generate a unique event ID with timestamp
   */
  private generateEventId(): string {
    const timestamp = Date.now().toString(36)
    const random = nanoid(7)
    return `evt_${timestamp}_${random}`
  }

  /**
   * Capture an event with full context and lineage
   */
  async captureEvent(input: CaptureEventInput): Promise<{ eventId: string; status: string }> {
    try {
      // Validate input
      const validatedInput = EventSchema.parse(input)

      // Get current session context
      const session = await this.sessionManager.getCurrentSession()
      if (!session) {
        throw new Error('No active session found')
      }

      // Generate unique event ID
      const eventId = this.generateEventId()

      // Determine parent events for lineage
      let parentEventIds: string[] = []
      if (validatedInput.parentEventId) {
        parentEventIds = [validatedInput.parentEventId]
      } else if (session.recentEventIds.length > 0) {
        // Link to most recent event in session
        parentEventIds = [session.recentEventIds[session.recentEventIds.length - 1]]
      }

      // Create event with full lineage
      const event: NewEvent = {
        id: eventId,
        timestamp: new Date(),
        sourceType: 'claude_code',
        sourceId: session.id,
        sourceUrl: null,
        userId: session.userId,
        category: validatedInput.category as any,
        action: validatedInput.action,
        label: validatedInput.label || null,
        value: validatedInput.value,
        intent: session.currentIntent || null,
        parentEventIds,
        childEventIds: [],
        gitCommit: validatedInput.gitContext?.commit || null,
        gitBranch: validatedInput.gitContext?.branch || null,
        gitRepository: validatedInput.gitContext?.repository || null,
        prNumber: validatedInput.gitContext?.prNumber || null,
        confidence: validatedInput.confidence || 1.0,
        algorithm: 'direct_capture',
        algorithmVersion: '1.0.0',
        rawData: null,
        projectId: session.projectId,
        organizationId: session.organizationId,
        environmentType: session.environment || 'development',
        searchVector: this.generateSearchVector(validatedInput),
        tags: this.extractTags(validatedInput),
        metadata: validatedInput.metadata || null,
      }

      // Stream to Redis for real-time processing
      await this.streamToRedis(event)

      // Add to batch queue
      this.eventQueue.push(event)

      // Track lineage relationships
      await this.lineageTracker.addLink(
        parentEventIds[0] || null,
        eventId,
        validatedInput.confidence || 1.0
      )

      // Update session with new event
      await this.sessionManager.addEventToSession(session.id, eventId)

      // Trigger batch processing if queue is full
      if (this.eventQueue.length >= this.BATCH_SIZE) {
        await this.processBatch()
      }

      console.log(`Event captured: ${eventId} - ${validatedInput.category}:${validatedInput.action}`)

      return {
        eventId,
        status: 'captured',
      }
    } catch (error) {
      console.error('Failed to capture event:', error)
      throw error
    }
  }

  /**
   * Stream event to Redis for real-time processing
   */
  private async streamToRedis(event: NewEvent): Promise<void> {
    try {
      const streamKey = `events:stream:${event.organizationId}`

      // Add to Redis stream
      await this.redis.xadd(
        streamKey,
        '*',
        'eventId', event.id,
        'timestamp', event.timestamp.toISOString(),
        'category', event.category,
        'action', event.action,
        'data', JSON.stringify(event.value),
        'sessionId', event.sourceId,
        'userId', event.userId || '',
        'projectId', event.projectId || '',
        'confidence', event.confidence.toString()
      )

      // Publish to Redis pub/sub for WebSocket updates
      await this.redis.publish('events:new', JSON.stringify({
        eventId: event.id,
        category: event.category,
        action: event.action,
        timestamp: event.timestamp,
        sessionId: event.sourceId,
        projectId: event.projectId,
      }))

      // Set TTL on stream (7 days)
      await this.redis.expire(streamKey, 7 * 24 * 60 * 60)
    } catch (error) {
      console.error('Failed to stream event to Redis:', error)
      // Don't throw - continue with database write
    }
  }

  /**
   * Start batch processor for database writes
   */
  private startBatchProcessor(): void {
    this.batchInterval = setInterval(async () => {
      if (this.eventQueue.length > 0) {
        await this.processBatch()
      }
    }, this.BATCH_INTERVAL_MS)
  }

  /**
   * Process batch of events to database
   */
  private async processBatch(): Promise<void> {
    if (this.eventQueue.length === 0) return

    const batch = this.eventQueue.splice(0, this.BATCH_SIZE)

    try {
      // Use lineage tracker for proper event creation
      for (const event of batch) {
        await lineageTracker.createEvent(event, event.parentEventIds)
      }

      console.log(`Batch processed: ${batch.length} events written to database`)

      // Trigger downstream calculations
      await this.triggerDownstreamCalculations(batch)
    } catch (error) {
      console.error('Failed to process batch:', error)

      // Re-queue failed events
      this.eventQueue.unshift(...batch)

      // Implement exponential backoff
      await this.handleBatchFailure()
    }
  }

  /**
   * Trigger downstream calculations after events are stored
   */
  private async triggerDownstreamCalculations(events: NewEvent[]): Promise<void> {
    try {
      // Queue metric calculations
      for (const event of events) {
        if (event.category === 'analysis' || event.category === 'code_change') {
          await this.redis.rpush('calculations:queue', JSON.stringify({
            type: 'metric',
            eventId: event.id,
            timestamp: event.timestamp,
          }))
        }
      }

      // Check for insight triggers
      const analysisEvents = events.filter(e => e.category === 'analysis')
      if (analysisEvents.length >= 3) {
        await this.redis.rpush('calculations:queue', JSON.stringify({
          type: 'insight',
          eventIds: analysisEvents.map(e => e.id),
          timestamp: new Date(),
        }))
      }
    } catch (error) {
      console.error('Failed to trigger downstream calculations:', error)
    }
  }

  /**
   * Handle batch processing failure with exponential backoff
   */
  private async handleBatchFailure(): Promise<void> {
    // Implement exponential backoff
    const retryDelay = Math.min(30000, this.BATCH_INTERVAL_MS * 2)

    if (this.batchInterval) {
      clearInterval(this.batchInterval)
    }

    setTimeout(() => {
      this.startBatchProcessor()
    }, retryDelay)

    console.log(`Batch processing failed, retrying in ${retryDelay}ms`)
  }

  /**
   * Generate search vector for full-text search
   */
  private generateSearchVector(input: CaptureEventInput): string {
    const parts = [
      input.category,
      input.action,
      input.label,
      JSON.stringify(input.value),
    ].filter(Boolean)

    return parts.join(' ')
  }

  /**
   * Extract tags from event data
   */
  private extractTags(input: CaptureEventInput): string[] {
    const tags: string[] = [input.category, input.action]

    // Extract tags from value if it's an object
    if (typeof input.value === 'object' && input.value !== null) {
      if ('tags' in input.value && Array.isArray(input.value.tags)) {
        tags.push(...input.value.tags)
      }
      if ('language' in input.value) {
        tags.push(input.value.language)
      }
      if ('framework' in input.value) {
        tags.push(input.value.framework)
      }
    }

    return [...new Set(tags)]
  }

  /**
   * Capture a batch of related events
   */
  async captureBatch(events: CaptureEventInput[]): Promise<{ eventIds: string[]; status: string }> {
    const eventIds: string[] = []
    let parentEventId: string | undefined

    for (const event of events) {
      // Chain events together
      if (parentEventId) {
        event.parentEventId = parentEventId
      }

      const result = await this.captureEvent(event)
      eventIds.push(result.eventId)
      parentEventId = result.eventId
    }

    return {
      eventIds,
      status: 'batch_captured',
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    // Process any remaining events
    if (this.eventQueue.length > 0) {
      await this.processBatch()
    }

    // Clear interval
    if (this.batchInterval) {
      clearInterval(this.batchInterval)
      this.batchInterval = null
    }
  }
}