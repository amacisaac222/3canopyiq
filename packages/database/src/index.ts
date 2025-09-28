import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import { DataLineageTracker } from './lineage'
import { eq, and, gte, lte, desc } from 'drizzle-orm'

const connectionString = process.env.DATABASE_URL || 'postgresql://canopyiq:canopyiq@localhost:5432/canopyiq'
const sql = postgres(connectionString)

export const db = drizzle(sql, {
  schema: schema,
})

// Export schema and lineage tracking
export * from './schema'
export * from './lineage'

// Create a default lineage tracker instance
export const lineageTracker = new DataLineageTracker(db)

export async function getProjectMetrics(database: typeof db, projectId: string, timeRange: string) {
  const days = parseInt(timeRange) || 30
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const projectMetrics = await database
    .select()
    .from(schema.metrics)
    .where(
      and(
        eq(schema.metrics.projectId, projectId),
        gte(schema.metrics.periodStart, startDate)
      )
    )
    .orderBy(desc(schema.metrics.periodStart))

  return {
    projectId,
    timeRange,
    metrics: projectMetrics.map(m => ({
      type: m.metricType,
      name: m.metricName,
      value: m.value,
      unit: m.unit,
      periodStart: m.periodStart,
      periodEnd: m.periodEnd,
      confidence: m.confidence,
    })),
  }
}

export async function getCodeQualityMetrics(database: typeof db, repositoryUrl: string, branch: string) {
  const project = await database
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.repositoryUrl, repositoryUrl))
    .limit(1)

  if (!project.length) {
    return {
      repositoryUrl,
      branch,
      quality: {
        score: 0,
        issues: [],
        coverage: 0,
      },
    }
  }

  const qualityMetrics = await database
    .select()
    .from(schema.metrics)
    .where(
      and(
        eq(schema.metrics.projectId, project[0].id),
        eq(schema.metrics.metricType, 'quality')
      )
    )
    .orderBy(desc(schema.metrics.periodStart))
    .limit(1)

  return {
    repositoryUrl,
    branch,
    quality: qualityMetrics[0]?.dimensions || {
      score: 0,
      issues: [],
      coverage: 0,
    },
  }
}

export async function trackEvent(database: typeof db, event: {
  type: string
  projectId?: string
  userId?: string
  data: any
  organizationId: string
}) {
  // Use lineage tracker for proper event tracking
  const tracker = new DataLineageTracker(database)

  const trackedEvent = await tracker.createEvent({
    sourceType: 'api',
    sourceId: event.userId || 'system',
    category: 'code_change',
    action: event.type,
    label: `Event: ${event.type}`,
    value: event.data,
    projectId: event.projectId,
    organizationId: event.organizationId,
    environmentType: 'production',
  })

  return trackedEvent
}

export async function getTeamVelocity(database: typeof db, teamId: string, sprintCount: number) {
  // This function doesn't exist in the new schema yet
  // We'll need to implement team tracking separately
  return {
    teamId,
    sprintCount,
    sprints: [],
    averageVelocity: 0,
    totalVelocity: 0,
  }
}