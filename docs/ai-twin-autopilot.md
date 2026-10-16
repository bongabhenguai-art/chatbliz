# Chatbliz AI Twin — staged autopilot architecture

## Mission
The AI Twin is the owner's business operating delegate and technical repair coordinator inside the existing Chatbliz OS. It is not a second application or a replacement for the four workspaces.

## Inputs and learning
Owner-approved business profile, brand voice, operating preferences, product catalog, connected account permissions, customer-support playbooks, incident reports, test results, and explicit corrections. Learning means retaining reviewed preferences and outcomes in an access-controlled database; it does **not** mean training or changing MiniMax model weights. Never silently collect private communications or credentials.

## Workflows
1. **Observe:** Gather consented app health, client-side errors, failed requests, Studio audio/video status, deployment status and approved business metrics.
2. **Diagnose:** Group issues by severity and evidence. Identify likely root causes; mark hypotheses as unverified.
3. **Plan:** Generate small patch proposals and tests with rollback steps. MiniMax is a candidate adviser, not a privileged operator.
4. **Build:** Authorized coding worker works in an isolated branch/sandbox with scoped GitHub credentials.
5. **Verify:** CI tests, static analysis, security review, browser/mobile checks and user acceptance checks. A passing unit test does not prove live readiness.
6. **Approve:** Owner or delegated authorized reviewer explicitly approves production deployments, financial actions, publishing, customer messages and permission changes.
7. **Execute:** Connector applies only approved changes. Record execution result, evidence, version and rollback handle.
8. **Learn:** Save corrections, outcomes and verified patterns for future task prioritization; allow owner to edit/delete them.

## Workspace delegation
- **My Brand:** public footprint audits, positioning, reputation, campaign drafts.
- **My Website & App:** source inspections, bug triage, build tests, reviewed PRs, deployment verification.
- **My Studio:** microphone, recorder, WebRTC, multi-camera and streaming diagnostics; never replace working video tracks while fixing audio.
- **My Business:** CRM follow-ups, scheduled briefs, operations reports, sales pipeline and finance review. No unapproved financial transfers.

## Control plane
States: queued → investigating → proposal-ready → awaiting-approval → approved → executing → verifying → completed; failed → rollback-review. Use append-only audit events, tenant isolation, scoped OAuth, budgets, rate limits, kill switch and human override. Block cross-tenant access. Never bypass third-party quotas or authorization.

## Implementation status
`twin/engine.mjs` is the initial policy/plan module and `tests/twin.test.mjs` is its test suite. No durable memory, live Arena integration, AI model execution, autonomous code commits, production deployment, or fully functioning business autopilot has been verified. These require implementation and acceptance testing against the actual deployed app.
