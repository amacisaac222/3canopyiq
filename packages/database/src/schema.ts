import {
  pgTable,
  pgEnum,
  varchar,
  text,
  timestamp,
  uuid,
  jsonb,
  integer,
  decimal,
  boolean,
  index,
  uniqueIndex,
  primaryKey,
  foreignKey,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { relations } from 'drizzle-orm'

// ============================================================================
// ENUMS - Define all possible values for categorical data
// ============================================================================

export const sourceTypeEnum = pgEnum('source_type', [
  'claude_code',
  'github',
  'git',
  'slack',
  'manual',
  'api',
  'webhook',
  'ci_cd',
  'monitoring',
])

export const environmentTypeEnum = pgEnum('environment_type', [
  'development',
  'staging',
  'production',
  'testing',
  'local',
])

export const eventCategoryEnum = pgEnum('event_category', [
  'code_change',
  'analysis',
  'decision',
  'deployment',
  'incident',
  'review',
  'planning',
  'documentation',
  'configuration',
])

export const transformationTypeEnum = pgEnum('transformation_type', [
  'aggregation',
  'calculation',
  'enrichment',
  'validation',
  'normalization',
  'inference',
  'prediction',
  'classification',
])

export const metricTypeEnum = pgEnum('metric_type', [
  'velocity',
  'complexity',
  'quality',
  'coverage',
  'performance',
  'reliability',
  'security',
  'maintainability',
])

export const insightTypeEnum = pgEnum('insight_type', [
  'trend',
  'anomaly',
  'recommendation',
  'warning',
  'achievement',
  'prediction',
  'correlation',
])

export const decisionStatusEnum = pgEnum('decision_status', [
  'proposed',
  'approved',
  'rejected',
  'implemented',
  'reverted',
  'superseded',
])

// ============================================================================
// CORE TABLES - The foundation of data lineage
// ============================================================================

// Organizations - Top level grouping
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Projects belong to organizations
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  name: varchar('name', { length: 255 }).notNull(),
  repositoryUrl: text('repository_url'),
  metadata: jsonb('metadata').$type<{
    language?: string
    framework?: string
    tags?: string[]
  }>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgIdx: index('idx_projects_org').on(table.organizationId),
}))

// ============================================================================
// EVENTS TABLE - The root of all data lineage
// ============================================================================

export const events = pgTable('events', {
  // Unique identifier with pattern: evt_[timestamp]_[random]
  id: varchar('id', { length: 50 }).primaryKey().$defaultFn(() => {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 7)
    return `evt_${timestamp}_${random}`
  }),

  timestamp: timestamp('timestamp').notNull().defaultNow(),

  // Source tracking - Where did this event come from?
  sourceType: sourceTypeEnum('source_type').notNull(),
  sourceId: varchar('source_id', { length: 255 }).notNull(), // session ID, PR number, etc
  sourceUrl: text('source_url'), // Direct link to source
  userId: varchar('user_id', { length: 255 }),

  // Event classification
  category: eventCategoryEnum('category').notNull(),
  action: varchar('action', { length: 100 }).notNull(), // file_modified, complexity_calculated
  label: text('label'), // Human-readable description
  value: jsonb('value').notNull().$type<Record<string, any>>(), // Actual event data

  // Context for lineage - The tree structure
  intent: text('intent'), // What the user was trying to accomplish
  parentEventIds: text('parent_event_ids').array(), // Events that led to this
  childEventIds: text('child_event_ids').array(), // Events triggered by this

  // Git context for code-related events
  gitCommit: varchar('git_commit', { length: 40 }),
  gitBranch: varchar('git_branch', { length: 255 }),
  gitRepository: text('git_repository'),
  prNumber: integer('pr_number'),

  // Evidence and confidence
  confidence: decimal('confidence', { precision: 3, scale: 2 }).default('1.00'), // 0.00 to 1.00
  algorithm: varchar('algorithm', { length: 50 }), // Which algorithm produced this
  algorithmVersion: varchar('algorithm_version', { length: 20 }),
  rawData: text('raw_data'), // Original unprocessed data for audit

  // Organization and environment
  projectId: uuid('project_id').references(() => projects.id),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  environmentType: environmentTypeEnum('environment_type').notNull().default('development'),

  // Search and categorization
  searchVector: text('search_vector'), // For full-text search
  tags: text('tags').array(),

  // Metadata
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  timestampIdx: index('idx_events_timestamp').on(table.timestamp),
  sourceIdx: index('idx_events_source').on(table.sourceType, table.sourceId),
  categoryIdx: index('idx_events_category').on(table.category, table.action),
  projectIdx: index('idx_events_project').on(table.projectId),
  orgIdx: index('idx_events_org').on(table.organizationId),
  gitIdx: index('idx_events_git').on(table.gitCommit, table.gitBranch),
  tagsIdx: index('idx_events_tags').on(table.tags),
}))

