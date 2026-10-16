# Chatbliz OS container deployment

The repository now includes a dependency-free Node.js Dockerfile with a non-root user and a /healthz probe.

## Build and verify
```sh
npm test
docker build -t chatbliz-os:local .
docker run --rm -p 3000:3000 chatbliz-os:local
curl -fsS http://localhost:3000/healthz
```

## Coolify / Dokploy
Connect the existing GitHub repository `bongabhenguai-art/chatbliz` as a Dockerfile-based service. Set the container port to 3000 and health check to `/healthz`. Configure the custom domain and TLS in the chosen host. Keep all publisher API keys server-side.

The public website can be hosted this way, but the customer-facing multi-tenant deployment engine, database, owner login, real AI calls, billing and WhatsApp automation are not implemented by this Dockerfile. No deployment success is implied.

## Publishing gateway
The `src/publisher-gateway.mjs` module expects an independently deployed, operator-controlled HTTPS gateway with `POST /v1/deployments` returning a deploymentId. It does **not** directly connect to Coolify or Dokploy. Do not set `CHATBLIZ_PUBLISHER_URL` to a raw Coolify or Dokploy API endpoint: their API contracts are different. Configure `CHATBLIZ_PUBLISHER_URL`, `CHATBLIZ_PUBLISHER_TOKEN`, and `CHATBLIZ_PUBLISHER_TARGET` only when a compatible, authenticated gateway has been implemented and reviewed.

## Verify
Review GitHub Actions results, application logs, container health, HTTPS certificate and a complete frontend smoke test before declaring production readiness.
