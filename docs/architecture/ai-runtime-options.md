# Chatbliz AI runtime options

Status: evaluation note, 15 October 2026

## Decision

Keep Chatbliz's customer app on its existing Cloudflare Worker and D1 architecture. Treat OpenJarvis as a candidate local development/runtime and a source of patterns, not as a production dependency or a replacement app. Do not add a multi-provider router, voice stack, MCP servers, or third-party credentials until a specific customer workflow has an owner, permissions, an API contract, and tests.

## What the current app does

Chatbliz currently has a Worker API, D1 persistence, account sessions, and a deterministic business-planning module. It does not call an external AI model, execute MCP tools, connect Google Workspace, provide voice, or generate/publish websites or media. The current technical-repair panel is read-only. These boundaries are documented in the root README and must remain visible in the product until integrations are implemented and verified.

## OpenJarvis fit

OpenJarvis is a local-first AI framework with local/cloud inference backends, agent and memory abstractions, an optional local GUI, and external MCP server support. Its CLI and GUI start a local Python service; its MCP examples can start local subprocesses or connect to remote HTTP servers. This can help the founder evaluate model routing, local inference, skills, and workflow behavior on a development machine. It is not a drop-in library for this Node.js Cloudflare Worker, and its local GUI is not Chatbliz's customer-facing interface.

The pasted config is a desktop/local MCP-client configuration pattern. `npx`/`uv` subprocess servers cannot be launched by the deployed Worker. Each named server and credential must be verified independently; example names and placeholder secrets do not establish that a service exists or is connected. Do not put API keys in a checked-in config, browser bundle, or shared customer configuration.

## Safe integration path

1. **Resolve access and deployment first.** Keep the current Cloudflare Access restriction in place until owner/customer authorization is designed. The domain still needs its registrar nameservers pointed to Cloudflare before it can route to the Worker; preserve the existing mail records.
2. **Add an AI provider seam inside Chatbliz.** Define a small server-side interface for a model request, provider health, bounded timeouts, quotas, and truthful failure states. Keep provider secrets in Worker secrets. Add a deterministic fallback and tests before selecting or routing among providers. Do not claim that provider routing is self-learning.
3. **Connect one user-authorized business integration at a time.** Google Workspace should use its official OAuth flow, minimal scopes, account-specific consent, revocation, and server-side token storage. WhatsApp and social accounts need separate official provider apps and callbacks. A global desktop MCP config is not an OAuth substitute.
4. **Introduce tools through a governed registry.** Begin with narrowly scoped, read-only tools; record each tool's owner, inputs, outputs, permissions, and failure behavior. Require explicit confirmation for external writes such as sending messages, publishing, editing files, or changing DNS. Do not expose shell/code execution MCP tools to customer sessions.
5. **Evaluate voice after the authenticated web workflow works.** Voice can become an optional interface over the same Chatbliz API and permissions. A LiveKit or other realtime service would need its own architecture, consent, retention, and cost review; it should not create a parallel account or data store.
6. **Keep app-building and repair isolated.** Code generation and technical repair must run in an owner-authorized sandbox with scoped repository permissions, reviewable diffs, tests, and explicit deploy approval. Never give an autonomous agent direct production shell, unrestricted filesystem, or broad account credentials.

## Immediate priority

The highest-value next step is not a Stable Diffusion prompt parser, a Termux notification daemon, or a multi-brain router. First restore the intended owner access path and complete the production authentication/security boundary. Then build one server-side AI request path and verify one real customer outcome end to end. Add Google Workspace OAuth when the first target workflow needs customer documents or email; add voice after the text workflow and permissions are proven.

The pasted Google Workspace, WhatsApp, Twilio, Visual Studio, OpenHands, LiveKit, and Stable Diffusion examples remain proposals. No corresponding service is verified or configured in this repository.

## Upstream references checked

- [OpenJarvis README](https://github.com/open-jarvis/OpenJarvis): local-first purpose, supported interfaces, CLI and agent overview.
- [OpenJarvis architecture overview](https://github.com/open-jarvis/OpenJarvis/blob/main/docs/architecture/overview.md): inference engines, agents, memory, and fallback concepts.
- [OpenJarvis external MCP guide](https://github.com/open-jarvis/OpenJarvis/blob/main/docs/user-guide/mcp-external-servers.md): local stdio and remote HTTP transport/configuration.
- [OpenJarvis configuration guide](https://open-jarvis.github.io/OpenJarvis/getting-started/configuration/): config, MCP, and credential handling guidance.
- [Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers): discovery index only; entries require individual license, maintenance, and security review before adoption.