// ============================================================================
// DATA TRANSFORMATIONS - Track how data changes
// ============================================================================

export const dataTransformations = pgTable('data_transformations', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Input events (what went in)
  inputEventIds: text('input_event_ids').array().notNull(),

  // Output event (what came out)
  outputEventId: varchar('output_event_id', { length: 50 }).notNull().references(() => events.id),

  // Transformation details
  transformationType: transformationTypeEnum('transformation_type').notNull(),
  transformationName: varchar('transformation_name', { length: 100 }).notNull(),
  transformationVersion: varchar('transformation_version', { length: 20 }).notNull(),

  // Parameters and configuration
  parameters: jsonb('parameters').$type<Record<string, any>>(),

  // Performance metrics
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  durationMs: integer('duration_ms').notNull(),
  resourcesUsed: jsonb('resources_used').$type<{
    cpu?: number
    memory?: number
    io?: number
  }>(),

  // Quality metrics
  inputRecordCount: integer('input_record_count'),
  outputRecordCount: integer('output_record_count'),
  errorCount: integer('error_count').default(0),
  warningCount: integer('warning_count').default(0),

  // Validation
  validated: boolean('validated').default(false),
  validationResults: jsonb('validation_results').$type<any[]>(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  outputEventIdx: index('idx_transformations_output').on(table.outputEventId),
  typeIdx: index('idx_transformations_type').on(table.transformationType),
}))

// ============================================================================
// METRICS - Computed values with complete lineage and drill-down
// ============================================================================

