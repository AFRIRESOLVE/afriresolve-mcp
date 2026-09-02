CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id TEXT NOT NULL UNIQUE,
  api_key_hash TEXT UNIQUE,
  name TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  plan TEXT NOT NULL DEFAULT 'free',
  credits INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customers_api_key_hash
  ON customers(api_key_hash);

CREATE INDEX IF NOT EXISTS idx_customers_status
  ON customers(status);

CREATE TABLE IF NOT EXISTS usage_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usage_id TEXT NOT NULL UNIQUE,
  customer_id TEXT,
  tool TEXT NOT NULL,
  units INTEGER NOT NULL DEFAULT 1,
  billable INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'recorded',
  metadata TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usage_customer
  ON usage_ledger(customer_id);

CREATE INDEX IF NOT EXISTS idx_usage_tool
  ON usage_ledger(tool);

CREATE INDEX IF NOT EXISTS idx_usage_created
  ON usage_ledger(created_at);
