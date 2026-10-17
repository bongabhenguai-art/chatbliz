# PostgreSQL task repository

`src/postgres-task-repository.mjs` implements `create`, `get` and `list` with parameterized SQL, transaction-local identity context, bounded queries and idempotent creation.

It accepts an injected `pool` (with `connect()`, `query()`, `release()`) and **does not** create a network connection itself. A trusted authenticated server must verify the user and selected business membership before calling it. Never pass userId or businessId directly from browser input.

The PostgreSQL role must be non-owner, non-superuser and without BYPASSRLS. Apply migrations 001 and 002 and grant only the intended table privileges. The module does not write task events or perform status transitions; these require a separate worker design and transactional event updates.

Unit tests use an injected fake pool to verify transaction handling. PostgreSQL RLS tests run in CI separately. No hosted database, driver dependency, customer authentication or production endpoint is configured by this commit.
