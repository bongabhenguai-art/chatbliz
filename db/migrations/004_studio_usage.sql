-- MiniMax Studio usage reservations, applied after 001 and 002.
-- A reservation records one attempted billable operation.
BEGIN;
CREATE TABLE IF NOT EXISTS studio_usage_reservations (
  id uuid PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES businesses(id),
  capability text NOT NULL,
  period_key text NOT NULL,
  request_key text NOT NULL,
  state text NOT NULL DEFAULT 'reserved' CHECK (state IN ('reserved','completed','released')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, capability, request_key)
);
CREATE INDEX IF NOT EXISTS studio_usage_period_idx
  ON studio_usage_reservations (business_id, capability, period_key, state);
ALTER TABLE studio_usage_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_usage_reservations FORCE ROW LEVEL SECURITY;
-- Customer sessions cannot read or write reservations directly.
-- Only a separately provisioned, narrowly scoped billing worker should manage them.
COMMIT;
