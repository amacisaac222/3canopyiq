-- ============================================================================
-- CRITICAL LINEAGE FUNCTIONS FOR CANOPYIQ
-- ============================================================================

-- ============================================================================
-- TRACE_LINEAGE: Recursively find all related events
-- ============================================================================
CREATE OR REPLACE FUNCTION trace_lineage(
    p_id TEXT,
    p_direction TEXT DEFAULT 'both', -- 'ancestors', 'descendants', 'both'
    p_max_depth INTEGER DEFAULT 10
)
RETURNS TABLE (
    event_id TEXT,
    depth INTEGER,
    path TEXT[],
    relationship TEXT,
    confidence DECIMAL
) AS $$
WITH RECURSIVE lineage_tree AS (
    -- Base case: start with the given event
    SELECT
        id AS event_id,
        0 AS depth,
        ARRAY[id] AS path,
        'self' AS relationship,
        1.00 AS confidence
    FROM events
    WHERE id = p_id

    UNION ALL

    -- Recursive case: find ancestors
    SELECT DISTINCT
        e.id,
        lt.depth + 1,
        lt.path || e.id,
        'ancestor' AS relationship,
        lt.confidence * 0.95 -- Slightly reduce confidence with each level
    FROM lineage_tree lt
    CROSS JOIN LATERAL unnest(
        CASE
            WHEN lt.relationship IN ('self', 'ancestor') AND p_direction IN ('ancestors', 'both')
            THEN (SELECT parent_event_ids FROM events WHERE id = lt.event_id)
            ELSE NULL::TEXT[]
        END
    ) AS parent_id
    JOIN events e ON e.id = parent_id
    WHERE lt.depth < p_max_depth
        AND NOT e.id = ANY(lt.path) -- Prevent cycles

    UNION ALL

    -- Recursive case: find descendants
    SELECT DISTINCT
        e.id,
        lt.depth + 1,
        lt.path || e.id,
        'descendant' AS relationship,
        lt.confidence * 0.95
    FROM lineage_tree lt
    CROSS JOIN LATERAL unnest(
        CASE
            WHEN lt.relationship IN ('self', 'descendant') AND p_direction IN ('descendants', 'both')
            THEN (SELECT child_event_ids FROM events WHERE id = lt.event_id)
            ELSE NULL::TEXT[]
        END
    ) AS child_id
    JOIN events e ON e.id = child_id
    WHERE lt.depth < p_max_depth
        AND NOT e.id = ANY(lt.path) -- Prevent cycles
)
SELECT DISTINCT ON (event_id)
    event_id,
    depth,
    path,
    relationship,
    confidence
FROM lineage_tree
ORDER BY event_id, depth;
$$ LANGUAGE sql;

