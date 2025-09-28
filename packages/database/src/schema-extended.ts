import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  integer,
  decimal,
  jsonb,
  boolean,
  index,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { relations } from 'drizzle-orm'
import { events, metrics, projects, organizations } from './schema'

// ============================================================================
// FOREST CANOPY TABLE - High-level architecture health view
// ============================================================================

export const forestCanopy = pgTable('forest_canopy', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  timestamp: timestamp('timestamp').notNull().defaultNow(),

  // The "forest" health metrics (0-100 scale)
  healthScore: integer('health_score').notNull(), // Overall health 0-100
  growthRate: decimal('growth_rate', { precision: 10, scale: 4 }), // Code growth rate
  complexityIndex: decimal('complexity_index', { precision: 10, scale: 4 }).notNull(),
  coveragePercent: decimal('coverage_percent', { precision: 5, scale: 2 }).notNull(),

  // Branch analysis (components/modules health)
  branches: jsonb('branches').notNull().$type<Array<{
    name: string
    path: string
    health: number
    complexity: number
    coverage: number
    lastModified: string
    issues: string[]
    maintainers: string[]
  }>>(),

  // Root system health (dependencies)
  rootHealth: jsonb('root_health').notNull().$type<{
    totalDependencies: number
    outdatedCount: number
    vulnerableCount: number
    healthScore: number
    criticalIssues: string[]
    dependencyTree: any
  }>(),
  circularRoots: integer('circular_roots').notNull().default(0), // Circular dependency count

  // Canopy density metrics (code coverage and quality)
  canopyDensity: decimal('canopy_density', { precision: 5, scale: 2 }).notNull(), // Test coverage density
  deadBranches: integer('dead_branches').notNull().default(0), // Dead code count
  newGrowth: integer('new_growth').notNull().default(0), // New code added
  pruned: integer('pruned').notNull().default(0), // Code removed

  // Ecosystem health (team and process)
  ecosystem: jsonb('ecosystem').$type<{
    activeContributors: number
    prVelocity: number
    issueResolutionTime: number
    collaborationScore: number
    knowledgeDistribution: Record<string, number>
  }>(),

  // Weather conditions (external factors)
  weather: jsonb('weather').$type<{
    deploymentRisk: 'low' | 'medium' | 'high'
    technicalDebt: number
    securityAlerts: number
    performanceWarnings: number
    marketConditions?: string
  }>(),

  // Complete lineage tracking
  sourceMetricIds: uuid('source_metric_ids').array().notNull(),
  sourceEventIds: text('source_event_ids').array(),
  calculationPipeline: jsonb('calculation_pipeline').notNull().$type<Array<{
    stage: string
    inputs: string[]
    operation: string
    output: any
    duration: number
    confidence: number
  }>>(),

  // Comparison with previous snapshot
  previousSnapshotId: uuid('previous_snapshot_id'),
  deltaFromPrevious: jsonb('delta_from_previous').$type<{
    healthChange: number
    growthChange: number
    complexityChange: number
    coverageChange: number
    summary: string
  }>(),

  // Metadata
  calculatedBy: varchar('calculated_by', { length: 100 }).notNull().default('system'),
  confidence: decimal('confidence', { precision: 3, scale: 2 }).notNull().default('1.00'),
  metadata: jsonb('metadata').$type<Record<string, any>>(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  projectTimestampIdx: index('idx_canopy_project_timestamp').on(table.projectId, table.timestamp),
  healthScoreIdx: index('idx_canopy_health').on(table.healthScore),
  sourceMetricsIdx: index('idx_canopy_source_metrics').using('gin', table.sourceMetricIds),
}))

// ============================================================================
// CLAUDE SESSIONS TABLE - Track AI assistant sessions
// ============================================================================

