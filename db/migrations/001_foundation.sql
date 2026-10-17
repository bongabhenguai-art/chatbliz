-- Chatbliz OS foundational PostgreSQL schema.
-- Apply through a reviewed migration process; this file is not auto-executed.
BEGIN;
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY,
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 200),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY,
  identity_provider text NOT NULL,
  provider_subject text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(identity_provider, provider_subject)
);
CREATE TABLE IF NOT EXISTS business_memberships (
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','admin','member','viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (business_id, user_id)
);
CREATE TABLE IF NOT EXISTS business_tasks (
  id uuid PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  request text NOT NULL CHECK (length(trim(request)) BETWEEN 1 AND 4000),
  employee text NOT NULL DEFAULT 'executive',
  workspace text NOT NULL DEFAULT 'business',
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','waiting_approval','completed','failed','blocked','cancelled')),
  idempotency_key text,
  output jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS business_tasks_business_created_idx
  ON business_tasks (business_id, created_at DESC);
CREATE TABLE IF NOT EXISTS task_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES business_tasks(id) ON DELETE CASCADE,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS task_events_task_idx ON task_events(task_id, id);
-- Row security is a defense-in-depth measure, not a replacement for server-side authorization.
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_events ENABLE ROW LEVEL SECURITY;
-- FORCE prevents table owners from bypassing RLS; privileged migration roles
-- may still bypass it and must never be used for customer requests.
ALTER TABLE businesses FORCE ROW LEVEL SECURITY;
ALTER TABLE app_users FORCE ROW LEVEL SECURITY;
ALTER TABLE business_memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE business_tasks FORCE ROW LEVEL SECURITY;
ALTER TABLE task_events FORCE ROW LEVEL SECURITY;
COMMIT;
