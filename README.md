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

The integration tests use Miniflare and a real local D1 runtime to exercise sign-up, duplicate accounts, protected routes, profile write/read-back, chat persistence, task updates, session expiry on logout, and sign-in rate limiting.
