# Bonga Bhengu OS capabilities carried into Chatbliz

This is a focused product transfer from the existing `bongabhenguai-art/bonga-bhengu` repository. Chatbliz keeps its own account system, Cloudflare Worker, D1 schema, four main workspaces and deployment setup.

## Reused product map

The Bonga Bhengu OS Chatbliz catalog defines My Brand, My Website, My Content and My Business on shared engines. Its workspace map identifies Business Discovery, Connection Wizard, Business Digital Twin, Sales & CRM, Website & App Builder, Creative Studio, Execution & Approvals, and Business Performance. Chatbliz now exposes these eight capabilities in its dashboard and routes each control to the existing Chatbliz workspace or technical setup guide.

The Bonga source describes several of these as integration-required. Chatbliz preserves that distinction: public search, CRM, connected social accounts, external execution and analytics are still pending. Profile, conversation and task persistence use Chatbliz's own tested backend.

## Business partner roles

The Bonga Bhengu OS Chatbliz partner catalog contributes the Hunting, Fishing and Closer roles alongside Chatbliz's existing Mentor, Coach, Assistant, Advisor and Negotiator. The dashboard also identifies Researcher, Marketing Amplifier, and Builder & Fixer roles. They currently provide routing and plans; they do not scrape, send outreach, publish, make offers or change code automatically.

## Studio transfer

The Bonga source for the Broadcast Studio is `chatgpt-site/dist/digital-studio.html`, `digital-studio.js`, and `studio-console.css`. The production app depends on authenticated Bonga-specific APIs for phone camera sessions, private media, saved production jobs, analytics and a Muxshed broadcast service. Those endpoints and their auth contract are not present in the Chatbliz Worker, so those files were not copied as if they could run independently.

Chatbliz now has an in-app single-viewport PVM/PGM workspace based on the existing Studio design: camera or local media preview, Take to Program, compact operation buttons, and browser-local recording/download. Live streaming, remote phones, cloud media storage, AI production, and publishing stay visibly marked as not connected.

## Source references

- `bongabhenguai-art/bonga-bhengu/chatgpt-site/dist/src/chatbliz/catalog.mjs`
- `bongabhenguai-art/bonga-bhengu/chatgpt-site/dist/src/chatbliz/partners.mjs`
- `bongabhenguai-art/bonga-bhengu/chatgpt-site/dist/src/chatbliz/workspaces.mjs`
- `bongabhenguai-art/bonga-bhengu/docs/studio-upgrade-implementation.md`
- `bongabhenguai-art/bonga-bhengu/AGENTS.md`

## Verification boundary

The Chatbliz test suite checks the module registry, partner routing, account persistence, and saved task/build flows. The Studio browser media path still needs manual camera-permission and playable-recording checks on desktop Chrome and Android Chrome. This transfer does not mean Railway or a production stream service has been deployed.
