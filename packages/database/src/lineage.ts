import { eq, and, or, inArray, sql, desc, asc, gte, lte } from 'drizzle-orm'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import {
  events,
  dataTransformations,
  dataLineagePaths,
  metrics,
  insights,
  decisions,
  dataQualityChecks,
  type Event,
  type NewEvent,
} from './schema'

// ============================================================================
// LINEAGE TRACKING FUNCTIONS
// ============================================================================

export class DataLineageTracker {
  constructor(private db: PostgresJsDatabase<any>) {}

  /**
   * Create a new event with automatic lineage tracking
   */
  async createEvent(
    eventData: Omit<NewEvent, 'id' | 'timestamp' | 'createdAt'>,
    parentEventIds?: string[]
  ): Promise<Event> {
    // Generate event ID
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 7)
    const eventId = `evt_${timestamp}_${random}`

    // Create the event
    const [newEvent] = await this.db
      .insert(events)
      .values({
        ...eventData,
        id: eventId,
        parentEventIds: parentEventIds || [],
        childEventIds: [],
      })
      .returning()

    // Update parent events to include this as a child
    if (parentEventIds && parentEventIds.length > 0) {
      for (const parentId of parentEventIds) {
        const [parent] = await this.db
          .select()
          .from(events)
          .where(eq(events.id, parentId))
          .limit(1)

        if (parent) {
          const childIds = parent.childEventIds || []
          childIds.push(eventId)

          await this.db
            .update(events)
            .set({ childEventIds: childIds })
            .where(eq(events.id, parentId))
        }
      }

      // Create lineage paths from parents to this event
      await this.createLineagePaths(parentEventIds, eventId)
    }