export const metrics = pgTable('metrics', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Core metric identity
  name: varchar('name', { length: 100 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  value: decimal('value', { precision: 20, scale: 6 }).notNull(),
  unit: varchar('unit', { length: 50 }), // e.g., 'lines', 'percentage', 'ms', 'USD'
  timestamp: timestamp('timestamp').notNull().defaultNow(),

  // Link to the event that represents this metric calculation
  eventId: varchar('event_id', { length: 50 }).notNull().references(() => events.id),

  // Complete derivation lineage
  formula: text('formula').notNull(), // e.g., "SUM(complexity) / COUNT(files)"
  sourceEventIds: text('source_event_ids').array().notNull(), // All events used in calculation
  calculationSteps: jsonb('calculation_steps').notNull().$type<Array<{
    step: number
    operation: string
    inputs: any[]
    output: any
    duration_ms: number
    description?: string
  }>>(), // Step-by-step breakdown of calculation

  // Drill-down capabilities
  drillDownQuery: text('drill_down_query'), // SQL or query to get details
  drillDownLevels: text('drill_down_levels').array(), // ['organization', 'project', 'file', 'function', 'line']
  interactivePath: text('interactive_path'), // URL for exploration, e.g., '/metrics/{id}/explore'
  drillDownData: jsonb('drill_down_data').$type<{
    available_dimensions: string[]
    available_filters: Record<string, string[]>
    visualization_type?: string
    default_view?: string
  }>(),

  // Caching and performance
  calculatedAt: timestamp('calculated_at').notNull().defaultNow(),
  calculatedBy: varchar('calculated_by', { length: 100 }).notNull(), // 'system', 'scheduler', userId
  ttlSeconds: integer('ttl_seconds').default(3600), // Time to live in seconds
  isCached: boolean('is_cached').default(false),
  cacheKey: varchar('cache_key', { length: 255 }).unique(),
  cacheInvalidatedAt: timestamp('cache_invalidated_at'),
  nextCalculationAt: timestamp('next_calculation_at'),

  // Dependencies and relationships
  projectId: uuid('project_id').references(() => projects.id),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  dependentMetricIds: uuid('dependent_metric_ids').array(), // Metrics that depend on this one
  parentMetricIds: uuid('parent_metric_ids').array(), // Metrics this one depends on

  // What is being measured (categorization)
  metricType: metricTypeEnum('metric_type').notNull(),
  metricCategory: varchar('metric_category', { length: 50 }), // 'kpi', 'diagnostic', 'operational'
  metricTier: integer('metric_tier').default(1), // 1=primary, 2=secondary, 3=supporting

  // Time context
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  granularity: varchar('granularity', { length: 20 }), // 'hourly', 'daily', 'weekly', 'monthly'

  // Statistical information
  sampleSize: integer('sample_size'),
  confidence: decimal('confidence', { precision: 3, scale: 2 }),
  marginOfError: decimal('margin_of_error', { precision: 10, scale: 4 }),
  standardDeviation: decimal('standard_deviation', { precision: 10, scale: 4 }),
  percentile: jsonb('percentile').$type<{
    p50?: number
    p75?: number
    p90?: number
    p95?: number
    p99?: number
  }>(),

  // Baseline, targets, and thresholds
  baselineValue: decimal('baseline_value', { precision: 20, scale: 6 }),
  targetValue: decimal('target_value', { precision: 20, scale: 6 }),
  threshold: jsonb('threshold').$type<{
    critical_low?: number
    warning_low?: number
    normal_min?: number
    normal_max?: number
    warning_high?: number
    critical_high?: number
  }>(),

  // Historical tracking
  previousValue: decimal('previous_value', { precision: 20, scale: 6 }),
  changeAmount: decimal('change_amount', { precision: 20, scale: 6 }),
  changePercentage: decimal('change_percentage', { precision: 10, scale: 4 }),
  trend: varchar('trend', { length: 20 }), // 'increasing', 'stable', 'decreasing', 'volatile'

  // Context and metadata
  dimensions: jsonb('dimensions').$type<Record<string, any>>(), // e.g., {team: 'frontend', component: 'auth', environment: 'prod'}
  tags: text('tags').array(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),

  // Audit and versioning
  version: integer('version').default(1),
  isLatest: boolean('is_latest').default(true),
  supersededBy: uuid('superseded_by'),
  auditLog: jsonb('audit_log').$type<Array<{
    timestamp: string
    action: string
    user?: string
    changes?: Record<string, any>
  }>>(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  eventIdx: index('idx_metrics_event').on(table.eventId),
  projectTypeIdx: index('idx_metrics_project_type').on(table.projectId, table.metricType),
  periodIdx: index('idx_metrics_period').on(table.periodStart, table.periodEnd),
  timestampIdx: index('idx_metrics_timestamp').on(table.timestamp),
  cacheKeyIdx: index('idx_metrics_cache_key').on(table.cacheKey),
  nameIdx: index('idx_metrics_name').on(table.name),
  categoryIdx: index('idx_metrics_category').on(table.metricCategory),
  latestIdx: index('idx_metrics_latest').on(table.isLatest, table.projectId),
  tagsIdx: index('idx_metrics_tags').on(table.tags),
}))

// ============================================================================
// INSIGHTS - Derived intelligence with lineage
// ============================================================================

export const insights = pgTable('insights', {
  id: uuid('id').primaryKey().defaultRandom(),

  // The event that represents this insight generation
  eventId: varchar('event_id', { length: 50 }).notNull().references(() => events.id),

  // Source metrics that led to this insight
  sourceMetricIds: uuid('source_metric_ids').array().notNull(),

  // Insight classification
  insightType: insightTypeEnum('insight_type').notNull(),
  severity: varchar('severity', { length: 20 }).notNull(), // info, warning, critical

  // The insight itself
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),

  // Evidence and reasoning
  evidence: jsonb('evidence').notNull().$type<Array<{
    type: string
    description: string
    data: any
  }>>(),

  reasoning: text('reasoning'), // Explanation of how we arrived at this insight
  confidence: decimal('confidence', { precision: 3, scale: 2 }).notNull(),

  // Recommendations
  recommendations: jsonb('recommendations').$type<Array<{
    action: string
    impact: string
    effort: string
    priority: number
  }>>(),

  // Impact assessment
  impactedAreas: text('impacted_areas').array(),
  estimatedImpact: jsonb('estimated_impact').$type<{
    velocity?: number
    quality?: number
    cost?: number
  }>(),

  // Status tracking
  status: varchar('status', { length: 20 }).default('active'), // active, acknowledged, resolved, dismissed
  acknowledgedBy: varchar('acknowledged_by', { length: 255 }),
  acknowledgedAt: timestamp('acknowledged_at'),
  resolvedBy: varchar('resolved_by', { length: 255 }),
  resolvedAt: timestamp('resolved_at'),

  // Validity period
  validFrom: timestamp('valid_from').notNull().defaultNow(),
  validUntil: timestamp('valid_until'),

  // Organization
  projectId: uuid('project_id').references(() => projects.id),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),

  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  eventIdx: index('idx_insights_event').on(table.eventId),
  typeIdx: index('idx_insights_type').on(table.insightType),
  statusIdx: index('idx_insights_status').on(table.status),
  projectIdx: index('idx_insights_project').on(table.projectId),
}))

