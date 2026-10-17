# PostgreSQL migration foundation

`db/migrations/001_foundation.sql` is a **review-only** initial schema. It has not been applied to any database.

Tables: businesses, app_users, business_memberships, business_tasks and task_events. Business-scoped idempotency keys prevent duplicate task rows.

Security: all tables have RLS enabled and forced **without policies**, so ordinary application roles cannot access rows until carefully reviewed tenant-scoped policies are installed. Do not grant application credentials owner, superuser or BYPASSRLS privileges. Do not deploy customer endpoints against these tables yet.

Required next steps:
1. Choose a PostgreSQL host and provision a separate migration role and least-privilege application role.
2. Implement verified OIDC authentication and session handling; resolve business membership server-side.
3. Define RLS policies with a transaction-local authenticated user/business context and membership checks. Test attempts to cross tenant boundaries, including pooled connections.
4. Implement a transactional PostgreSQL task repository with task-event writes in the same transaction and safe concurrency controls.
5. Run migrations in staging, integration tests and rollback/restore exercises.
6. Connect the existing chat only after authentication and database authorization pass.

The existing local file store remains development-only. No live database credentials or hosted database are configured by this commit.
