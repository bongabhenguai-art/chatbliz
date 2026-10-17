# Authentication and row-level authorization contract

This change introduces **SQL policies only**, not a functioning login or connected database.

## Trust boundary
- The browser sends a session cookie; the backend validates its signature, issuer, audience, expiration and CSRF protections.
- The backend resolves the verified identity to `app_users.id` and checks `business_memberships` before selecting a business.
- For each PostgreSQL request, begin a transaction and set `app.user_id` and `app.business_id` using `SET LOCAL` or parameterized `set_config(..., true)` from **server-derived** values. Do not use client-provided IDs.
- The application database role must be non-owner, non-superuser and lack BYPASSRLS. Table privileges must be explicitly granted, never assumed.
- RLS is defense in depth; service-layer authorization remains mandatory.

## Policy scope
- Users may read their own identity and membership records.
- Members may read their selected business and its tasks/events.
- Owners, admins and members may create tasks in their selected business; viewers cannot.
- No customer-facing task update, delete or event-insert policy exists yet.
- Worker permissions for transitions and event logging require a separate design.

## Mandatory validation before deployment
Test no session context, unknown user, member of another business, viewer writes, wrong business selection, expired login, forged identity headers, transaction pool reuse, and concurrent requests. Include PostgreSQL integration tests against the actual configured app role.

**Caution:** No production connection, OIDC provider, sessions, migrations or grants are configured by this commit. Do not expose customer endpoints until these are verified.
