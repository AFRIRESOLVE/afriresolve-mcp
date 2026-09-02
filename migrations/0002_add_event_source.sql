ALTER TABLE intelligence_events
ADD COLUMN source TEXT NOT NULL DEFAULT 'unknown';

CREATE INDEX IF NOT EXISTS idx_intelligence_events_source
  ON intelligence_events(source);
