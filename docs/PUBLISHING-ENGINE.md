# Chatbliz OS publishing architecture

Chatbliz OS is independent of Replit and Vercel. The existing chat-first product is preserved.

## Working static publisher
- GitHub Actions runs `npm test` and publishes `index.html`, `styles.css`, and the `src/` modules through GitHub Pages.
- In repository Settings → Pages, select **GitHub Actions** as source.
- Confirm the workflow and public URL before claiming a live deployment.
- This is **not** a full-stack app hosting engine.

## Full-stack publisher integration plan (not installed)
- **Arena AI**: development environment; changes must be committed to GitHub and reviewed.
- **bolt.diy**: optional open-source AI builder; integrate through supported APIs/embedding only after license and security review.
- **Coolify**: preferred self-hosted deployment control plane for full-stack apps; requires a provisioned server, secure admin credentials, and authorized API integration.
- **Dokploy**: alternative deployment control plane; not run simultaneously for the same project.
- **GitHub**: source of truth, branch protection, CI, status and rollback history.

## Required publish workflow
1. Owner authorizes repository, target branch, domain and server.
2. Validate repository access and detect framework/runtime.
3. Run tests, dependency audit and secret scan; block failed builds.
4. Build a versioned artifact or container image.
5. Deploy via approved publisher using server-side credentials only.
6. Verify health endpoint, TLS, route handling, and application functionality.
7. Record deployment ID, commit SHA, URL, logs, and rollback target.
8. Show a truthful status in My Website & App. Never label preview as production.

## Safety and ownership
- Keep tokens in the hosting platform's secret store; never commit them.
- Require explicit authorization for customer account actions.
- Separate customer tenants and deployment credentials.
- Do not automatically publish unreviewed AI code to production.
- Do not merge Bonga Bhengu OS into Chatbliz OS.
- The Replit Vite/braces findings belong to the Replit dependency tree until its actual source is identified.
