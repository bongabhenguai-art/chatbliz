-- A task event must belong to the same business as its parent task.
-- The composite foreign key prevents cross-tenant event misattribution.
BEGIN;
ALTER TABLE business_tasks
  ADD CONSTRAINT business_tasks_id_business_unique UNIQUE (id, business_id);
ALTER TABLE task_events
  ADD CONSTRAINT task_events_task_business_fk
  FOREIGN KEY (task_id, business_id)
  REFERENCES business_tasks(id, business_id) ON DELETE CASCADE;
COMMIT;
