CREATE TABLE IF NOT EXISTS workflow_runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'awaiting_approval', 'approved', 'rejected', 'expired', 'failed')),
  plan_json TEXT,
  decision_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS workflow_runs_user_created_idx ON workflow_runs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS workflow_runs_task_created_idx ON workflow_runs(task_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS workflow_runs_one_pending_per_task_idx
  ON workflow_runs(task_id) WHERE status IN ('queued', 'awaiting_approval');
