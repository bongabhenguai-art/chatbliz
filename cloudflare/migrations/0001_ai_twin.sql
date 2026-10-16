-- Chatbliz AI Twin D1 schema. Apply via reviewed migration, not automatically on production.
CREATE TABLE IF NOT EXISTS twin_tasks (
 id TEXT PRIMARY KEY,
 tenant_id TEXT NOT NULL,
 workspace TEXT NOT NULL,
 action TEXT NOT NULL,
 description TEXT NOT NULL,
 status TEXT NOT NULL,
 policy TEXT NOT NULL,
 tests_passed INTEGER NOT NULL DEFAULT 0,
 reviewed INTEGER NOT NULL DEFAULT 0,
 approved_by TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS twin_tasks_tenant_status ON twin_tasks(tenant_id,status,created_at);
CREATE TABLE IF NOT EXISTS twin_events (
 id TEXT PRIMARY KEY,
 tenant_id TEXT NOT NULL,
 task_id TEXT,
 event_type TEXT NOT NULL,
 summary TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(task_id) REFERENCES twin_tasks(id)
);
CREATE INDEX IF NOT EXISTS twin_events_tenant_time ON twin_events(tenant_id,created_at);
CREATE TABLE IF NOT EXISTS twin_preferences (
 tenant_id TEXT NOT NULL,
 preference_key TEXT NOT NULL,
 preference_value TEXT NOT NULL,
 owner_approved_at TEXT NOT NULL,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(tenant_id,preference_key)
);
