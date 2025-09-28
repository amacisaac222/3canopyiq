import { z } from 'zod'

export interface MetricData {
  timestamp: Date
  value: number | Record<string, any>
  type: string
  metadata?: Record<string, any>
}

export interface VelocityMetrics {
  averageVelocity: number
  trend: 'increasing' | 'stable' | 'decreasing'
  consistency: number
  predictedNext: number
}

export interface ComplexityMetrics {
  cyclomaticComplexity: number
  cognitiveComplexity: number
  maintainabilityIndex: number
  technicalDebt: number
  codeSmells: number
}

export interface CodeQualityMetrics {
  score: number
  issues: Array<{
    severity: 'error' | 'warning' | 'info'
    type: string
    count: number
  }>
  coverage: number
  duplication: number
}

export async function calculateVelocity(db: any, teamId: string, sprintCount: number): Promise<VelocityMetrics> {
  const velocity = await db.getTeamVelocity(teamId, sprintCount)
  const velocities = velocity.sprints.map((s: any) => s.velocity || 0)

  const average = velocities.reduce((a: number, b: number) => a + b, 0) / velocities.length

  const trend = determineTrend(velocities)
  const consistency = calculateConsistency(velocities)
  const predictedNext = predictNextVelocity(velocities)

  return {
    averageVelocity: average,
    trend,
    consistency,
    predictedNext,
  }
}

export async function calculateComplexity(quality: any): Promise<ComplexityMetrics> {
  const issues = quality.issues || []
  const score = quality.score || 0

  const cyclomaticComplexity = calculateCyclomaticComplexity(issues)
  const cognitiveComplexity = calculateCognitiveComplexity(issues)
  const maintainabilityIndex = calculateMaintainabilityIndex(score, issues)
  const technicalDebt = calculateTechnicalDebt(issues)
  const codeSmells = countCodeSmells(issues)

  return {
    cyclomaticComplexity,
    cognitiveComplexity,
    maintainabilityIndex,
    technicalDebt,
    codeSmells,
  }
}

export function analyzeMetricTrends(metrics: MetricData[]): {
  trend: 'improving' | 'degrading' | 'stable'
  changeRate: number
  forecast: number[]
} {
  if (metrics.length < 2) {
    return {
      trend: 'stable',
      changeRate: 0,
      forecast: [],
    }
  }

  const values = metrics.map(m => typeof m.value === 'number' ? m.value : 0)
  const trend = determineTrend(values)
  const changeRate = calculateChangeRate(values)
  const forecast = generateForecast(values, 5)

  return {
    trend: trend === 'increasing' ? 'improving' : trend === 'decreasing' ? 'degrading' : 'stable',
    changeRate,
    forecast,
  }
}

export function aggregateMetrics(metrics: MetricData[]): {
  byType: Record<string, MetricData[]>
  summary: {
    totalMetrics: number
    uniqueTypes: number
    dateRange: { start: Date; end: Date }
  }
} {
  const byType: Record<string, MetricData[]> = {}

  metrics.forEach(metric => {
    if (!byType[metric.type]) {
      byType[metric.type] = []
    }
    byType[metric.type].push(metric)
  })

  const timestamps = metrics.map(m => m.timestamp.getTime())
  const minTime = Math.min(...timestamps)
  const maxTime = Math.max(...timestamps)

  return {
    byType,
    summary: {
      totalMetrics: metrics.length,
      uniqueTypes: Object.keys(byType).length,
      dateRange: {
        start: new Date(minTime),
        end: new Date(maxTime),
      },
    },
  }
}

function determineTrend(values: number[]): 'increasing' | 'stable' | 'decreasing' {
  if (values.length < 2) return 'stable'

  let increasing = 0
  let decreasing = 0

  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i - 1]) increasing++
    else if (values[i] < values[i - 1]) decreasing++
  }

  if (increasing > decreasing * 1.5) return 'increasing'
  if (decreasing > increasing * 1.5) return 'decreasing'
  return 'stable'
}

function calculateConsistency(values: number[]): number {
  if (values.length < 2) return 1

  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  return Math.max(0, 1 - (stdDev / mean))
}

function predictNextVelocity(values: number[]): number {
  if (values.length === 0) return 0
  if (values.length === 1) return values[0]

  const weights = values.map((_, i) => Math.pow(0.8, values.length - i - 1))
  const weightSum = weights.reduce((a, b) => a + b, 0)
  const weightedSum = values.reduce((sum, val, i) => sum + val * weights[i], 0)

  return Math.round(weightedSum / weightSum)
}

function calculateCyclomaticComplexity(issues: any[]): number {
  const complexityIssues = issues.filter(i => i.type === 'complexity')
  return complexityIssues.reduce((sum, issue) => sum + (issue.count || 0), 0) * 2
}

function calculateCognitiveComplexity(issues: any[]): number {
  const cognitiveIssues = issues.filter(i =>
    i.type === 'nested' || i.type === 'cognitive' || i.type === 'branching'
  )
  return cognitiveIssues.reduce((sum, issue) => sum + (issue.count || 0) * 3, 0)
}

function calculateMaintainabilityIndex(score: number, issues: any[]): number {
  const totalIssues = issues.reduce((sum, issue) => sum + (issue.count || 0), 0)
  const baseIndex = score * 1.71
  const penalty = totalIssues * 0.23
  return Math.max(0, Math.min(100, baseIndex - penalty))
}

function calculateTechnicalDebt(issues: any[]): number {
  const severityWeights = { error: 8, warning: 3, info: 1 }
  return issues.reduce((sum, issue) => {
    const weight = severityWeights[issue.severity as keyof typeof severityWeights] || 1
    return sum + (issue.count || 0) * weight * 15
  }, 0)
}

function countCodeSmells(issues: any[]): number {
  const smellTypes = ['duplication', 'long-method', 'large-class', 'god-class', 'dead-code']
  return issues
    .filter(i => smellTypes.includes(i.type))
    .reduce((sum, issue) => sum + (issue.count || 0), 0)
}

function calculateChangeRate(values: number[]): number {
  if (values.length < 2) return 0
  const first = values[0]
  const last = values[values.length - 1]
  return ((last - first) / first) * 100
}

function generateForecast(values: number[], periods: number): number[] {
  if (values.length < 2) return []

  const trend = (values[values.length - 1] - values[0]) / values.length
  const lastValue = values[values.length - 1]

  const forecast: number[] = []
  for (let i = 1; i <= periods; i++) {
    forecast.push(Math.round(lastValue + trend * i))
  }

  return forecast
}

export const MetricSchema = z.object({
  timestamp: z.date(),
  value: z.union([z.number(), z.record(z.any())]),
  type: z.string(),
  metadata: z.record(z.any()).optional(),
})

export const VelocitySchema = z.object({
  averageVelocity: z.number(),
  trend: z.enum(['increasing', 'stable', 'decreasing']),
  consistency: z.number(),
  predictedNext: z.number(),
})

export const ComplexitySchema = z.object({
  cyclomaticComplexity: z.number(),
  cognitiveComplexity: z.number(),
  maintainabilityIndex: z.number(),
  technicalDebt: z.number(),
  codeSmells: z.number(),
})