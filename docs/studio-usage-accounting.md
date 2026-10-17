# Chatbliz Studio — production usage accounting contract

Status: schema foundation only. No production billing or provider invocation is connected.

## Reservation protocol

1. Authenticate the customer session and resolve business membership on the server.
2. Read the active paid plan from the trusted subscription database, never the browser.
3. Under a single database transaction, acquire a lock scoped to the business, capability and monthly period.
4. Check active `reserved` plus `completed` usage against the plan's monthly limit.
5. Insert a reservation with a unique idempotency key. Retries must return the existing reservation, not charge again.
6. Commit before calling MiniMax. Do not hold a database lock during a network request.
7. Mark successful provider results `completed`. On a confirmed failure, mark `released`.
8. Reconcile timed-out `reserved` requests with provider outcomes before releasing them; never assume an ambiguous network failure means the provider did not bill.
9. Keep billing-worker permissions separate from customer application RLS roles.

## Safety requirements

- Enforce a finite spending ceiling and rate limits for every tier, including Enterprise.
- Use database locking or an atomic conditional update to prevent concurrent quota oversubscription.
- Store provider credentials only in server environment secrets.
- Do not accept arbitrary provider URLs, account IDs, plan names, or usage totals from customers.
- Verify provider terms, model IDs, endpoint paths and response formats before production activation.
- Add integration tests for concurrency, retries, failures and tenant isolation before wiring any paid request.
