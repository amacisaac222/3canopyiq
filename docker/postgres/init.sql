-- CanopyIQ Database Initialization Script

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create schema
CREATE SCHEMA IF NOT EXISTS canopyiq;

-- Set search path
SET search_path TO canopyiq, public;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA canopyiq TO canopyiq;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA canopyiq TO canopyiq;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA canopyiq TO canopyiq;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_metrics_project_timestamp ON canopyiq.metrics(project_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_type_timestamp ON canopyiq.events(type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_project_timestamp ON canopyiq.events(project_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON canopyiq.sessions(token);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON canopyiq.api_keys(key);

-- Insert sample data
INSERT INTO canopyiq.teams (id, name, description, metadata)
VALUES
  (uuid_generate_v4(), 'Core Development', 'Main development team', '{"slack_channel": "#dev-core"}'),
  (uuid_generate_v4(), 'Platform Engineering', 'Infrastructure and platform team', '{"slack_channel": "#platform"}')
ON CONFLICT DO NOTHING;

-- Create materialized views for performance
CREATE MATERIALIZED VIEW IF NOT EXISTS canopyiq.project_metrics_summary AS
SELECT
  p.id,
  p.name,
  COUNT(DISTINCT m.id) as metric_count,
  COUNT(DISTINCT e.id) as event_count,
  MAX(m.timestamp) as last_metric,
  MAX(e.timestamp) as last_event
FROM canopyiq.projects p
LEFT JOIN canopyiq.metrics m ON p.id = m.project_id
LEFT JOIN canopyiq.events e ON p.id = e.project_id
GROUP BY p.id, p.name;

-- Create refresh function for materialized view
CREATE OR REPLACE FUNCTION canopyiq.refresh_project_metrics_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY canopyiq.project_metrics_summary;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON SCHEMA canopyiq IS 'CanopyIQ application schema';
COMMENT ON TABLE canopyiq.projects IS 'Software projects tracked by CanopyIQ';
COMMENT ON TABLE canopyiq.metrics IS 'Performance and quality metrics for projects';
COMMENT ON TABLE canopyiq.events IS 'Development events and activities';
COMMENT ON TABLE canopyiq.teams IS 'Development teams';
COMMENT ON TABLE canopyiq.users IS 'Application users';

-- Print confirmation
DO $$
BEGIN
  RAISE NOTICE 'CanopyIQ database initialization completed successfully';
END
$$;