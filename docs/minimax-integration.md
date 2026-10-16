# MiniMax integration for Chatbliz OS

Official reference repositories (not copied or vendored):
- https://github.com/MiniMax-AI/minimax-code — coding agent
- https://github.com/MiniMax-AI/Mini-Agent — agent framework
- https://github.com/MiniMax-AI/MiniMax-M2 — open-weight model

## Setup

1. Obtain an API key through your own MiniMax account. Free sign-up does **not** guarantee free API credits.
2. In your server host's secret settings configure `MINIMAX_API_KEY` and `MINIMAX_MODEL` (an enabled chat model available to your account). Set `CHATBLIZ_ADMIN_TOKEN` to a unique random secret of at least 24 characters.
3. Deploy the Node.js server with `npm start` and a configured `PORT` (provided by most hosts).
4. Verify `GET /api/status` reports `minimaxConfigured:true`. This verifies environment configuration, **not** API billing, model permission, or connectivity.
5. The protected `POST /api/ai/chat` endpoint accepts JSON `{"message":"Help me grow my business"}` with `Authorization: Bearer <CHATBLIZ_ADMIN_TOKEN>`. Keep the token **server-side**; do not embed it in a public browser or share it in chat.

## Security and limitations

The protected API is a developer-only backend integration, **not a public customer chat**. Before enabling for customers, implement session authentication, per-user quotas, rate limiting, abuse controls, billing, and audit logs. MiniMax code and agent repositories have **not** been installed, run, or audited in this branch. No provider model execution or production deployment has been verified. Run `npm test` before merge. Check the upstream licences and resource requirements before reuse. Cloudflare DNS alone does not run a persistent Node.js server; use a compatible Node host or adapt to Workers.
