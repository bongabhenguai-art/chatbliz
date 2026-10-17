# Chatbliz OS — Production implementation gates

This is an upgrade of the existing `main` application, not a new app. Never claim external actions without verified receipts.

## Four integrated workspaces
1. My Brand: owner-confirmed digital footprint discovery, evidence links, identity assets, brand kit, marketing approvals.
2. My Website & App: editable site/storefront, preview, publish pipeline, SEO, domain verification and rollback.
3. My Studio: upload, recording, image/video processing, media storage, live streaming via authorized RTMP provider, review and publish.
4. My Business: customer CRM, lead stages, invoices, payment provider webhooks, scheduling, reporting, AI employees and task history.

## Shared execution backbone
- Server-side authenticated multi-tenant accounts, RBAC, audit trail, encrypted provider tokens, rate limiting and input validation.
- Durable database tables for organizations, users, projects, assets, conversations, agents, tasks, approvals, integrations, leads, orders, payments and events.
- Task lifecycle: draft -> approval_required -> queued -> running -> succeeded/failed. Idempotency keys, retries and receipts.
- AI router: Mentor, Coach, Adviser, Assistant, Negotiator, Sales, Marketing, Legal Support, Builder, Studio and Technical Fixer. No unsupported legal/financial guarantees.
- Connection wizard for GitHub, deployment, WhatsApp Meta Cloud API, Google, payment gateways and social channels; least-privilege OAuth.
- Cross-workspace event flow: discovery -> brand plan -> website/store -> studio assets -> approved campaigns -> leads -> sales -> metrics.

## Release gates
1. Preserve and test existing frontend, server, reports and publishing modules.
2. Add persistent storage and authenticated API; migrate local-only data carefully.
3. Wire chat and task orchestration to real providers with explicit approval and receipts.
4. Implement each workspace end-to-end and verify real outputs.
5. Add automated unit, integration, security and browser/mobile smoke tests.
6. Deploy via supported production host, connect chatbliz.online, check HTTPS, `/healthz`, and each live user journey.

## Truthful status
The current repository README describes a dependency-free planning app, not a fully connected production platform. This roadmap is an implementation specification, not proof that these features are built or deployed.

Never commit API keys, passwords, payment secrets or WhatsApp tokens. Store them in encrypted host secrets.