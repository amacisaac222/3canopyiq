import Redis from 'ioredis'
import { db } from '@canopyiq/database'
import PQueue from 'p-queue'

interface LineageNode {
  eventId: string
  parentIds: string[]
  childIds: string[]
  confidence: number
  depth: number
  timestamp: Date
}

interface LineagePath {
  sourceId: string
  targetId: string
  path: string[]
  confidence: number
  pathType: 'direct' | 'indirect' | 'inferred'
}

export class LineageTracker {
  private redis: Redis
  private lineageCache: Map<string, LineageNode> = new Map()
  private pathCache: Map<string, LineagePath[]> = new Map()
  private queue: PQueue
  private readonly MAX_DEPTH = 20
  private readonly CACHE_TTL = 3600 // 1 hour

  constructor(redis: Redis) {
    this.redis = redis
    this.queue = new PQueue({ concurrency: 5 })
  }

  /**
   * Add a lineage link between events
   */
  async addLink(
    parentId: string | null,
    childId: string,
    confidence: number = 1.0
  ): Promise<void> {
    try {
      // Store link in Redis for quick access
      if (parentId) {
        await this.redis.sadd(`lineage:parents:${childId}`, parentId)
        await this.redis.sadd(`lineage:children:${parentId}`, childId)

        // Store confidence score
        await this.redis.hset(
          `lineage:confidence`,
          `${parentId}:${childId}`,
          confidence.toString()
        )

        // Create lineage path in database
        await this.createLineagePath(parentId, childId, confidence)
      }

      // Update cache
      await this.updateCacheNode(childId, parentId, confidence)

      // Queue path recalculation
      this.queue.add(() => this.recalculatePaths(childId))

      console.log(`Lineage link added: ${parentId} -> ${childId} (confidence: ${confidence})`)
    } catch (error) {
      console.error('Failed to add lineage link:', error)
    }
  }

  /**
   * Create lineage path in database
   */
  private async createLineagePath(
    sourceId: string,
    targetId: string,
    confidence: number
  ): Promise<void> {
    try {
      // Check if direct path already exists
      const existing = await db
        .select()
        .from('data_lineage_paths' as any)
        .where('source_event_id', '=', sourceId)
        .and('target_event_id', '=', targetId)
        .limit(1)

      if (existing.length === 0) {
        // Create direct path
        await db.insert('data_lineage_paths' as any).values({
          source_event_id: sourceId,
          target_event_id: targetId,
          path_event_ids: [sourceId, targetId],
          path_length: 2,
          path_type: 'direct',
          is_direct_path: true,
          confidence: confidence,
          created_at: new Date(),
        })

        // Find and create indirect paths
        await this.createIndirectPaths(sourceId, targetId, confidence)
      }
    } catch (error) {
      console.error('Failed to create lineage path:', error)
    }
  }

  /**
   * Create indirect paths through new connection
   */
  private async createIndirectPaths(
    intermediateSource: string,
    intermediateTarget: string,
    confidence: number
  ): Promise<void> {
    try {
      // Find all paths ending at intermediate source
      const pathsToSource = await db
        .select()
        .from('data_lineage_paths' as any)
        .where('target_event_id', '=', intermediateSource)

      // Find all paths starting from intermediate target
      const pathsFromTarget = await db
        .select()
        .from('data_lineage_paths' as any)
        .where('source_event_id', '=', intermediateTarget)

      // Create extended paths
      for (const pathToSource of pathsToSource) {
        const extendedPath = [
          ...pathToSource.path_event_ids.slice(0, -1),
          intermediateSource,
          intermediateTarget,
        ]

        if (extendedPath.length <= this.MAX_DEPTH) {
          await db.insert('data_lineage_paths' as any).values({
            source_event_id: pathToSource.source_event_id,
            target_event_id: intermediateTarget,
            path_event_ids: extendedPath,
            path_length: extendedPath.length,
            path_type: 'indirect',
            is_direct_path: false,
            confidence: pathToSource.confidence * confidence * 0.95,
            created_at: new Date(),
          })
        }
      }

      for (const pathFromTarget of pathsFromTarget) {
        const extendedPath = [
          intermediateSource,
          intermediateTarget,
          ...pathFromTarget.path_event_ids.slice(1),
        ]

        if (extendedPath.length <= this.MAX_DEPTH) {
          await db.insert('data_lineage_paths' as any).values({
            source_event_id: intermediateSource,
            target_event_id: pathFromTarget.target_event_id,
            path_event_ids: extendedPath,
            path_length: extendedPath.length,
            path_type: 'indirect',
            is_direct_path: false,
            confidence: confidence * pathFromTarget.confidence * 0.95,
            created_at: new Date(),
          })
        }
      }
    } catch (error) {
      console.error('Failed to create indirect paths:', error)
    }
  }