export const claudeSessions = pgTable('claude_sessions', {
  sessionId: varchar('session_id', { length: 255 }).primaryKey(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  userId: varchar('user_id', { length: 255 }).notNull(),

  // Session context
  taskDescription: text('task_description'),
  intent: text('intent'), // What the user wanted to achieve
  filesInScope: text('files_in_scope').array(), // Files accessed/modified
  repositoryState: jsonb('repository_state').$type<{
    branch: string
    commit: string
    uncommittedChanges: number
    workingDirectory: string
  }>(),
  conversationTokens: integer('conversation_tokens').default(0),
  toolCallsCount: integer('tool_calls_count').default(0),

  // Decisions and outcomes
  decisions: jsonb('decisions').array().$type<Array<{
    timestamp: string
    type: string // 'architecture', 'implementation', 'refactoring', 'bug_fix'
    description: string
    reasoning: string
    confidence: number
    alternatives?: string[]
    outcome?: string
  }>>(),

  patternsApplied: text('patterns_applied').array(), // Design patterns used
  bestPracticesFollowed: text('best_practices_followed').array(),
  antiPatternsAvoided: text('anti_patterns_avoided').array(),

  issuesFixed: jsonb('issues_fixed').array().$type<Array<{
    type: string
    severity: string
    description: string
    file: string
    lineNumber?: number
    resolution: string
  }>>(),

  // Code changes summary
  codeChanges: jsonb('code_changes').$type<{
    filesModified: number
    linesAdded: number
    linesRemoved: number
    filesCreated: string[]
    filesDeleted: string[]
    refactoringType?: string
    complexityBefore?: number
    complexityAfter?: number
  }>(),

  // Quality impact
  qualityImpact: jsonb('quality_impact').$type<{
    testCoverageChange: number
    complexityChange: number
    maintainabilityChange: number
    performanceChange?: number
    securityIssuesResolved?: number
  }>(),

  // Learning and knowledge
  knowledgeGained: jsonb('knowledge_gained').$type<{
    newPatterns: string[]
    newLibraries: string[]
    newTechniques: string[]
    documentationCreated: boolean
  }>(),

  // Relationships
  eventIds: text('event_ids').array().notNull(), // All events from this session
  metricIds: uuid('metric_ids').array(), // Metrics calculated
  insightIds: uuid('insight_ids').array(), // Insights generated
  prNumbers: integer('pr_numbers').array(), // Pull requests created

  // Performance metrics
  responseTime: jsonb('response_time').$type<{
    average: number
    p50: number
    p95: number
    p99: number
  }>(),

  // Before/after snapshots
  metricSnapshots: jsonb('metric_snapshots').$type<{
    before: Record<string, any>
    after: Record<string, any>
    improvements: string[]
    regressions: string[]
  }>(),

  // Session metadata
  claudeModel: varchar('claude_model', { length: 50 }),
  clientVersion: varchar('client_version', { length: 20 }),
  environment: varchar('environment', { length: 20 }),

  // Success tracking
  sessionSuccess: boolean('session_success').default(true),
  errorMessages: text('error_messages').array(),
  userSatisfaction: integer('user_satisfaction'), // 1-5 rating

  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  projectId: uuid('project_id').references(() => projects.id),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdx: index('idx_sessions_user').on(table.userId),
  timeIdx: index('idx_sessions_time').on(table.startTime, table.endTime),
  projectIdx: index('idx_sessions_project').on(table.projectId),
  eventIdsIdx: index('idx_sessions_events').using('gin', table.eventIds),
  decisionsIdx: index('idx_sessions_decisions').using('gin', sql`decisions`),
}))

// ============================================================================
// PULL REQUESTS TABLE - Track PRs with complete lineage
// ============================================================================

export const pullRequests = pgTable('pull_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  prNumber: integer('pr_number').notNull(),
  githubUrl: text('github_url').notNull(),
  title: text('title').notNull(),
  state: varchar('state', { length: 20 }).notNull(), // 'open', 'closed', 'merged'

  // Auto-generated documentation
  generatedDescription: text('generated_description').notNull(),
  changelogEntry: text('changelog_entry'),
  releaseNotes: text('release_notes'),

  // Compliance and quality reports
  complianceReport: jsonb('compliance_report').notNull().$type<{
    passedChecks: string[]
    failedChecks: string[]
    warnings: string[]
    score: number
    standards: string[] // 'ISO-9001', 'SOC2', etc.
  }>(),

  metricsReport: jsonb('metrics_report').notNull().$type<{
    complexity: {
      before: number
      after: number
      change: number
    }
    coverage: {
      before: number
      after: number
      change: number
    }
    performance: {
      before: Record<string, number>
      after: Record<string, number>
    }
    security: {
      issuesFixed: number
      newIssues: number
      score: number
    }
  }>(),

  // Impact analysis
  impactAnalysis: jsonb('impact_analysis').$type<{
    affectedComponents: string[]
    affectedTeams: string[]
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    breakingChanges: boolean
    migrationRequired: boolean
    rollbackPlan?: string
  }>(),

  // Review process
  reviewProcess: jsonb('review_process').$type<{
    requiredReviewers: string[]
    actualReviewers: string[]
    reviewComments: number
    changesRequested: number
    approvalsReceived: number
    reviewDuration: number // in hours
  }>(),

  // Complete lineage
  claudeSessionIds: text('claude_session_ids').array().notNull(),
  sourceEventIds: text('source_event_ids').array().notNull(),
  metricsAtCreation: uuid('metrics_at_creation').array(), // Snapshot of metrics when PR created
  metricsAtMerge: uuid('metrics_at_merge').array(), // Snapshot when merged

  // Git information
  baseBranch: varchar('base_branch', { length: 255 }).notNull(),
  headBranch: varchar('head_branch', { length: 255 }).notNull(),
  commits: jsonb('commits').array().$type<Array<{
    sha: string
    message: string
    author: string
    timestamp: string
    stats: {
      additions: number
      deletions: number
      filesChanged: number
    }
  }>>(),

  filesChanged: integer('files_changed').notNull(),
  additions: integer('additions').notNull(),
  deletions: integer('deletions').notNull(),

  // Metadata
  createdAt: timestamp('created_at').notNull(),
  mergedAt: timestamp('merged_at'),
  closedAt: timestamp('closed_at'),
  authorUserId: varchar('author_user_id', { length: 255 }).notNull(),
  mergedBy: varchar('merged_by', { length: 255 }),

  projectId: uuid('project_id').notNull().references(() => projects.id),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
}, (table) => ({
  prNumberIdx: uniqueIndex('idx_pr_number').on(table.projectId, table.prNumber),
  stateIdx: index('idx_pr_state').on(table.state),
  authorIdx: index('idx_pr_author').on(table.authorUserId),
  sessionIdsIdx: index('idx_pr_sessions').using('gin', table.claudeSessionIds),
  createdAtIdx: index('idx_pr_created').on(table.createdAt),
}))