-- ============================================================================
-- CALCULATE_CONFIDENCE: Compute trust score for a metric
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_confidence(p_metric_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    v_confidence DECIMAL;
    v_event_confidence DECIMAL;
    v_quality_score DECIMAL;
    v_parent_confidence DECIMAL;
    v_age_factor DECIMAL;
    v_metric_record RECORD;
BEGIN
    -- Get the metric details
    SELECT * INTO v_metric_record
    FROM metrics
    WHERE id = p_metric_id;

    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    -- Start with base confidence from the metric
    v_confidence := COALESCE(v_metric_record.confidence, 1.0);

    -- Factor 1: Event confidence
    SELECT COALESCE(AVG(e.confidence), 1.0) INTO v_event_confidence
    FROM events e
    WHERE e.id = ANY(v_metric_record.source_event_ids);

    -- Factor 2: Data quality checks
    SELECT
        CASE
            WHEN COUNT(*) = 0 THEN 0.8  -- No quality checks means lower confidence
            ELSE AVG(CASE WHEN passed THEN 1.0 ELSE 0.5 END)
        END INTO v_quality_score
    FROM data_quality_checks dq
    WHERE dq.event_id = v_metric_record.event_id;

    -- Factor 3: Parent metrics confidence
    IF v_metric_record.parent_metric_ids IS NOT NULL AND ARRAY_LENGTH(v_metric_record.parent_metric_ids, 1) > 0 THEN
        SELECT AVG(COALESCE(confidence, 0.8)) INTO v_parent_confidence
        FROM metrics
        WHERE id = ANY(v_metric_record.parent_metric_ids);
    ELSE
        v_parent_confidence := 1.0;
    END IF;

    -- Factor 4: Age decay (reduce confidence for older metrics)
    v_age_factor := GREATEST(
        0.5,
        1.0 - (EXTRACT(EPOCH FROM (NOW() - v_metric_record.calculated_at)) / (86400 * 30))::DECIMAL * 0.2
    );

    -- Combine all factors (weighted average)
    v_confidence := (
        v_confidence * 0.3 +
        v_event_confidence * 0.25 +
        v_quality_score * 0.25 +
        v_parent_confidence * 0.15 +
        v_age_factor * 0.05
    );

    -- Ensure confidence is between 0 and 1
    RETURN LEAST(1.0, GREATEST(0.0, v_confidence));
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFY_LINEAGE_INTEGRITY: Ensure no broken chains in lineage
-- ============================================================================
CREATE OR REPLACE FUNCTION verify_lineage_integrity()
RETURNS TABLE (
    issue_type TEXT,
    entity_type TEXT,
    entity_id TEXT,
    description TEXT,
    severity TEXT
) AS $$
BEGIN
    -- Check for orphaned events (events with parent_ids that don't exist)
    RETURN QUERY
    SELECT
        'orphaned_parent'::TEXT AS issue_type,
        'event'::TEXT AS entity_type,
        e.id AS entity_id,
        FORMAT('Event %s references non-existent parent %s', e.id, pid) AS description,
        'high'::TEXT AS severity
    FROM events e
    CROSS JOIN LATERAL unnest(e.parent_event_ids) AS pid
    WHERE NOT EXISTS (SELECT 1 FROM events WHERE id = pid);

    -- Check for orphaned children (events with child_ids that don't exist)
    RETURN QUERY
    SELECT
        'orphaned_child'::TEXT,
        'event'::TEXT,
        e.id,
        FORMAT('Event %s references non-existent child %s', e.id, cid),
        'high'::TEXT
    FROM events e
    CROSS JOIN LATERAL unnest(e.child_event_ids) AS cid
    WHERE NOT EXISTS (SELECT 1 FROM events WHERE id = cid);

    -- Check for circular dependencies in events
    RETURN QUERY
    WITH RECURSIVE cycle_check AS (
        SELECT
            id,
            ARRAY[id] AS path,
            false AS has_cycle
        FROM events

        UNION ALL

        SELECT
            e.id,
            cc.path || e.id,
            e.id = ANY(cc.path) AS has_cycle
        FROM cycle_check cc
        CROSS JOIN LATERAL unnest(
            (SELECT parent_event_ids FROM events WHERE id = cc.id)
        ) AS parent_id
        JOIN events e ON e.id = parent_id
        WHERE NOT cc.has_cycle
            AND ARRAY_LENGTH(cc.path, 1) < 20
    )
    SELECT DISTINCT
        'circular_dependency'::TEXT,
        'event'::TEXT,
        id,
        FORMAT('Event %s is part of a circular dependency', id),
        'critical'::TEXT
    FROM cycle_check
    WHERE has_cycle;

    -- Check for metrics with invalid event references
    RETURN QUERY
    SELECT
        'invalid_event_reference'::TEXT,
        'metric'::TEXT,
        m.id::TEXT,
        FORMAT('Metric %s references non-existent event %s', m.id, m.event_id),
        'high'::TEXT
    FROM metrics m
    WHERE NOT EXISTS (SELECT 1 FROM events WHERE id = m.event_id);

    -- Check for metrics with invalid source events
    RETURN QUERY
    SELECT
        'invalid_source_event'::TEXT,
        'metric'::TEXT,
        m.id::TEXT,
        FORMAT('Metric %s references non-existent source event %s', m.id, sid),
        'medium'::TEXT
    FROM metrics m
    CROSS JOIN LATERAL unnest(m.source_event_ids) AS sid
    WHERE NOT EXISTS (SELECT 1 FROM events WHERE id = sid);

    -- Check for broken lineage paths
    RETURN QUERY
    SELECT
        'broken_lineage_path'::TEXT,
        'lineage_path'::TEXT,
        dlp.id::TEXT,
        FORMAT('Lineage path %s has invalid source or target', dlp.id),
        'high'::TEXT
    FROM data_lineage_paths dlp
    WHERE NOT EXISTS (SELECT 1 FROM events WHERE id = dlp.source_event_id)
        OR NOT EXISTS (SELECT 1 FROM events WHERE id = dlp.target_event_id);

    -- Check for inconsistent parent-child relationships
    RETURN QUERY
    SELECT
        'inconsistent_relationship'::TEXT,
        'event'::TEXT,
        e1.id,
        FORMAT('Event %s lists %s as child, but child does not list it as parent', e1.id, e2.id),
        'medium'::TEXT
    FROM events e1
    CROSS JOIN LATERAL unnest(e1.child_event_ids) AS child_id
    JOIN events e2 ON e2.id = child_id
    WHERE NOT e1.id = ANY(e2.parent_event_ids);

    -- Check for metrics with broken dependencies
    RETURN QUERY
    SELECT
        'broken_metric_dependency'::TEXT,
        'metric'::TEXT,
        m.id::TEXT,
        FORMAT('Metric %s depends on non-existent metric %s', m.id, dep_id),
        'high'::TEXT
    FROM metrics m
    CROSS JOIN LATERAL unnest(m.parent_metric_ids) AS dep_id
    WHERE NOT EXISTS (SELECT 1 FROM metrics WHERE id = dep_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GET_LINEAGE_TREE: Get complete lineage tree for visualization
-- ============================================================================
CREATE OR REPLACE FUNCTION get_lineage_tree(p_event_id TEXT)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    WITH lineage_data AS (
        SELECT * FROM trace_lineage(p_event_id, 'both', 10)
    ),
    event_details AS (
        SELECT
            ld.event_id,
            ld.depth,
            ld.path,
            ld.relationship,
            ld.confidence,
            e.timestamp,
            e.category,
            e.action,
            e.label,
            e.source_type,
            e.confidence as event_confidence
        FROM lineage_data ld
        JOIN events e ON e.id = ld.event_id
    )
    SELECT jsonb_build_object(
        'root_event_id', p_event_id,
        'total_events', COUNT(*),
        'max_depth', MAX(depth),
        'avg_confidence', AVG(confidence),
        'events', jsonb_agg(
            jsonb_build_object(
                'id', event_id,
                'depth', depth,
                'relationship', relationship,
                'confidence', confidence,
                'timestamp', timestamp,
                'category', category,
                'action', action,
                'label', label,
                'source_type', source_type
            ) ORDER BY depth, timestamp
        )
    ) INTO v_result
    FROM event_details;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CALCULATE_FOREST_CANOPY: Generate forest canopy metrics
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_forest_canopy(p_project_id UUID)
RETURNS UUID AS $$
DECLARE
    v_canopy_id UUID;
    v_health_score INTEGER;
    v_growth_rate DECIMAL;
    v_complexity DECIMAL;
    v_coverage DECIMAL;
    v_branches JSONB;
    v_root_health JSONB;
BEGIN
    -- Calculate health score based on recent metrics
    SELECT
        COALESCE(AVG(
            CASE
                WHEN metric_type = 'quality' THEN CAST(value AS FLOAT) * 0.3
                WHEN metric_type = 'coverage' THEN CAST(value AS FLOAT) * 0.3
                WHEN metric_type = 'performance' THEN CAST(value AS FLOAT) * 0.2
                WHEN metric_type = 'security' THEN CAST(value AS FLOAT) * 0.2
                ELSE 0
            END
        ), 50) INTO v_health_score
    FROM metrics
    WHERE project_id = p_project_id
        AND is_latest = true
        AND timestamp > NOW() - INTERVAL '7 days';

    -- Calculate growth rate
    WITH growth_data AS (
        SELECT
            DATE(timestamp) as day,
            COUNT(*) as events_count
        FROM events
        WHERE project_id = p_project_id
            AND timestamp > NOW() - INTERVAL '30 days'
        GROUP BY DATE(timestamp)
    )
    SELECT
        COALESCE(
            (SELECT events_count FROM growth_data WHERE day = CURRENT_DATE) /
            NULLIF((SELECT AVG(events_count) FROM growth_data WHERE day < CURRENT_DATE), 0),
            1.0
        ) INTO v_growth_rate;

    -- Insert new forest canopy record
    INSERT INTO forest_canopy (
        project_id,
        health_score,
        growth_rate,
        complexity_index,
        coverage_percent,
        branches,
        root_health,
        source_metric_ids,
        calculation_pipeline
    ) VALUES (
        p_project_id,
        v_health_score,
        v_growth_rate,
        COALESCE(v_complexity, 50),
        COALESCE(v_coverage, 0),
        '[]'::JSONB,
        '{}'::JSONB,
        ARRAY(SELECT id FROM metrics WHERE project_id = p_project_id AND is_latest = true LIMIT 100),
        '[]'::JSONB
    ) RETURNING id INTO v_canopy_id;

    RETURN v_canopy_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRACK_CLAUDE_SESSION: Record a Claude session with full lineage
-- ============================================================================
CREATE OR REPLACE FUNCTION track_claude_session(
    p_session_id TEXT,
    p_user_id TEXT,
    p_task_description TEXT,
    p_organization_id UUID,
    p_project_id UUID
) RETURNS TEXT AS $$
BEGIN
    INSERT INTO claude_sessions (
        session_id,
        start_time,
        user_id,
        task_description,
        organization_id,
        project_id,
        event_ids
    ) VALUES (
        p_session_id,
        NOW(),
        p_user_id,
        p_task_description,
        p_organization_id,
        p_project_id,
        ARRAY[]::TEXT[]
    ) ON CONFLICT (session_id) DO UPDATE SET
        task_description = EXCLUDED.task_description,
        updated_at = NOW();

    RETURN p_session_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE_GROWTH_RING: Create daily snapshot (growth ring)
-- ============================================================================
CREATE OR REPLACE FUNCTION create_growth_ring(p_project_id UUID, p_ring_date DATE DEFAULT CURRENT_DATE)
RETURNS UUID AS $$
DECLARE
    v_ring_id UUID;
    v_ring_number INTEGER;
    v_event_count INTEGER;
    v_first_event TEXT;
    v_last_event TEXT;
    v_day_snapshot JSONB;
BEGIN
    -- Get ring number
    SELECT COALESCE(MAX(ring_number), 0) + 1 INTO v_ring_number
    FROM growth_rings
    WHERE project_id = p_project_id;

    -- Count events for the day
    SELECT
        COUNT(*),
        MIN(id),
        MAX(id)
    INTO v_event_count, v_first_event, v_last_event
    FROM events
    WHERE project_id = p_project_id
        AND DATE(timestamp) = p_ring_date;

    -- Build day snapshot
    SELECT jsonb_build_object(
        'linesOfCode', 0, -- Would be calculated from actual code analysis
        'fileCount', COUNT(DISTINCT label),
        'commits', COUNT(*) FILTER (WHERE category = 'code_change'),
        'complexity', AVG(CAST(value->>'complexity' AS FLOAT)),
        'activeContributors', COUNT(DISTINCT user_id)
    ) INTO v_day_snapshot
    FROM events
    WHERE project_id = p_project_id
        AND DATE(timestamp) = p_ring_date;

    -- Insert growth ring
    INSERT INTO growth_rings (
        project_id,
        ring_date,
        ring_number,
        day_snapshot,
        growth_delta,
        event_count,
        event_id_range
    ) VALUES (
        p_project_id,
        p_ring_date,
        v_ring_number,
        COALESCE(v_day_snapshot, '{}'::JSONB),
        '{}'::JSONB,
        COALESCE(v_event_count, 0),
        ARRAY[v_first_event, v_last_event]
    ) RETURNING id INTO v_ring_id;

    RETURN v_ring_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get metric dependency graph
CREATE OR REPLACE FUNCTION get_metric_dependencies(p_metric_id UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        WITH RECURSIVE deps AS (
            SELECT
                id,
                name,
                display_name,
                parent_metric_ids,
                0 as level
            FROM metrics
            WHERE id = p_metric_id

            UNION ALL

            SELECT
                m.id,
                m.name,
                m.display_name,
                m.parent_metric_ids,
                d.level + 1
            FROM deps d
            CROSS JOIN LATERAL unnest(d.parent_metric_ids) AS parent_id
            JOIN metrics m ON m.id = parent_id
            WHERE d.level < 5
        )
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', id,
                'name', name,
                'display_name', display_name,
                'level', level
            ) ORDER BY level, name
        )
        FROM deps
    );
END;
$$ LANGUAGE plpgsql;

-- Calculate impact radius of an event
CREATE OR REPLACE FUNCTION calculate_impact_radius(p_event_id TEXT)
RETURNS JSONB AS $$
DECLARE
    v_descendants_count INTEGER;
    v_metrics_affected INTEGER;
    v_insights_affected INTEGER;
BEGIN
    -- Count descendants
    SELECT COUNT(*) INTO v_descendants_count
    FROM trace_lineage(p_event_id, 'descendants', 20)
    WHERE relationship = 'descendant';

    -- Count affected metrics
    SELECT COUNT(DISTINCT m.id) INTO v_metrics_affected
    FROM metrics m
    WHERE p_event_id = ANY(m.source_event_ids);

    -- Count affected insights
    SELECT COUNT(*) INTO v_insights_affected
    FROM insights i
    JOIN metrics m ON m.id = ANY(i.source_metric_ids)
    WHERE p_event_id = ANY(m.source_event_ids);

    RETURN jsonb_build_object(
        'event_id', p_event_id,
        'descendants', v_descendants_count,
        'metrics_affected', v_metrics_affected,
        'insights_affected', v_insights_affected,
        'total_impact', v_descendants_count + v_metrics_affected + v_insights_affected,
        'severity', CASE
            WHEN v_descendants_count + v_metrics_affected + v_insights_affected > 100 THEN 'critical'
            WHEN v_descendants_count + v_metrics_affected + v_insights_affected > 50 THEN 'high'
            WHEN v_descendants_count + v_metrics_affected + v_insights_affected > 10 THEN 'medium'
            ELSE 'low'
        END
    );
END;
$$ LANGUAGE plpgsql;