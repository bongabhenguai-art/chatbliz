// This adapter is not mounted until a trusted login provider is connected.
// Identity must be supplied by a server-side session verifier.
export function createCustomerTaskHandler({ verifySession, repository }) {
  if (typeof verifySession !== "function" || !repository?.list || !repository?.get) {
    throw new TypeError("A session verifier and task repository are required");
  }
  return async function handle(req, res, pathname) {
    if (!pathname.startsWith("/api/customer/tasks")) return false;
    const send = (status, body) => {
      res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      res.end(JSON.stringify(body));
      return true;
    };
    try {
      const session = await verifySession(req);
      if (!session?.userId || !session?.businessId) return send(401, { error: "Sign in required" });
      const scope = { userId: session.userId, businessId: session.businessId };
      if (pathname === "/api/customer/tasks" && req.method === "GET") {
        return send(200, { tasks: await repository.list(scope) });
      }
      const match = /^\/api\/customer\/tasks\/([a-f0-9-]{36})$/i.exec(pathname);
      if (match && req.method === "GET") {
        const task = await repository.get({ ...scope, taskId: match[1] });
        return send(task ? 200 : 404, task ? { task } : { error: "Not found" });
      }
      return send(404, { error: "Not found" });
    } catch {
      return send(503, { error: "Task service unavailable" });
    }
  };
}
