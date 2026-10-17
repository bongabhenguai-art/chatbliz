-- PostgreSQL tenant isolation smoke test.
-- Run only against a disposable database after migrations 001 and 002.
-- Test roles are intentionally provisioned with no BYPASSRLS.
BEGIN;
CREATE ROLE chatbliz_test_app NOLOGIN NOSUPERUSER NOBYPASSRLS;
GRANT USAGE ON SCHEMA public TO chatbliz_test_app;
GRANT SELECT ON businesses, app_users, business_memberships, business_tasks, task_events TO chatbliz_test_app;
GRANT INSERT ON business_tasks TO chatbliz_test_app;
INSERT INTO businesses (id, name) VALUES
  ('11111111-1111-4111-8111-111111111111','Business A'),
  ('22222222-2222-4222-8222-222222222222','Business B');
INSERT INTO app_users (id, identity_provider, provider_subject) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','test','alice'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','test','bob');
INSERT INTO business_memberships (business_id, user_id, role) VALUES
  ('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','owner'),
  ('22222222-2222-4222-8222-222222222222','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','viewer');
INSERT INTO business_tasks (id, business_id, request) VALUES
  ('11111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','Task A'),
  ('22222222-2222-4222-8222-222222222223','22222222-2222-4222-8222-222222222222','Task B');
SET LOCAL ROLE chatbliz_test_app;
SELECT set_config('app.user_id','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
SELECT set_config('app.business_id','11111111-1111-4111-8111-111111111111',true);
DO $$
BEGIN
  IF (SELECT count(*) FROM business_tasks) <> 1 THEN
    RAISE EXCEPTION 'Alice must see exactly one business task';
  END IF;
  IF (SELECT request FROM business_tasks LIMIT 1) <> 'Task A' THEN
    RAISE EXCEPTION 'Alice saw another business task';
  END IF;
END $$;
-- Switch selected business without changing user identity.
SELECT set_config('app.business_id','22222222-2222-4222-8222-222222222222',true);
DO $$
BEGIN
  IF (SELECT count(*) FROM business_tasks) <> 0 THEN
    RAISE EXCEPTION 'Cross-business read was allowed';
  END IF;
END $$;
-- A viewer may read only their own business tasks and may not create tasks.
SELECT set_config('app.user_id','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
SELECT set_config('app.business_id','22222222-2222-4222-8222-222222222222',true);
DO $
DECLARE blocked boolean := false;
BEGIN
  IF (SELECT count(*) FROM business_tasks) <> 1 THEN
    RAISE EXCEPTION 'Viewer should read exactly one own-business task';
  END IF;
  BEGIN
    INSERT INTO business_tasks(id,business_id,request)
    VALUES ('33333333-3333-4333-8333-333333333333',
            '22222222-2222-4222-8222-222222222222',
            'Viewer must not create this');
  EXCEPTION WHEN insufficient_privilege THEN
    blocked := true;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'Viewer was able to insert a task';
  END IF;
END $;
-- No authenticated identity must reveal no task records.
SELECT set_config('app.user_id','',true);
SELECT set_config('app.business_id','',true);
DO $
BEGIN
  IF (SELECT count(*) FROM business_tasks) <> 0 THEN
    RAISE EXCEPTION 'Unauthenticated context exposed tasks';
  END IF;
END $;
RESET ROLE;
ROLLBACK;
