-- Chatbliz OS application access policies (PostgreSQL).
-- Requires 001_foundation.sql. Apply only after reviewed role provisioning.
-- A verified backend session must set app.user_id and app.business_id
-- using SET LOCAL inside every transaction. Never accept either from the browser.
BEGIN;
CREATE OR REPLACE FUNCTION chatbliz_current_user_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.user_id', true), '')::uuid
$$;
CREATE OR REPLACE FUNCTION chatbliz_current_business_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.business_id', true), '')::uuid
$$;
-- SECURITY DEFINER intentionally omitted: policies must not bypass RLS.
CREATE POLICY users_self_read ON app_users FOR SELECT
USING (id = chatbliz_current_user_id());
CREATE POLICY memberships_self_read ON business_memberships FOR SELECT
USING (user_id = chatbliz_current_user_id());
CREATE POLICY businesses_member_read ON businesses FOR SELECT
USING (
  id = chatbliz_current_business_id()
  AND EXISTS (
    SELECT 1 FROM business_memberships m
    WHERE m.business_id = businesses.id AND m.user_id = chatbliz_current_user_id()
  )
);
CREATE POLICY tasks_member_read ON business_tasks FOR SELECT
USING (
  business_id = chatbliz_current_business_id()
  AND EXISTS (
    SELECT 1 FROM business_memberships m
    WHERE m.business_id = business_tasks.business_id
      AND m.user_id = chatbliz_current_user_id()
      AND m.role IN ('owner','admin','member','viewer')
  )
);
CREATE POLICY tasks_member_insert ON business_tasks FOR INSERT
WITH CHECK (
  business_id = chatbliz_current_business_id()
  AND EXISTS (
    SELECT 1 FROM business_memberships m
    WHERE m.business_id = business_tasks.business_id
      AND m.user_id = chatbliz_current_user_id()
      AND m.role IN ('owner','admin','member')
  )
);
CREATE POLICY events_member_read ON task_events FOR SELECT
USING (
  business_id = chatbliz_current_business_id()
  AND EXISTS (
    SELECT 1 FROM business_memberships m
    WHERE m.business_id = task_events.business_id
      AND m.user_id = chatbliz_current_user_id()
  )
);
-- Updates, deletes and event inserts remain denied to the customer app role.
-- A separate narrowly scoped worker role/process must be designed and tested.
COMMIT;
