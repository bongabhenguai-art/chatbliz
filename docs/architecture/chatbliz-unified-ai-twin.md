# Chatbliz unified AI Twin

## Goal

Chatbliz is the customer's home for an AI business partner that carries one approved business context across business planning, app building, content, podcast production and livestream production. Provider tools should work as replaceable services behind Chatbliz; customers should not have to manage separate copies of their business profile, tasks or production projects.

## Requested provider and product set

The founder wants to combine ChatGPT Codex, Shogo AI, Arena AI, Claude, Haile Studio, Podcast, Livestream and Digital Studio. Preserve these names in the integration backlog. The exact provider identity, official API, license and permitted use must be verified before building a connector; a shared interface does not prove a provider exposes an API or grants access to its product internals.

| Integration | Intended role in Chatbliz Twin | Gate before activation |
| --- | --- | --- |
| ChatGPT Codex | Authorized code review, implementation plans and repository work | Official supported interface, repository scope, test sandbox, human review and deployment approval |
| Shogo AI | Provider-specific AI capability requested by the founder | Confirm exact service/product, official API and terms, supported operations and account authorization |
| Arena AI | Development and model/workflow provider as officially supported | Confirm official integration contract, user consent and allowed deployment workflow |
| Claude | Provider-specific reasoning/code support through an official integration | Official API/terms, server-side credentials, quotas and data handling controls |
| Haile Studio | Requested creative/production workspace | Confirm exact product, official API, media ownership and export support |
| Podcast | Record, edit, prepare and export business podcast episodes | Browser capture first; editing, storage, transcription and publishing require actual services |
| Livestream | Broadcast the Program feed to an authorized destination | Healthy ingest, credential handling, destination permissions and start/stop confirmation |
| Digital Studio | Camera/media sources, scenes, graphics and produced output | Feature-by-feature validation; unavailable controls remain visibly unavailable |

## How the Twin should work

1. The customer signs in once to Chatbliz. Existing account/session rules remain the source of identity and workspace authorization.
2. Chatbliz keeps a tenant-scoped business context: owner-entered profile, customer projects, approved lessons, media references, tasks, and explicit consent/retention settings. Do not silently train on private customer data or merge one business's context into another.
3. A workflow planner interprets the request, identifies which capabilities are needed, and presents the proposed work. A provider adapter receives only the minimum authorized context for that request.
4. A provider registry records each adapter's official API, supported actions, permission scopes, data boundary, health, quotas and truthful availability. Route only to providers that are authorized and healthy; otherwise explain the blocker or use a configured fallback.
5. Results return to Chatbliz's shared project and task history with provider/source attribution and a review state. External writes, publishing, sending, spending and deployment require the customer's approval.
6. The same project context is available to Digital Studio, Podcast and Livestream workflows. A media item carries ownership, consent, source, format, processing state, storage location and delivery permissions. A local file is not described as cloud media.

## Studio and media loop

The first usable loop is: choose a camera/media source → prepare Preview → Take/Cut to Program → attach the chosen microphone mix → record and download a playable file. Podcast sessions can reuse that capture loop once a podcast-specific project, tracks and export format are implemented. Live broadcast is a separate stateful operation: Preview/Program remains local until an authenticated backend ingests Program and verifies the destination session. Media/scene transformations are jobs only when a configured processor receives the request and returns a real result; never point the UI at a placeholder IP or imply local camera background replacement without a processor.

## Platform boundaries

- Reuse Chatbliz's current app and Cloudflare Worker/D1 architecture unless a verified need requires an incremental service. Railway is not a prerequisite for the in-browser Studio.
- Keep keys and OAuth tokens in server-side secrets/storage. Do not put provider credentials in browser JavaScript, Android XML or a global MCP sample file.
- Treat MCP servers as permissioned tools, not as provider API credentials. Review each server's source, license, network access, filesystem scope and secrets before enabling it.
- Codex, Claude, Arena AI, Shogo AI and Haile Studio do not gain the ability to update the live app just because they can prepare a patch. Tests, branch review and explicit deploy approval stay in the release workflow.
- Avoid self-modifying production. A future code-repair worker may create an isolated branch and verified patch, but a person must review security-sensitive changes and authorize release.

## Integration delivery gates

For every connector, document the official API, service owner, credentials method, scopes, data sent, rate limits/cost, retry behavior, health check, audit event, tests and revocation path. Keep a connector disabled until authorization and an end-to-end test prove the declared workflow. Provider outages must result in a visible recoverable error; quotas must be respected, not bypassed.

For every Studio workflow, test permissions and device disconnects, Preview versus Program behavior, audio inclusion, playable exports, private media access and deletion. For livestream, test the actual destination handshake, stream health, failure/retry and stop. Display no invented status, reach, view count or quality metrics.

## Current verified status

Chatbliz currently has its own account/workspace, deterministic planning behavior, browser camera and local-media Preview/Program, local browser microphone controls, local recording, and a visible-but-unconfigured Go Live action. It does not currently have verified API connections to Codex, Shogo AI, Arena AI, Claude or Haile Studio, nor podcast publishing, remote guests, cloud media storage, broadcast ingest or social publishing. Each item must advance through discovery, authorization, implementation and tested activation before it is shown as connected.