    return newEvent
  }

  /**
   * Track a data transformation
   */
  async trackTransformation(params: {
    inputEventIds: string[]
    outputEventData: Omit<NewEvent, 'id' | 'timestamp' | 'createdAt'>
    transformationType: any
    transformationName: string
    transformationVersion: string
    parameters?: Record<string, any>
    startTime: Date
    endTime: Date
    inputRecordCount?: number
    outputRecordCount?: number
  }) {
    // Create output event with lineage to input events
    const outputEvent = await this.createEvent(
      {
        ...params.outputEventData,
        category: 'analysis',
        action: `transformation_${params.transformationType}`,
      },
      params.inputEventIds
    )

    // Record the transformation
    const [transformation] = await this.db
      .insert(dataTransformations)
      .values({
        inputEventIds: params.inputEventIds,
        outputEventId: outputEvent.id,
        transformationType: params.transformationType,
        transformationName: params.transformationName,
        transformationVersion: params.transformationVersion,
        parameters: params.parameters,
        startTime: params.startTime,
        endTime: params.endTime,
        durationMs: params.endTime.getTime() - params.startTime.getTime(),
        inputRecordCount: params.inputRecordCount,
        outputRecordCount: params.outputRecordCount,
      })
      .returning()

    return { outputEvent, transformation }
  }

  /**
   * Create lineage paths between events
   */
  private async createLineagePaths(sourceEventIds: string[], targetEventId: string) {
    for (const sourceId of sourceEventIds) {
      // Check if direct path already exists
      const existingPath = await this.db
        .select()
        .from(dataLineagePaths)
        .where(
          and(
            eq(dataLineagePaths.sourceEventId, sourceId),
            eq(dataLineagePaths.targetEventId, targetEventId)
          )
        )
        .limit(1)

      if (existingPath.length === 0) {
        // Create direct path
        await this.db.insert(dataLineagePaths).values({
          sourceEventId: sourceId,
          targetEventId: targetEventId,
          pathEventIds: [sourceId, targetEventId],
          pathLength: 2,
          pathType: 'direct',
          isDirectPath: true,
          confidence: sql`1.00`,
        })

        // Find and create indirect paths through this new connection
        await this.extendLineagePaths(sourceId, targetEventId)
      }
    }
  }

  /**
   * Extend lineage paths when a new connection is made
   */
  private async extendLineagePaths(intermediateSourceId: string, intermediateTargetId: string) {
    // Find all paths ending at the intermediate source
    const pathsToSource = await this.db
      .select()
      .from(dataLineagePaths)
      .where(eq(dataLineagePaths.targetEventId, intermediateSourceId))

    // Find all paths starting from the intermediate target
    const pathsFromTarget = await this.db
      .select()
      .from(dataLineagePaths)
      .where(eq(dataLineagePaths.sourceEventId, intermediateTargetId))

    // Create new extended paths
    for (const pathToSource of pathsToSource) {
      // Create path from pathToSource.source through intermediate to intermediateTarget
      const extendedPath = [
        ...pathToSource.pathEventIds.slice(0, -1),
        intermediateSourceId,
        intermediateTargetId,
      ]

      await this.db.insert(dataLineagePaths).values({
        sourceEventId: pathToSource.sourceEventId,
        targetEventId: intermediateTargetId,
        pathEventIds: extendedPath,
        pathLength: extendedPath.length,
        pathType: 'transformation',
        isDirectPath: false,
        confidence: sql`${pathToSource.confidence} * 0.95`, // Slightly reduce confidence for longer paths
      })
    }

    for (const pathFromTarget of pathsFromTarget) {
      // Create path from intermediateSource through intermediate to pathFromTarget.target
      const extendedPath = [
        intermediateSourceId,
        intermediateTargetId,
        ...pathFromTarget.pathEventIds.slice(1),
      ]

      await this.db.insert(dataLineagePaths).values({
        sourceEventId: intermediateSourceId,
        targetEventId: pathFromTarget.targetEventId,
        pathEventIds: extendedPath,
        pathLength: extendedPath.length,
        pathType: 'transformation',
        isDirectPath: false,
        confidence: sql`${pathFromTarget.confidence} * 0.95`,
      })
    }
  }

  /**
   * Get the complete lineage tree for an event
   */
  async getEventLineage(eventId: string, depth: number = 5) {
    const lineageTree: any = {
      event: null,
      parents: [],
      children: [],
      ancestors: [],
      descendants: [],
    }

    // Get the event itself
    const [targetEvent] = await this.db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (!targetEvent) return null

    lineageTree.event = targetEvent

    // Get direct parents and children
    if (targetEvent.parentEventIds?.length > 0) {
      lineageTree.parents = await this.db
        .select()
        .from(events)
        .where(inArray(events.id, targetEvent.parentEventIds))
    }

    if (targetEvent.childEventIds?.length > 0) {
      lineageTree.children = await this.db
        .select()
        .from(events)
        .where(inArray(events.id, targetEvent.childEventIds))
    }

    // Get all ancestor paths (events that led to this one)
    const ancestorPaths = await this.db
      .select()
      .from(dataLineagePaths)
      .where(eq(dataLineagePaths.targetEventId, eventId))
      .orderBy(asc(dataLineagePaths.pathLength))
      .limit(depth * 10)

    // Get all descendant paths (events that came from this one)
    const descendantPaths = await this.db
      .select()
      .from(dataLineagePaths)
      .where(eq(dataLineagePaths.sourceEventId, eventId))
      .orderBy(asc(dataLineagePaths.pathLength))
      .limit(depth * 10)

    // Get unique ancestor and descendant event IDs
    const ancestorIds = new Set<string>()
    const descendantIds = new Set<string>()

    ancestorPaths.forEach(path => {
      path.pathEventIds.forEach(id => {
        if (id !== eventId) ancestorIds.add(id)
      })
    })

    descendantPaths.forEach(path => {
      path.pathEventIds.forEach(id => {
        if (id !== eventId) descendantIds.add(id)
      })
    })

    // Fetch ancestor and descendant events
    if (ancestorIds.size > 0) {
      lineageTree.ancestors = await this.db
        .select()
        .from(events)
        .where(inArray(events.id, Array.from(ancestorIds)))
        .orderBy(desc(events.timestamp))
    }

    if (descendantIds.size > 0) {
      lineageTree.descendants = await this.db
        .select()
        .from(events)
        .where(inArray(events.id, Array.from(descendantIds)))
        .orderBy(asc(events.timestamp))
    }

    return lineageTree
  }

  /**
   * Trace data quality through lineage
   */
  async traceDataQuality(eventId: string) {
    // Get lineage paths
    const lineage = await this.getEventLineage(eventId, 10)
    if (!lineage) return null

    // Get all event IDs in the lineage
    const allEventIds = [
      eventId,
      ...lineage.ancestors.map((e: Event) => e.id),
      ...lineage.descendants.map((e: Event) => e.id),
    ]

    // Get quality checks for all events in lineage
    const qualityChecks = await this.db
      .select()
      .from(dataQualityChecks)
      .where(inArray(dataQualityChecks.eventId, allEventIds))
      .orderBy(desc(dataQualityChecks.performedAt))

    // Calculate aggregate quality score
    const qualityByEvent = new Map<string, any[]>()
    qualityChecks.forEach(check => {
      if (!qualityByEvent.has(check.eventId)) {
        qualityByEvent.set(check.eventId, [])
      }
      qualityByEvent.get(check.eventId)!.push(check)
    })

    // Build quality lineage tree
    const qualityLineage = {
      eventId,
      overallQuality: this.calculateOverallQuality(qualityChecks),
      eventQuality: qualityByEvent.get(eventId) || [],
      ancestorQuality: lineage.ancestors.map((e: Event) => ({
        eventId: e.id,
        timestamp: e.timestamp,
        checks: qualityByEvent.get(e.id) || [],
        score: this.calculateOverallQuality(qualityByEvent.get(e.id) || []),
      })),
      descendantQuality: lineage.descendants.map((e: Event) => ({
        eventId: e.id,
        timestamp: e.timestamp,
        checks: qualityByEvent.get(e.id) || [],
        score: this.calculateOverallQuality(qualityByEvent.get(e.id) || []),
      })),
      qualityTrend: this.calculateQualityTrend(qualityChecks),
    }

    return qualityLineage
  }

  /**
   * Calculate overall quality score from checks
   */
  private calculateOverallQuality(checks: any[]): number {
    if (checks.length === 0) return 0

    const scores = checks
      .filter(c => c.score !== null)
      .map(c => parseFloat(c.score))

    if (scores.length === 0) {
      // If no scores, calculate based on pass/fail
      const passRate = checks.filter(c => c.passed).length / checks.length
      return passRate * 100
    }

    return scores.reduce((a, b) => a + b, 0) / scores.length
  }

  /**
   * Calculate quality trend
   */
  private calculateQualityTrend(checks: any[]): 'improving' | 'declining' | 'stable' {
    if (checks.length < 2) return 'stable'

    const sortedChecks = checks.sort((a, b) =>
      a.performedAt.getTime() - b.performedAt.getTime()
    )

    const recentScores = sortedChecks
      .slice(-5)
      .map(c => c.score ? parseFloat(c.score) : (c.passed ? 100 : 0))

    const olderScores = sortedChecks
      .slice(0, -5)
      .map(c => c.score ? parseFloat(c.score) : (c.passed ? 100 : 0))

    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length
    const olderAvg = olderScores.length > 0
      ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length
      : recentAvg

    if (recentAvg > olderAvg + 5) return 'improving'
    if (recentAvg < olderAvg - 5) return 'declining'
    return 'stable'
  }

  /**
   * Get impact analysis for an event
   */
  async getEventImpact(eventId: string) {
    // Get all events downstream from this one
    const descendantPaths = await this.db
      .select()
      .from(dataLineagePaths)
      .where(eq(dataLineagePaths.sourceEventId, eventId))

    const impactedEventIds = new Set<string>()
    descendantPaths.forEach(path => {
      path.pathEventIds.forEach(id => {
        if (id !== eventId) impactedEventIds.add(id)
      })
    })

    // Get metrics affected
    const impactedMetrics = await this.db
      .select()
      .from(metrics)
      .where(inArray(metrics.eventId, Array.from(impactedEventIds)))

    // Get insights affected
    const impactedInsights = await this.db
      .select()
      .from(insights)
      .where(inArray(insights.eventId, Array.from(impactedEventIds)))

    // Get decisions affected
    const impactedDecisions = await this.db
      .select()
      .from(decisions)
      .where(inArray(decisions.eventId, Array.from(impactedEventIds)))

    return {
      eventId,
      impactedEventsCount: impactedEventIds.size,
      impactedMetricsCount: impactedMetrics.length,
      impactedInsightsCount: impactedInsights.length,
      impactedDecisionsCount: impactedDecisions.length,
      metrics: impactedMetrics,
      insights: impactedInsights,
      decisions: impactedDecisions,
      impactSeverity: this.calculateImpactSeverity(
        impactedEventIds.size,
        impactedInsights.length,
        impactedDecisions.length
      ),
    }
  }

  /**
   * Calculate impact severity
   */
  private calculateImpactSeverity(
    eventsCount: number,
    insightsCount: number,
    decisionsCount: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const score = eventsCount + insightsCount * 5 + decisionsCount * 10

    if (score >= 100) return 'critical'
    if (score >= 50) return 'high'
    if (score >= 20) return 'medium'
    return 'low'
  }

  /**
   * Find the root cause of an issue
   */
  async findRootCause(eventId: string, issuePattern?: string) {
    const lineage = await this.getEventLineage(eventId, 20)
    if (!lineage) return null

    // Get quality checks for all ancestors
    const ancestorIds = lineage.ancestors.map((e: Event) => e.id)
    const qualityChecks = await this.db
      .select()
      .from(dataQualityChecks)
      .where(
        and(
          inArray(dataQualityChecks.eventId, ancestorIds),
          eq(dataQualityChecks.passed, false)
        )
      )
      .orderBy(asc(dataQualityChecks.performedAt))

    // Find the earliest failure
    const rootCauses = qualityChecks.slice(0, 3).map(check => ({
      eventId: check.eventId,
      checkType: check.checkType,
      checkName: check.checkName,
      failures: check.failures,
      performedAt: check.performedAt,
    }))

    // Get the events for context
    const rootCauseEvents = await this.db
      .select()
      .from(events)
      .where(inArray(events.id, rootCauses.map(rc => rc.eventId)))

    return {
      eventId,
      rootCauses: rootCauses.map(rc => {
        const event = rootCauseEvents.find(e => e.id === rc.eventId)
        return {
          ...rc,
          event,
        }
      }),
      lineageDepth: Math.max(...lineage.ancestors.map((e: Event) => {
        const path = ancestorIds.indexOf(e.id)
        return path >= 0 ? path + 1 : 0
      })),
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a lineage-tracked metric with complete derivation and drill-down
 */
export async function createTrackedMetric(
  db: PostgresJsDatabase<any>,
  metricData: {
    name: string
    displayName: string
    value: string | number
    unit?: string
    formula: string
    calculationSteps: Array<{
      step: number
      operation: string
      inputs: any[]
      output: any
      duration_ms: number
      description?: string
    }>
    sourceEventIds: string[]
    drillDownQuery?: string
    drillDownLevels?: string[]
    interactivePath?: string
    projectId?: string
    metricType: any
    metricCategory?: string
    periodStart: Date
    periodEnd: Date
    granularity?: string
    confidence?: number
    dimensions?: Record<string, any>
    tags?: string[]
    ttlSeconds?: number
    parentMetricIds?: string[]
  },
  organizationId: string,
  calculatedBy: string = 'system'
) {
  const tracker = new DataLineageTracker(db)

  const startTime = Date.now()

  // Create event for this metric calculation
  const metricEvent = await tracker.createEvent(
    {
      sourceType: 'manual',
      sourceId: 'metric_calculation',
      category: 'analysis',
      action: `calculate_${metricData.metricType}`,
      label: metricData.displayName,
      value: {
        name: metricData.name,
        value: metricData.value,
        unit: metricData.unit,
        formula: metricData.formula,
        steps: metricData.calculationSteps,
      },
      confidence: metricData.confidence ? sql`${metricData.confidence}` : sql`1.00`,
      algorithm: 'metric_engine',
      algorithmVersion: '2.0.0',
      organizationId,
      projectId: metricData.projectId,
      environmentType: 'production',
    },
    metricData.sourceEventIds
  )

  // Generate cache key
  const cacheKey = `metric_${metricData.name}_${metricData.periodStart.getTime()}_${metricData.periodEnd.getTime()}`

  // Calculate next calculation time based on TTL
  const ttl = metricData.ttlSeconds || 3600
  const nextCalculation = new Date(Date.now() + ttl * 1000)

  // Create the enhanced metric record
  const [metric] = await db
    .insert(metrics)
    .values({
      // Core identity
      name: metricData.name,
      displayName: metricData.displayName,
      value: sql`${metricData.value}`,
      unit: metricData.unit,
      timestamp: new Date(),

      // Lineage
      eventId: metricEvent.id,
      formula: metricData.formula,
      sourceEventIds: metricData.sourceEventIds,
      calculationSteps: metricData.calculationSteps,

      // Drill-down
      drillDownQuery: metricData.drillDownQuery,
      drillDownLevels: metricData.drillDownLevels,
      interactivePath: metricData.interactivePath || `/metrics/${metricEvent.id}/explore`,
      drillDownData: {
        available_dimensions: Object.keys(metricData.dimensions || {}),
        available_filters: {},
        visualization_type: 'auto',
        default_view: 'summary',
      },

      // Caching
      calculatedAt: new Date(),
      calculatedBy,
      ttlSeconds: ttl,
      isCached: true,
      cacheKey,
      nextCalculationAt: nextCalculation,

      // Relationships
      projectId: metricData.projectId,
      organizationId,
      parentMetricIds: metricData.parentMetricIds,
      dependentMetricIds: [],

      // Categorization
      metricType: metricData.metricType,
      metricCategory: metricData.metricCategory,
      metricTier: metricData.parentMetricIds?.length ? 2 : 1,

      // Time context
      periodStart: metricData.periodStart,
      periodEnd: metricData.periodEnd,
      granularity: metricData.granularity,

      // Statistical
      confidence: metricData.confidence ? sql`${metricData.confidence}` : null,

      // Context
      dimensions: metricData.dimensions,
      tags: metricData.tags,

      // Versioning
      version: 1,
      isLatest: true,
      auditLog: [{
        timestamp: new Date().toISOString(),
        action: 'created',
        user: calculatedBy,
      }],
    })
    .returning()

  // Update parent metrics to include this as dependent
  if (metricData.parentMetricIds?.length) {
    for (const parentId of metricData.parentMetricIds) {
      const [parent] = await db
        .select()
        .from(metrics)
        .where(eq(metrics.id, parentId))
        .limit(1)

      if (parent) {
        const dependentIds = parent.dependentMetricIds || []
        dependentIds.push(metric.id)

        await db
          .update(metrics)
          .set({
            dependentMetricIds: dependentIds,
            updatedAt: new Date()
          })
          .where(eq(metrics.id, parentId))
      }
    }
  }

  const endTime = Date.now()
  console.log(`Metric ${metricData.name} calculated in ${endTime - startTime}ms`)

  return { metric, event: metricEvent }
}

/**
 * Invalidate and recalculate a metric
 */
export async function invalidateMetric(
  db: PostgresJsDatabase<any>,
  metricId: string,
  reason: string = 'manual_invalidation'
) {
  // Mark current metric as invalidated
  await db
    .update(metrics)
    .set({
      isCached: false,
      cacheInvalidatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(metrics.id, metricId))

  // Get the metric details
  const [metric] = await db
    .select()
    .from(metrics)
    .where(eq(metrics.id, metricId))
    .limit(1)

  if (!metric) return null

  // Invalidate all dependent metrics (cascade)
  if (metric.dependentMetricIds?.length) {
    for (const dependentId of metric.dependentMetricIds) {
      await invalidateMetric(db, dependentId, 'parent_invalidation')
    }
  }

  // Add audit log entry
  const auditLog = metric.auditLog || []
  auditLog.push({
    timestamp: new Date().toISOString(),
    action: 'invalidated',
    user: 'system',
    changes: { reason },
  })

  await db
    .update(metrics)
    .set({ auditLog, updatedAt: new Date() })
    .where(eq(metrics.id, metricId))

  return metric
}

/**
 * Get metric with complete drill-down data
 */
export async function getMetricWithDrillDown(
  db: PostgresJsDatabase<any>,
  metricId: string
) {
  // Get the metric
  const [metric] = await db
    .select()
    .from(metrics)
    .where(eq(metrics.id, metricId))
    .limit(1)

  if (!metric) return null

  // Get the lineage tracker
  const tracker = new DataLineageTracker(db)

  // Get complete event lineage
  const eventLineage = await tracker.getEventLineage(metric.eventId)

  // Get parent metrics if any
  let parentMetrics = []
  if (metric.parentMetricIds?.length) {
    parentMetrics = await db
      .select()
      .from(metrics)
      .where(inArray(metrics.id, metric.parentMetricIds))
  }

  // Get dependent metrics if any
  let dependentMetrics = []
  if (metric.dependentMetricIds?.length) {
    dependentMetrics = await db
      .select()
      .from(metrics)
      .where(inArray(metrics.id, metric.dependentMetricIds))
  }

  // Build drill-down structure
  const drillDown = {
    metric,
    formula: {
      raw: metric.formula,
      parsed: parseFormula(metric.formula),
      steps: metric.calculationSteps,
    },
    lineage: {
      event: eventLineage,
      sourceEvents: metric.sourceEventIds,
      parentMetrics: parentMetrics.map(m => ({
        id: m.id,
        name: m.name,
        value: m.value,
        unit: m.unit,
      })),
      dependentMetrics: dependentMetrics.map(m => ({
        id: m.id,
        name: m.name,
        value: m.value,
        unit: m.unit,
      })),
    },
    drillDown: {
      query: metric.drillDownQuery,
      levels: metric.drillDownLevels,
      interactivePath: metric.interactivePath,
      data: metric.drillDownData,
    },
    cache: {
      isCached: metric.isCached,
      cacheKey: metric.cacheKey,
      calculatedAt: metric.calculatedAt,
      ttlSeconds: metric.ttlSeconds,
      nextCalculationAt: metric.nextCalculationAt,
      cacheInvalidatedAt: metric.cacheInvalidatedAt,
    },
    audit: metric.auditLog,
  }

  return drillDown
}

/**
 * Parse a metric formula to extract components
 */
function parseFormula(formula: string): {
  operations: string[]
  variables: string[]
  functions: string[]
} {
  const operations = formula.match(/[+\-*/]/g) || []
  const variables = formula.match(/\b[A-Za-z_][A-Za-z0-9_]*\b/g) || []
  const functions = formula.match(/\b(SUM|AVG|COUNT|MIN|MAX|MEDIAN)\b/g) || []

  return {
    operations: [...new Set(operations)],
    variables: [...new Set(variables)],
    functions: [...new Set(functions)],
  }
}

/**
 * Create a lineage-tracked insight
 */
export async function createTrackedInsight(
  db: PostgresJsDatabase<any>,
  insightData: {
    sourceMetricIds: string[]
    insightType: any
    severity: string
    title: string
    description: string
    evidence: Array<{ type: string; description: string; data: any }>
    reasoning: string
    confidence: number
    recommendations?: Array<{ action: string; impact: string; effort: string; priority: number }>
    projectId?: string
    organizationId: string
  }
) {
  const tracker = new DataLineageTracker(db)

  // Get events for source metrics
  const sourceMetrics = await db
    .select()
    .from(metrics)
    .where(inArray(metrics.id, insightData.sourceMetricIds))

  const sourceEventIds = sourceMetrics.map(m => m.eventId)

  // Create event for this insight
  const insightEvent = await tracker.createEvent(
    {
      sourceType: 'manual',
      sourceId: 'insight_generation',
      category: 'analysis',
      action: `generate_${insightData.insightType}`,
      label: insightData.title,
      value: {
        type: insightData.insightType,
        severity: insightData.severity,
        evidence: insightData.evidence,
      },
      confidence: sql`${insightData.confidence}`,
      algorithm: 'insight_engine',
      algorithmVersion: '1.0.0',
      organizationId: insightData.organizationId,
      projectId: insightData.projectId,
      environmentType: 'production',
    },
    sourceEventIds
  )

  // Create the insight record
  const [insight] = await db
    .insert(insights)
    .values({
      eventId: insightEvent.id,
      sourceMetricIds: insightData.sourceMetricIds,
      insightType: insightData.insightType,
      severity: insightData.severity,
      title: insightData.title,
      description: insightData.description,
      evidence: insightData.evidence,
      reasoning: insightData.reasoning,
      confidence: sql`${insightData.confidence}`,
      recommendations: insightData.recommendations,
      projectId: insightData.projectId,
      organizationId: insightData.organizationId,
    })
    .returning()

  return { insight, event: insightEvent }
}