// ============================================================================
// DECISIONS - Actions taken based on insights
// ============================================================================

export const decisions = pgTable('decisions', {
  id: uuid('id').primaryKey().defaultRandom(),

  // The event that represents this decision
  eventId: varchar('event_id', { length: 50 }).notNull().references(() => events.id),

  // What led to this decision
  triggeringInsightIds: uuid('triggering_insight_ids').array(),
  supportingMetricIds: uuid('supporting_metric_ids').array(),

  // Decision details
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  rationale: text('rationale').notNull(), // Why this decision was made

  // Decision maker
  decisionMaker: varchar('decision_maker', { length: 255 }).notNull(),
  decisionMakerRole: varchar('decision_maker_role', { length: 100 }),

  // Status and implementation
  status: decisionStatusEnum('status').notNull().default('proposed'),
  approvedBy: varchar('approved_by', { length: 255 }),
  approvedAt: timestamp('approved_at'),
  implementedBy: varchar('implemented_by', { length: 255 }),
  implementedAt: timestamp('implemented_at'),

  // Expected vs actual outcomes
  expectedOutcome: jsonb('expected_outcome').$type<{
    description: string
    metrics: Record<string, number>
    timeline: string
  }>(),

  actualOutcome: jsonb('actual_outcome').$type<{
    description: string
    metrics: Record<string, number>
    variance: Record<string, number>
  }>(),

  // Implementation tracking
  implementationSteps: jsonb('implementation_steps').$type<Array<{
    step: string
    status: string
    completedAt?: string
  }>>(),

  // Impact and rollback
  impactAssessment: jsonb('impact_assessment').$type<Record<string, any>>(),
  rollbackPlan: text('rollback_plan'),
  wasReverted: boolean('was_reverted').default(false),
  revertedAt: timestamp('reverted_at'),
  revertReason: text('revert_reason'),

  // Organization
  projectId: uuid('project_id').references(() => projects.id),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),

  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  eventIdx: index('idx_decisions_event').on(table.eventId),
  statusIdx: index('idx_decisions_status').on(table.status),
  projectIdx: index('idx_decisions_project').on(table.projectId),
}))

