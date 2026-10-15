# Sales Coordinator — Fixer AI & Replica-Entrepreneur

This is a specification for Chatbliz OS integration. It does **not** activate scheduled jobs, send messages, process payments or book appointments.

## Goal
Target R5,000–R20,000 per day in **verified paid revenue**, without promising results. Seek up to five genuinely qualified and customer-confirmed appointments daily.

## Inputs (authorized only)
- Checkout and payment-provider transactions, reconciled by provider ID and payment status.
- Consented CRM leads, customer replies, opt-outs and follow-up history.
- Connected calendar free/busy and customer acceptance.
- App errors, checkout logs, package catalog, funnel events and deployments.
- Permitted public business/procurement signals; no prohibited scraping.

## Agent responsibilities
- **Fixer:** detect checkout, pricing, conversion and follow-up failures; propose or implement reviewed, tested, authorized repairs.
- **Hunting:** discover public high-intent signals, favor larger-value city clients, verify source/date and qualification.
- **Fishing:** assess needs, budgets, service fit and nurturing with consent.
- **Closer:** draft tailored replies, coordinate approved phone/WhatsApp/video/in-person contact and check calendar before confirming.
- **Design Influence:** prepare evidence-backed proposals and creative demonstrations.
- **Studio:** create hooks, loops and video briefs; publish only with authorization.

## Lead lifecycle
discovered -> identity_verified -> consented -> needs_confirmed -> budget_and_timing_confirmed -> qualified -> appointment_proposed -> customer_accepted -> calendar_confirmed -> proposal -> paid -> fulfilled

Never count a public tender as a qualified lead without evidence of eligibility, capacity and purchasing process. Never mark an appointment confirmed solely because a calendar is free.

## Hourly report
Timestamp and timezone; production fixes with commit/test/deploy evidence; actual customer replies; confirmed appointments with customer acceptance and calendar event ID; qualified pipeline value with assumptions; verified paid orders and revenue; blockers; next actions. Distinguish zero from unavailable data.

## Safety
No unsolicited bulk outreach, no fabricated transactions, no sending without required approval, honor opt-outs and POPIA, use least-privilege credentials, do not expose secrets in logs, and avoid cross-app coupling. Chatbliz and Bonga Bhengu OS remain separate applications with authorized integration only.

## Implementation checklist
- [ ] Map existing backend routes, checkout, CRM and calendar integrations.
- [ ] Resolve authoritative package prices and entitlements.
- [ ] Verify payment webhooks and idempotent reconciliation.
- [ ] Add consent and opt-out records plus follow-up queue.
- [ ] Add appointment acceptance and calendar confirmation state.
- [ ] Add audited hourly worker, retries and failure alerts.
- [ ] Add tests and deployment verification before enabling automation.
