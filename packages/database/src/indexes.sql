-- ============================================================================
-- PERFORMANCE INDEXES FOR CANOPYIQ
-- ============================================================================

-- Events table indexes
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_source_type ON events(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_events_project_id ON events(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_organization_id ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_category_action ON events(category, action);
CREATE INDEX IF NOT EXISTS idx_events_git_context ON events(git_commit, git_branch) WHERE git_commit IS NOT NULL;

-- GIN indexes for array/JSONB columns
CREATE INDEX IF NOT EXISTS idx_events_parent_ids_gin ON events USING GIN(parent_event_ids);
CREATE INDEX IF NOT EXISTS idx_events_child_ids_gin ON events USING GIN(child_event_ids);
CREATE INDEX IF NOT EXISTS idx_events_tags_gin ON events USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_events_value_gin ON events USING GIN(value);

-- Full-text search on events
CREATE INDEX IF NOT EXISTS idx_events_search_vector ON events USING GIN(to_tsvector('english',
    COALESCE(label, '') || ' ' ||
    COALESCE(intent, '') || ' ' ||
    COALESCE(search_vector, '')
));

-- Metrics table indexes
CREATE INDEX IF NOT EXISTS idx_metrics_project_timestamp ON metrics(project_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_name ON metrics(name);
CREATE INDEX IF NOT EXISTS idx_metrics_type_category ON metrics(metric_type, metric_category);
CREATE INDEX IF NOT EXISTS idx_metrics_cache ON metrics(cache_key) WHERE cache_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_metrics_latest ON metrics(project_id, is_latest) WHERE is_latest = true;

-- GIN indexes for metrics arrays
CREATE INDEX IF NOT EXISTS idx_metrics_source_events_gin ON metrics USING GIN(source_event_ids);
CREATE INDEX IF NOT EXISTS idx_metrics_parent_metrics_gin ON metrics USING GIN(parent_metric_ids);
CREATE INDEX IF NOT EXISTS idx_metrics_dependent_metrics_gin ON metrics USING GIN(dependent_metric_ids);
CREATE INDEX IF NOT EXISTS idx_metrics_tags_gin ON metrics USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_metrics_dimensions_gin ON metrics USING GIN(dimensions);

-- Forest Canopy indexes
CREATE INDEX IF NOT EXISTS idx_canopy_project_health ON forest_canopy(project_id, health_score DESC);
CREATE INDEX IF NOT EXISTS idx_canopy_timestamp ON forest_canopy(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_canopy_metrics_gin ON forest_canopy USING GIN(source_metric_ids);
CREATE INDEX IF NOT EXISTS idx_canopy_events_gin ON forest_canopy USING GIN(source_event_ids);

-- Claude Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_time ON claude_sessions(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_project ON claude_sessions(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_events_gin ON claude_sessions USING GIN(event_ids);
CREATE INDEX IF NOT EXISTS idx_sessions_metrics_gin ON claude_sessions USING GIN(metric_ids);
CREATE INDEX IF NOT EXISTS idx_sessions_decisions_gin ON claude_sessions USING GIN(decisions);
CREATE INDEX IF NOT EXISTS idx_sessions_files_gin ON claude_sessions USING GIN(files_in_scope);

-- Pull Requests indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_pr_unique ON pull_requests(project_id, pr_number);
CREATE INDEX IF NOT EXISTS idx_pr_state_created ON pull_requests(state, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pr_author_created ON pull_requests(author_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pr_sessions_gin ON pull_requests USING GIN(claude_session_ids);
CREATE INDEX IF NOT EXISTS idx_pr_events_gin ON pull_requests USING GIN(source_event_ids);

-- Growth Rings indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_rings_project_date_unique ON growth_rings(project_id, ring_date);
CREATE INDEX IF NOT EXISTS idx_rings_date ON growth_rings(ring_date DESC);
CREATE INDEX IF NOT EXISTS idx_rings_project_number ON growth_rings(project_id, ring_number DESC);

-- Data Lineage Paths indexes
CREATE INDEX IF NOT EXISTS idx_lineage_source_target ON data_lineage_paths(source_event_id, target_event_id);
CREATE INDEX IF NOT EXISTS idx_lineage_confidence ON data_lineage_paths(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_lineage_path_gin ON data_lineage_paths USING GIN(path_event_ids);

-- Data Transformations indexes
CREATE INDEX IF NOT EXISTS idx_transform_output ON data_transformations(output_event_id);
CREATE INDEX IF NOT EXISTS idx_transform_type ON data_transformations(transformation_type);
CREATE INDEX IF NOT EXISTS idx_transform_inputs_gin ON data_transformations USING GIN(input_event_ids);

-- Insights indexes
CREATE INDEX IF NOT EXISTS idx_insights_type_severity ON insights(insight_type, severity);
CREATE INDEX IF NOT EXISTS idx_insights_project_status ON insights(project_id, status);
CREATE INDEX IF NOT EXISTS idx_insights_metrics_gin ON insights USING GIN(source_metric_ids);

-- Decisions indexes
CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status);
CREATE INDEX IF NOT EXISTS idx_decisions_project ON decisions(project_id);
CREATE INDEX IF NOT EXISTS idx_decisions_insights_gin ON decisions USING GIN(triggering_insight_ids);

-- Data Quality Checks indexes
CREATE INDEX IF NOT EXISTS idx_quality_event ON data_quality_checks(event_id);
CREATE INDEX IF NOT EXISTS idx_quality_passed ON data_quality_checks(passed, performed_at DESC);

-- Audit Log indexes
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action, table_name);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_events_lineage_lookup ON events(id, organization_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_metrics_calculation_lookup ON metrics(project_id, metric_type, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_canopy_health_tracking ON forest_canopy(project_id, timestamp, health_score);

-- Partial indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_recent ON events(timestamp)
    WHERE timestamp > CURRENT_DATE - INTERVAL '30 days';

CREATE INDEX IF NOT EXISTS idx_metrics_cached ON metrics(cache_key, next_calculation_at)
    WHERE is_cached = true AND cache_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_active ON claude_sessions(session_id, start_time)
    WHERE end_time IS NULL;

CREATE INDEX IF NOT EXISTS idx_pr_open ON pull_requests(project_id, created_at)
    WHERE state = 'open';

-- ============================================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- ============================================================================

-- Daily metrics summary
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_metrics_summary AS
SELECT
    project_id,
    DATE(timestamp) as metric_date,
    metric_type,
    COUNT(*) as metric_count,
    AVG(CAST(value AS FLOAT)) as avg_value,
    MAX(CAST(value AS FLOAT)) as max_value,
    MIN(CAST(value AS FLOAT)) as min_value,
    ARRAY_AGG(id) as metric_ids
FROM metrics
WHERE is_latest = true
GROUP BY project_id, DATE(timestamp), metric_type;

CREATE UNIQUE INDEX ON daily_metrics_summary(project_id, metric_date, metric_type);

-- Event lineage summary
CREATE MATERIALIZED VIEW IF NOT EXISTS event_lineage_summary AS
SELECT
    e.id as event_id,
    e.organization_id,
    e.project_id,
    e.timestamp,
    ARRAY_LENGTH(e.parent_event_ids, 1) as parent_count,
    ARRAY_LENGTH(e.child_event_ids, 1) as child_count,
    COUNT(dlp.id) as lineage_paths_count
FROM events e
LEFT JOIN data_lineage_paths dlp ON e.id = dlp.source_event_id OR e.id = dlp.target_event_id
GROUP BY e.id, e.organization_id, e.project_id, e.timestamp, e.parent_event_ids, e.child_event_ids;

CREATE UNIQUE INDEX ON event_lineage_summary(event_id);
CREATE INDEX ON event_lineage_summary(organization_id, timestamp);

-- ============================================================================
-- REFRESH FUNCTIONS FOR MATERIALIZED VIEWS
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_metrics_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY event_lineage_summary;
END;
$$ LANGUAGE plpgsql;

-- Schedule periodic refresh (requires pg_cron extension)
-- SELECT cron.schedule('refresh-materialized-views', '0 * * * *', 'SELECT refresh_materialized_views();');