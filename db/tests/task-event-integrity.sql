-- Verify event ownership integrity in a disposable database.
BEGIN;
INSERT INTO businesses(id,name) VALUES
 ('11111111-1111-4111-8111-111111111111','Tenant One'),
 ('22222222-2222-4222-8222-222222222222','Tenant Two');
INSERT INTO business_tasks(id,business_id,request) VALUES
 ('11111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','Test task');
INSERT INTO task_events(business_id,task_id,status) VALUES
 ('11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111112','queued');
DO $check$
DECLARE blocked boolean := false;
BEGIN
  BEGIN
    INSERT INTO task_events(business_id,task_id,status) VALUES
     ('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111112','queued');
  EXCEPTION WHEN foreign_key_violation THEN
    blocked := true;
  END;
  IF NOT blocked THEN RAISE EXCEPTION 'Cross-business event was accepted'; END IF;
  IF (SELECT count(*) FROM task_events) <> 1 THEN RAISE EXCEPTION 'Unexpected event count'; END IF;
END $check$;
ROLLBACK;