  /**
   * Get lineage tree for an event
   */
  async getLineageTree(
    eventId: string,
    direction: 'ancestors' | 'descendants' | 'both' = 'both',
    maxDepth: number = 10
  ): Promise<{
    event: LineageNode
    ancestors: LineageNode[]
    descendants: LineageNode[]
    paths: LineagePath[]
  }> {
    const event = await this.getOrCreateNode(eventId)
    const ancestors: LineageNode[] = []
    const descendants: LineageNode[] = []
    const paths: LineagePath[] = []

    if (direction === 'ancestors' || direction === 'both') {
      await this.traverseAncestors(eventId, ancestors, new Set(), 0, maxDepth)
    }

    if (direction === 'descendants' || direction === 'both') {
      await this.traverseDescendants(eventId, descendants, new Set(), 0, maxDepth)
    }

    // Get paths from database
    const dbPaths = await db
      .select()
      .from('data_lineage_paths' as any)
      .where('source_event_id', '=', eventId)
      .or('target_event_id', '=', eventId)
      .limit(100)

    for (const dbPath of dbPaths) {
      paths.push({
        sourceId: dbPath.source_event_id,
        targetId: dbPath.target_event_id,
        path: dbPath.path_event_ids,
        confidence: dbPath.confidence,
        pathType: dbPath.is_direct_path ? 'direct' : 'indirect',
      })
    }

    return { event, ancestors, descendants, paths }
  }

  /**
   * Traverse ancestors recursively
   */
  private async traverseAncestors(
    eventId: string,
    result: LineageNode[],
    visited: Set<string>,
    currentDepth: number,
    maxDepth: number
  ): Promise<void> {
    if (currentDepth >= maxDepth || visited.has(eventId)) return

    visited.add(eventId)

    const parentIds = await this.redis.smembers(`lineage:parents:${eventId}`)

    for (const parentId of parentIds) {
      if (!visited.has(parentId)) {
        const node = await this.getOrCreateNode(parentId)
        node.depth = currentDepth + 1
        result.push(node)

        await this.traverseAncestors(
          parentId,
          result,
          visited,
          currentDepth + 1,
          maxDepth
        )
      }
    }
  }

  /**
   * Traverse descendants recursively
   */
  private async traverseDescendants(
    eventId: string,
    result: LineageNode[],
    visited: Set<string>,
    currentDepth: number,
    maxDepth: number
  ): Promise<void> {
    if (currentDepth >= maxDepth || visited.has(eventId)) return

    visited.add(eventId)

    const childIds = await this.redis.smembers(`lineage:children:${eventId}`)

    for (const childId of childIds) {
      if (!visited.has(childId)) {
        const node = await this.getOrCreateNode(childId)
        node.depth = currentDepth + 1
        result.push(node)

        await this.traverseDescendants(
          childId,
          result,
          visited,
          currentDepth + 1,
          maxDepth
        )
      }
    }
  }

  /**
   * Get or create a lineage node
   */
  private async getOrCreateNode(eventId: string): Promise<LineageNode> {
    if (this.lineageCache.has(eventId)) {
      return this.lineageCache.get(eventId)!
    }

    const parentIds = await this.redis.smembers(`lineage:parents:${eventId}`)
    const childIds = await this.redis.smembers(`lineage:children:${eventId}`)

    const node: LineageNode = {
      eventId,
      parentIds,
      childIds,
      confidence: 1.0,
      depth: 0,
      timestamp: new Date(),
    }

    this.lineageCache.set(eventId, node)
    return node
  }

