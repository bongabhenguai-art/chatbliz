# Chatbliz owner-approved task workflows

## First live workflow

The first workflow makes the existing saved-task path durable without pretending that Chatbliz has an external AI provider or business connector:

1. A signed-in owner starts **Prepare review** on a saved task.
2. The Worker checks that the task belongs to the current account, creates a workflow record in D1, and starts the bound Cloudflare Workflow.
3. The Workflow reads only that owner's task and source conversation, runs Chatbliz's current deterministic planner, and stores the review plan with `awaiting_approval` status.
4. The owner sees the saved plan and approves or rejects it. The decision endpoint rechecks ownership and uses an atomic status transition in D1 so a decision cannot be applied twice.
5. Approval means the plan was approved for owner follow-through. It does not mark the task complete, contact customers, publish content, spend money, deploy code or perform an external action.

The D1 row is the app-facing source of truth for progress. Workflow execution can be inspected in Cloudflare's workflow tools. UI animation reflects the real queued/waiting state; it is not a simulated success indicator and respects reduced-motion settings.

## Boundaries

- MCP remains the interface for exposing approved tools and data to a model. This first slice does not install MCP servers or connect external tools.
- A2A is deferred until Chatbliz needs communication between independently hosted agents. It is not needed to coordinate internal partners in one product.
- LangGraph and Google ADK remain possible future orchestration frameworks. Adding either now would introduce a second runtime without a verified need; Cloudflare Workflows matches the current Worker deployment.
- No external AI model is called by this workflow. The plan comes from `public/src/domain.mjs` and is labeled as deterministic planning.
- Workflow records, tasks and source messages are always scoped by the signed-in owner. Pending reviews are unique per task. Unknown or failed preparation is shown as failed; it is never reported as approved.

## Verification

The Miniflare integration test uses a local D1 database and Workflow binding to exercise workflow preparation, plan persistence, owner isolation, duplicate pending-review rejection, decision validation, approval persistence and duplicate-decision rejection. Production deployment still requires the GitHub production environment secrets and Cloudflare domain/Access configuration documented in the deployment notes.
