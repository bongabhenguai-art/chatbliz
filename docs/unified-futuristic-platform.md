# Chatbliz OS — Unified Futuristic Business Platform

## Product contract

Preserve the existing homepage, homepage video, studio, chat-first interface, and four workspaces. Extend components; do not replace the application with an unrelated template. The video is a real, accessible media component, not a fake animation. Verify its existing file/URL before wiring playback; do not invent a media URL.

## Customer journey

1. **Homepage** — plays an authorized brand video with visible play/pause, mute, captions where available, reduced-motion consideration, and mobile-friendly loading. Primary CTA starts Chatbliz conversation.
2. **Conversation & forms** — AI asks for business name, industry, goals, target customers, existing website and consent for external account access. Persist only with customer permission. Progressive forms must work without AI.
3. **My Brand** — business identity, brand strategy, visual brief, approved assets.
4. **My Website & App** — form or conversation creates a structured project brief; AI generates source in an isolated project branch; user edits and previews; tests run before deploy. No automatic production deployment.
5. **My Studio** — customer creates video, podcast, product photography and livestream assets with explicit camera/microphone permissions; human reviews generated media before publication. Integrate MiniMax only where supported by a verified model/API capability.
6. **My Business** — operations dashboard, advisor, CRM, marketing, sales, tasks, financial reports and monitored KPIs.

## AI + technical + human team

- **MiniMax architecture engineer**: analyzes code structure, integration boundaries, dependency risks and proposed changes.
- **MiniMax backend engineer**: drafts API, database and integration fixes with tests.
- **MiniMax frontend engineer**: proposes accessible, responsive UX improvements and implementation diffs.
- **MiniMax performance engineer**: reviews real timing/error metrics and recommends measurable optimizations.
- **MiniMax studio engineer**: helps orchestrate supported video/audio pipelines and media workflow; it does not substitute for cameras, codecs or streaming servers.
- **Chatbliz business advisor**: translates business needs into scoped tasks and service workflows.
- **Human owner / specialist**: approves architecture changes, spending, publishing, security-sensitive actions and production releases.

## Repository integration

Official upstream references: https://github.com/MiniMax-AI/minimax-code ; https://github.com/MiniMax-AI/Mini-Agent ; https://github.com/MiniMax-AI/MiniMax-M2 . Pin audited versions and inspect upstream licences before importing any code. Never imply these projects are installed simply because they are referenced.

Existing local foundations: `builder/`, `workforce/`, `modules/`, `src/journey.mjs`, `backend/minimax.mjs`, `backend/engineering.mjs`. The MiniMax backend adapter currently targets a Node runtime and must be adapted for Cloudflare Workers before deploying there.

## Implementation order

1. Inventory the homepage and locate the actual authorized video asset. Verify browser playback, accessibility, loading and fallback.
2. Inventory existing studio and fix nonworking navigation/camera/microphone workflows. Do not claim livestream works until a real end-to-end stream is tested.
3. Connect business intake forms to the shared project brief, then connect that brief to the builder and human review.
4. Configure MiniMax as an encrypted Cloudflare secret, verify model entitlement and run an authorized smoke test; never expose the key to browser code or GitHub.
5. Create protected project-scoped AI generation, job queue, usage budgets, audit trails and human approval gates.
6. Add sandboxed builds, tests, preview deployments, rollback and monitoring; isolate untrusted code from the Cloudflare Worker.
7. Verify production domain, HTTPS, customer authentication, mobile behavior, payments and media workflows before calling the app live.

## Definition of done

Each homepage promise must map to a real action, working route, permissioned backend and evidence from tests. Unsupported features must be labeled pending. No fake demo responses, embedded credentials, unapproved publishing or claims of deployment without verified URLs and health checks.