  /**
   * Update cache node
   */
  private async updateCacheNode(
    eventId: string,
    parentId: string | null,
    confidence: number
  ): Promise<void> {
    const node = await this.getOrCreateNode(eventId)

    if (parentId && !node.parentIds.includes(parentId)) {
      node.parentIds.push(parentId)
    }

    node.confidence = Math.min(node.confidence, confidence)
    this.lineageCache.set(eventId, node)
  }

  /**
   * Recalculate paths after new link
   */
  private async recalculatePaths(eventId: string): Promise<void> {
    try {
      // Clear path cache for affected event
      this.pathCache.delete(eventId)

      // Recalculate impact
      await this.calculateImpactRadius(eventId)
    } catch (error) {
      console.error('Failed to recalculate paths:', error)
    }
  }

  /**
   * Calculate impact radius of an event
   */
  async calculateImpactRadius(eventId: string): Promise<{
    directImpact: number
    indirectImpact: number
    totalReach: number
    criticalPaths: string[]
  }> {
    const tree = await this.getLineageTree(eventId, 'descendants', 10)

    const directImpact = tree.descendants.filter(n => n.depth === 1).length
    const indirectImpact = tree.descendants.filter(n => n.depth > 1).length
    const totalReach = tree.descendants.length

    // Find critical paths (high confidence paths to important events)
    const criticalPaths = tree.paths
      .filter(p => p.confidence > 0.8)
      .map(p => p.path.join(' -> '))

    const impact = {
      directImpact,
      indirectImpact,
      totalReach,
      criticalPaths,
    }

    // Store in Redis for quick access
    await this.redis.setex(
      `impact:${eventId}`,
      this.CACHE_TTL,
      JSON.stringify(impact)
    )

    return impact
  }

  /**
   * Verify lineage integrity
   */
  async verifyIntegrity(): Promise<{
    valid: boolean
    issues: Array<{
      type: string
      eventId: string
      description: string
    }>
  }> {
    const issues: Array<{
      type: string
      eventId: string
      description: string
    }> = []

    // Check for orphaned events
    const allEvents = await this.redis.keys('lineage:parents:*')

    for (const key of allEvents) {
      const eventId = key.replace('lineage:parents:', '')
      const parents = await this.redis.smembers(key)

      for (const parentId of parents) {
        const parentExists = await this.redis.exists(`lineage:children:${parentId}`)
        if (!parentExists) {
          issues.push({
            type: 'orphaned_parent',
            eventId,
            description: `Parent ${parentId} does not have ${eventId} as child`,
          })
        }
      }
    }

    // Check for circular dependencies
    for (const key of allEvents) {
      const eventId = key.replace('lineage:parents:', '')
      const visited = new Set<string>()

      if (await this.hasCircularDependency(eventId, visited)) {
        issues.push({
          type: 'circular_dependency',
          eventId,
          description: 'Event is part of a circular dependency chain',
        })
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    }
  }

  /**
   * Check for circular dependencies
   */
  private async hasCircularDependency(
    eventId: string,
    visited: Set<string>,
    path: Set<string> = new Set()
  ): Promise<boolean> {
    if (path.has(eventId)) return true
    if (visited.has(eventId)) return false

    visited.add(eventId)
    path.add(eventId)

    const parents = await this.redis.smembers(`lineage:parents:${eventId}`)

    for (const parentId of parents) {
      if (await this.hasCircularDependency(parentId, visited, new Set(path))) {
        return true
      }
    }

    return false
  }

  /**
   * Clean up expired cache entries
   */
  async cleanup(): Promise<void> {
    // Clear old cache entries
    const now = Date.now()
    for (const [key, node] of this.lineageCache.entries()) {
      const age = now - node.timestamp.getTime()
      if (age > this.CACHE_TTL * 1000) {
        this.lineageCache.delete(key)
      }
    }

    this.pathCache.clear()
    console.log('Lineage tracker cache cleaned')
  }
}