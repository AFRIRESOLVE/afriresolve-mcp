CREATE TABLE IF NOT EXISTS intelligence_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,
  timestamp TEXT NOT NULL,
  type TEXT NOT NULL,
  tool TEXT,
  query TEXT,
  success INTEGER,
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_intelligence_events_timestamp
  ON intelligence_events(timestamp);

CREATE INDEX IF NOT EXISTS idx_intelligence_events_type
  ON intelligence_events(type);

CREATE INDEX IF NOT EXISTS idx_intelligence_events_query
  ON intelligence_events(query);

CREATE INDEX IF NOT EXISTS idx_intelligence_events_tool
  ON intelligence_events(tool);
