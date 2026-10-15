# Chatbliz OS

Chatbliz is a chat-first business partner workspace for **My Business, My Brand, My Website & App, and My Studio**. This repository now contains a working full-stack foundation: account creation and sign-in, private business profiles, saved conversations, and a task list that owners can update.

## Run locally

Requirements: Node.js 20.19+ and npm.

```sh
npm install
npm run db:apply:local
npm run dev
```

Wrangler starts the app on its local development URL and uses a local D1 database. Local data is separate from the Cloudflare account database.

## Real application behavior

- Sign-up stores a normalized email, PBKDF2 password hash, a salted password record, an HTTP-only session token hash, and a workspace profile in D1.
- Sign-in verifies passwords, uses the same error for unknown emails and wrong passwords, and limits repeated failures by hashed IP and email.
- The profile editor reads and writes the signed-in owner’s profile. Successful writes are read back and checked before the app reports success.
- Chat messages and built-in business plans are stored per account and restored after signing back in.
- Owners can save plan steps as tasks, mark them complete, and see the saved status after reloading.
- API endpoints require the signed-in session; data queries are scoped to that account.

The current planning engine uses the tested business rules in `public/src/domain.mjs`. It is not an external AI model. AI-provider access, email verification and password recovery, WhatsApp, publishing, bookings, payments, and the four production integrations still need to be connected before those capabilities can be advertised as live.

## How the workspaces connect

The home screen guides an owner through a practical loop: **My Brand** clarifies the customer and promise; **My Website & App** turns that promise into a site or app brief; **My Studio** plans consistent content; and **My Business** tracks enquiries, sales, follow-ups and tasks. Customer response informs the next change to the brand, offer or content. Each journey button switches to that workspace and prefills a planning prompt in Chatbliz's saved conversation. In this version, the app can persist the profile, conversation and tasks; building a site, checking external brand listings, producing or publishing media, capturing leads, WhatsApp, bookings and payments require integrations that are not connected yet.

The **My Website & App** workspace includes a developer build desk for one owner login and multiple customer business projects. Each build keeps its need, goal and owner-entered customer lesson in a separate, owner-scoped D1 record. “Plan next build step” includes that project’s saved lesson in the next Chatbliz conversation. This is explicit project memory, not model training; project data is not shared between customers. Code generation, customer logins and publishing still require connected developer and hosting services.

The **Technical repair** dashboard runs read-only checks for the signed-in session, D1 health and front-end assets, then links to the source branch and a GitHub Codespace using `.devcontainer/`. The Codespace starts Wrangler with a local D1 database; it has no production credentials and does not deploy automatically. GitHub displays the account responsible for Codespaces usage before creation. The social setup wizard links to each provider’s official developer console. Actual platform authorization is not active yet: each provider needs a Chatbliz developer app, credentials, and its own tested OAuth authorization/callback implementation before accounts can be linked or content published.

## Deploy to a dedicated Cloudflare Worker

This app is configured for its own Worker, `chatbliz-os`, and a dedicated D1 database, `chatbliz-os-db`. It does not reuse the existing `zuxuru` Worker or `bonga-bhengu-db` database.

1. Sign in with `npx wrangler login`.
2. Create the dedicated database with `npx wrangler d1 create chatbliz-os-db` and put the returned database ID in `wrangler.jsonc`.
3. Apply the schema with `npm run db:apply:remote`.
4. Deploy with `npx wrangler deploy`.

The `chatbliz.online` domain is not routed by this Worker yet. Connect the domain to Cloudflare before adding a custom-domain route. The Worker can be previewed at its Cloudflare `workers.dev` address after deployment.

## Verification

```sh
npm test
npx wrangler deploy --dry-run
```

The integration tests use Miniflare and a real local D1 runtime to exercise sign-up, duplicate accounts, protected routes, profile write/read-back, chat persistence, customer build memory isolation, task updates, session expiry on logout, and sign-in rate limiting.
