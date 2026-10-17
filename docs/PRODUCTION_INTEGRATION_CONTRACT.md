# Chatbliz OS production readiness and integration contract

This repository is the existing Chatbliz OS. Never replace it with a new demo or mix it with Bonga Bhengu OS.

## Four connected workspaces
- My Brand: business identity intake, owner confirmation, evidence-backed public footprint scan, brand kit, SEO recommendations and approved assets.
- My Website & App: editable project files, build jobs, preview, validation, authorized publish, deployment URL and rollback.
- My Content Studio: assets, media jobs, playback, microphone/camera permissions, recordings, transcoding, scheduled publishing and platform receipts.
- My Business: contacts, pipeline, appointments, offers, invoicing, checkout, reports, reminders and human approvals.

## Task lifecycle
received -> validated -> awaiting_authorization (when needed) -> queued -> running -> succeeded | failed | cancelled.
Each task stores tenant_id, actor_id, workspace, action, inputs, outputs, provenance, timestamps, errors, retry count, audit events and provider receipt. Never mark success on a click alone.

## Agent orchestration
Chat intent -> policy/tenant permission -> workflow planner -> specialized employee -> tool adapter -> validated output -> workspace record -> chat response.
Roles include Mentor, Coach, Advisor, Assistant, Hunter, Closer, Negotiator, Branding, Builder, Studio, Finance, Legal Support and Technical Fixer. Roles are task routing, not autonomous access to accounts.

## Integration requirements
Secrets only on server; OAuth and least privilege; webhook signature checks; idempotency keys; queue for long jobs; per-tenant isolation; encryption, rate limiting and audit trail.
No unauthorized scraping, unsolicited messages, payments or publishing. Never store credentials in GitHub.

## Acceptance tests
1. Sign in and verify isolation between two users.
2. Chat request creates a persistent task with visible status.
3. Brand intake saves verified business profile and evidence.
4. Website project edits survive refresh, build preview works, publishing requires approval and returns deployment receipt.
5. Studio uploads and plays a real media file, shows processing errors and allows approved export.
6. CRM persists lead, stage transitions, quote and payment provider receipt.
7. Failures display actionable errors, not fabricated success.
8. All navigation and actions work on mobile; keyboard and accessibility checks pass.
9. Health endpoint, CI tests, security scans and deployment smoke test pass.
10. Domain chatbliz.online resolves to production deployment and HTTPS works.

## Implementation sequence
Inspect current code and tests; preserve working modules. Build auth and database migrations first, then persistent task engine and adapters, then four modules, then real integrations and end-to-end tests. Deploy only after tests and secret configuration. Document unconnected features clearly.