// ============================================================================
// GROWTH RINGS TABLE - Historical snapshots (like tree rings)
// ============================================================================

export const growthRings = pgTable('growth_rings', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  ringDate: date('ring_date').notNull(), // One ring per day
  ringNumber: integer('ring_number').notNull(), // Sequential number for this project

  // Complete preserved metrics for the day
  daySnapshot: jsonb('day_snapshot').notNull().$type<{
    // Core metrics
    linesOfCode: number
    fileCount: number
    functionCount: number
    classCount: number

    // Quality metrics
    complexity: number
    coverage: number
    technicalDebt: number
    codeSmells: number

    // Team metrics
    activeContributors: number
    commits: number
    pullRequests: number
    issuesClosed: number

    // Performance snapshot
    buildTime: number
    testExecutionTime: number
    deploymentFrequency: number

    // Dependencies
    dependencies: number
    devDependencies: number
    outdatedDependencies: number
  }>(),

  // Growth and change metrics
  growthDelta: jsonb('growth_delta').notNull().$type<{
    linesAdded: number
    linesRemoved: number
    filesAdded: string[]
    filesRemoved: string[]
    filesModified: number

    complexityChange: number
    coverageChange: number
    debtChange: number

    newContributors: string[]
    departedContributors: string[]
  }>(),

  // Significant events and decisions
  decisions: text('decisions').array(), // Major decisions made
  milestones: jsonb('milestones').array().$type<Array<{
    type: string // 'release', 'feature', 'refactoring', 'migration'
    description: string
    impact: string
  }>>(),

  incidents: jsonb('incidents').array().$type<Array<{
    severity: string
    description: string
    resolution: string
    duration: number // in minutes
  }>>(),

  // Weather on this day (external conditions)
  weather: jsonb('weather').$type<{
    marketConditions: string
    teamMorale: number // 1-10
    externalPressure: string
    majorEvents: string[]
  }>(),

  // Lineage preservation
  eventCount: integer('event_count').notNull(),
  eventIdRange: text('event_id_range').array().notNull(), // [first_id, last_id]
  metricsCalculated: integer('metrics_calculated').notNull(),
  insightsGenerated: integer('insights_generated').notNull(),

  // Ring characteristics (like actual tree rings)
  ringThickness: decimal('ring_thickness', { precision: 10, scale: 4 }), // Growth rate
  ringDensity: decimal('ring_density', { precision: 10, scale: 4 }), // Code density
  ringColor: varchar('ring_color', { length: 7 }), // Hex color based on health

  // Seasonal patterns
  season: varchar('season', { length: 20 }), // 'growth', 'maintenance', 'dormant', 'crisis'

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  projectDateIdx: uniqueIndex('idx_rings_project_date').on(table.projectId, table.ringDate),
  ringNumberIdx: index('idx_rings_number').on(table.projectId, table.ringNumber),
  dateIdx: index('idx_rings_date').on(table.ringDate),
  eventRangeIdx: index('idx_rings_event_range').using('gin', table.eventIdRange),
}))

// ============================================================================
// RELATIONSHIPS
// ============================================================================

export const forestCanopyRelations = relations(forestCanopy, ({ one, many }) => ({
  project: one(projects, {
    fields: [forestCanopy.projectId],
    references: [projects.id],
  }),
  previousSnapshot: one(forestCanopy, {
    fields: [forestCanopy.previousSnapshotId],
    references: [forestCanopy.id],
  }),
}))

export const claudeSessionsRelations = relations(claudeSessions, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [claudeSessions.organizationId],
    references: [organizations.id],
  }),
  project: one(projects, {
    fields: [claudeSessions.projectId],
    references: [projects.id],
  }),
  pullRequests: many(pullRequests),
}))

export const pullRequestsRelations = relations(pullRequests, ({ one }) => ({
  project: one(projects, {
    fields: [pullRequests.projectId],
    references: [projects.id],
  }),
  organization: one(organizations, {
    fields: [pullRequests.organizationId],
    references: [organizations.id],
  }),
}))

export const growthRingsRelations = relations(growthRings, ({ one }) => ({
  project: one(projects, {
    fields: [growthRings.projectId],
    references: [projects.id],
  }),
}))

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ForestCanopy = typeof forestCanopy.$inferSelect
export type NewForestCanopy = typeof forestCanopy.$inferInsert
export type ClaudeSession = typeof claudeSessions.$inferSelect
export type NewClaudeSession = typeof claudeSessions.$inferInsert
export type PullRequest = typeof pullRequests.$inferSelect
export type NewPullRequest = typeof pullRequests.$inferInsert
export type GrowthRing = typeof growthRings.$inferSelect
export type NewGrowthRing = typeof growthRings.$inferInsert