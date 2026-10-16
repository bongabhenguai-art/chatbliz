# MiniMax engineering operations runbook

## Current implementation

- `backend/minimax.mjs`: optional MiniMax model adapter. The model API may charge credits; GitHub Actions free minutes do not imply free model inference.
- `backend/engineering.mjs`: six advisory workstreams and in-memory metric aggregation.
- `/api/ai/engineering`: protected Node server route. Requires `CHATBLIZ_ADMIN_TOKEN`, `MINIMAX_API_KEY`, `MINIMAX_MODEL`. Not safe for public browser clients.
- `/api/ops/metrics`: protected rolling in-memory AI engineering latency/error summary; not durable observability.
- `.github/workflows/minimax-readiness.yml`: tests and configuration-presence check; no provider API calls.
- `.github/workflows/minimax-live-check.yml`: **manual** opt-in one-request API connectivity test; requires GitHub Actions secret `MINIMAX_API_KEY` and repository variable `MINIMAX_MODEL`. GitHub workflows normally must be present on the default branch for manual Run workflow controls to appear.

## Activation order

1. Open a pull request, run and review tests. Do not merge if tests fail.
2. After approval, merge the workflows to the default branch. Never commit API credentials.
3. Add `MINIMAX_API_KEY` in GitHub Settings → Secrets and variables → Actions → Repository secrets, and `MINIMAX_MODEL` under Variables. This enables **only GitHub workflow** access, not Cloudflare access.
4. Manually run the optional live check. This can consume API credits and proves connectivity only, not customer-ready integration.
5. Separately configure the MiniMax secret in the Cloudflare `chatbliz-os` Worker and adapt the Node.js route to the Workers runtime. Do not copy the key into GitHub files.
6. Add session auth, customer quotas, durable telemetry, human review, rollback, and sandboxed builds before enabling automated AI coding or deployment.

## Deployment safety

GitHub is the source of truth, Cloudflare is the live runtime. Do not deploy the existing Node `server.mjs` as a Worker without adaptation. The existing Cloudflare Worker and D1 database must be inspected and preserved. No workflow in this branch automatically deploys to production.
