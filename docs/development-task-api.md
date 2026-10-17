# Development task API

This API is a protected engineering milestone, **not customer authentication**.
It is disabled until both environment variables are configured:

- `CHATBLIZ_DEV_TASK_TOKEN`: random secret, at least 32 characters; backend-only.
- `CHATBLIZ_DEV_BUSINESS_ID`: fixed development business ID.

Optional `CHATBLIZ_TASK_FILE` specifies local task JSON storage. Default: `.data/tasks.json`.
Do not deploy the file-backed store as a multi-instance production database.

With a locally configured token, send `Authorization: Bearer <token>`:

- `POST /api/dev/tasks` JSON `{"request":"Review my business"}`
- `GET /api/dev/tasks`
- `GET /api/dev/tasks/<task-id>`

The browser frontend is deliberately not connected because embedding the development token in browser JavaScript would expose it. A verified login/session, membership resolution, database persistence, rate limits, and an AI executor must precede customer-facing endpoints. Creating a task only queues it; it does not run AI work.