// ============================================================================
// DATA LINEAGE PATHS - Explicit lineage tracking
// ============================================================================

export const dataLineagePaths = pgTable('data_lineage_paths', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Start and end of the lineage path
  sourceEventId: varchar('source_event_id', { length: 50 }).notNull().references(() => events.id),
  targetEventId: varchar('target_event_id', { length: 50 }).notNull().references(() => events.id),

  // The complete path (array of event IDs from source to target)
  pathEventIds: text('path_event_ids').array().notNull(),
  pathLength: integer('path_length').notNull(),

  // Path characteristics
  pathType: varchar('path_type', { length: 50 }).notNull(), // direct, transformation, aggregation
  isDirectPath: boolean('is_direct_path').notNull().default(false),

  // Quality and confidence
  confidence: decimal('confidence', { precision: 3, scale: 2 }).notNull(),
  dataQualityScore: decimal('data_quality_score', { precision: 3, scale: 2 }),

  // Performance
  totalDurationMs: integer('total_duration_ms'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  sourceIdx: index('idx_lineage_source').on(table.sourceEventId),
  targetIdx: index('idx_lineage_target').on(table.targetEventId),
  uniquePath: uniqueIndex('idx_lineage_unique_path').on(table.sourceEventId, table.targetEventId),
}))

// ============================================================================
// AUDIT LOG - Complete audit trail
// ============================================================================

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),

  // What happened
  action: varchar('action', { length: 50 }).notNull(), // create, update, delete, access
  tableName: varchar('table_name', { length: 100 }).notNull(),
  recordId: varchar('record_id', { length: 255 }).notNull(),

  // Who did it
  userId: varchar('user_id', { length: 255 }).notNull(),
  userRole: varchar('user_role', { length: 50 }),
  sessionId: varchar('session_id', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),

  // What changed
  oldValues: jsonb('old_values').$type<Record<string, any>>(),
  newValues: jsonb('new_values').$type<Record<string, any>>(),
  changedFields: text('changed_fields').array(),

  // Context
  reason: text('reason'), // Why this action was taken
  eventId: varchar('event_id', { length: 50 }).references(() => events.id), // Link to triggering event

  // Security
  riskScore: decimal('risk_score', { precision: 3, scale: 2 }),
  flagged: boolean('flagged').default(false),
  flagReason: text('flag_reason'),

  timestamp: timestamp('timestamp').notNull().defaultNow(),
}, (table) => ({
  timestampIdx: index('idx_audit_timestamp').on(table.timestamp),
  actionIdx: index('idx_audit_action').on(table.action, table.tableName),
  userIdx: index('idx_audit_user').on(table.userId),
  recordIdx: index('idx_audit_record').on(table.tableName, table.recordId),
}))

// ============================================================================
// DATA QUALITY CHECKS - Track data quality throughout lineage
// ============================================================================

export const dataQualityChecks = pgTable('data_quality_checks', {
  id: uuid('id').primaryKey().defaultRandom(),

  // What was checked
  eventId: varchar('event_id', { length: 50 }).notNull().references(() => events.id),
  checkType: varchar('check_type', { length: 50 }).notNull(), // completeness, accuracy, consistency
  checkName: varchar('check_name', { length: 100 }).notNull(),

  // Results
  passed: boolean('passed').notNull(),
  score: decimal('score', { precision: 5, scale: 2 }), // 0.00 to 100.00

  // Details
  rulesChecked: integer('rules_checked').notNull(),
  rulesPassed: integer('rules_passed').notNull(),
  rulesFailed: integer('rules_failed').notNull(),

  // Failures and warnings
  failures: jsonb('failures').$type<Array<{
    rule: string
    message: string
    severity: string
    data?: any
  }>>(),

  warnings: jsonb('warnings').$type<Array<{
    rule: string
    message: string
    data?: any
  }>>(),

  // Remediation
  autoFixed: boolean('auto_fixed').default(false),
  fixesApplied: jsonb('fixes_applied').$type<any[]>(),

  performedAt: timestamp('performed_at').notNull().defaultNow(),
}, (table) => ({
  eventIdx: index('idx_quality_event').on(table.eventId),
  checkTypeIdx: index('idx_quality_check_type').on(table.checkType),
  passedIdx: index('idx_quality_passed').on(table.passed),
}))

// ============================================================================
// RELATIONSHIPS - Define how tables relate for lineage tracking
// ============================================================================

export const eventsRelations = relations(events, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [events.organizationId],
    references: [organizations.id],
  }),
  project: one(projects, {
    fields: [events.projectId],
    references: [projects.id],
  }),
  transformations: many(dataTransformations),
  metrics: many(metrics),
  insights: many(insights),
  decisions: many(decisions),
  qualityChecks: many(dataQualityChecks),
  sourceLineagePaths: many(dataLineagePaths, {
    relationName: 'sourceEvent',
  }),
  targetLineagePaths: many(dataLineagePaths, {
    relationName: 'targetEvent',
  }),
}))

export const dataTransformationsRelations = relations(dataTransformations, ({ one }) => ({
  outputEvent: one(events, {
    fields: [dataTransformations.outputEventId],
    references: [events.id],
  }),
}))

export const metricsRelations = relations(metrics, ({ one }) => ({
  event: one(events, {
    fields: [metrics.eventId],
    references: [events.id],
  }),
  project: one(projects, {
    fields: [metrics.projectId],
    references: [projects.id],
  }),
}))

export const insightsRelations = relations(insights, ({ one }) => ({
  event: one(events, {
    fields: [insights.eventId],
    references: [events.id],
  }),
  organization: one(organizations, {
    fields: [insights.organizationId],
    references: [organizations.id],
  }),
  project: one(projects, {
    fields: [insights.projectId],
    references: [projects.id],
  }),
}))

export const decisionsRelations = relations(decisions, ({ one }) => ({
  event: one(events, {
    fields: [decisions.eventId],
    references: [events.id],
  }),
  organization: one(organizations, {
    fields: [decisions.organizationId],
    references: [organizations.id],
  }),
  project: one(projects, {
    fields: [decisions.projectId],
    references: [projects.id],
  }),
}))

export const dataLineagePathsRelations = relations(dataLineagePaths, ({ one }) => ({
  sourceEvent: one(events, {
    fields: [dataLineagePaths.sourceEventId],
    references: [events.id],
    relationName: 'sourceEvent',
  }),
  targetEvent: one(events, {
    fields: [dataLineagePaths.targetEventId],
    references: [events.id],
    relationName: 'targetEvent',
  }),
}))

export const dataQualityChecksRelations = relations(dataQualityChecks, ({ one }) => ({
  event: one(events, {
    fields: [dataQualityChecks.eventId],
    references: [events.id],
  }),
}))

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  event: one(events, {
    fields: [auditLog.eventId],
    references: [events.id],
  }),
}))

export const organizationsRelations = relations(organizations, ({ many }) => ({
  projects: many(projects),
  events: many(events),
  insights: many(insights),
  decisions: many(decisions),
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [projects.organizationId],
    references: [organizations.id],
  }),
  events: many(events),
  metrics: many(metrics),
  insights: many(insights),
  decisions: many(decisions),
}))

// ============================================================================
// TYPE EXPORTS - For TypeScript usage
// ============================================================================

export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
export type DataTransformation = typeof dataTransformations.$inferSelect
export type Metric = typeof metrics.$inferSelect
export type Insight = typeof insights.$inferSelect
export type Decision = typeof decisions.$inferSelect
export type DataLineagePath = typeof dataLineagePaths.$inferSelect
export type AuditLogEntry = typeof auditLog.$inferSelect
export type DataQualityCheck = typeof dataQualityChecks.$inferSelect
export type Organization = typeof organizations.$inferSelect
export type Project = typeof projects.$inferSelect