import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { timingSafeEqual } from "node:crypto";
import { createTaskStore } from "./src/task-store.mjs";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const port = Number(process.env.PORT) || 3000;
const taskStore = createTaskStore({ filePath: process.env.CHATBLIZ_TASK_FILE || join(root, ".data", "tasks.json") });
const cacheableAssets = new Set([".css", ".js", ".mjs", ".svg", ".png", ".jpg", ".ico"]);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon"
};
function json(res, code, data) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.end(JSON.stringify(data));
}
function authorized(req) {
  const expected = process.env.CHATBLIZ_DEV_TASK_TOKEN;
  if (!expected || expected.length < 32) return false;
  const supplied = req.headers.authorization || "";
  const a = Buffer.from(supplied);
  const b = Buffer.from(`Bearer ${expected}`);
  return a.length === b.length && timingSafeEqual(a, b);
}
async function parseBody(req) {
  if (!req.headers["content-type"]?.startsWith("application/json")) throw Object.assign(new Error("JSON content type required"), { code: 415 });
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 8192) throw Object.assign(new Error("Body too large"), { code: 413 });
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw Object.assign(new Error("Invalid JSON"), { code: 400 }); }
}
async function taskApi(req, res, pathname) {
  if (process.env.NODE_ENV === "production") return json(res, 404, { error: "Not found" });
  if (!authorized(req)) return json(res, 401, { error: "Unauthorized or task API not configured" });
  // This is a private development endpoint. The caller's business identity must
  // eventually come from a verified session, not from the request payload.
  const businessId = process.env.CHATBLIZ_DEV_BUSINESS_ID;
  if (!businessId) return json(res, 503, { error: "Development business not configured" });
  try {
    if (pathname === "/api/dev/tasks" && req.method === "POST") {
      const body = await parseBody(req);
      if (typeof body?.request !== "string" || !body.request.trim() || body.request.length > 4000) {
        return json(res, 400, { error: "Request must contain 1–4000 characters" });
      }
      const task = await taskStore.create({ businessId, request: body.request, idempotencyKey: req.headers["idempotency-key"] || null });
      return json(res, 201, { task });
    }
    if (pathname === "/api/dev/tasks" && req.method === "GET") {
      return json(res, 200, { tasks: await taskStore.list({ businessId }) });
    }
    const match = /^\/api\/dev\/tasks\/([0-9a-f-]{36})$/.exec(pathname);
    if (match && req.method === "GET") {
      const task = await taskStore.get({ businessId, taskId: match[1] });
      return task ? json(res, 200, { task }) : json(res, 404, { error: "Task not found" });
    }
    return json(res, 404, { error: "Not found" });
  } catch (error) {
    if ([400, 409, 413, 415].includes(error.code)) return json(res, error.code, { error: error.message });
    if (error instanceof TypeError) return json(res, 400, { error: error.message });
    console.error("Task API error", error);
    return json(res, 500, { error: "Task service error" });
  }
}

createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, "http://localhost");
    if (pathname === "/healthz") return json(res, 200, { status: "ok", service: "chatbliz-os" });
    if (pathname === "/api/capabilities" && req.method === "GET") {
      return json(res, 200, {
        service: "chatbliz-os",
        planning: "local-browser",
        chatHistory: "local-browser",
        customerAuthentication: "not-connected",
        aiExecution: "not-connected",
        customerTasks: "not-connected",
        payments: "not-connected",
        publishing: "not-connected"
      });
    }
    if (pathname.startsWith("/api/")) return taskApi(req, res, pathname);
    if (req.method !== "GET" && req.method !== "HEAD") return json(res, 405, { error: "Method not allowed" });
    // Serve only files required by the customer UI. Backend modules are never public.
    const publicPaths = new Set([
      "/", "/index.html", "/styles.css",
      "/src/app.js", "/src/domain.mjs", "/src/reports-ui.js", "/src/reports.mjs"
    ]);
    if (!publicPaths.has(pathname)) return json(res, 404, { error: "Not found" });
    const decoded = decodeURIComponent(pathname);
    const segments = decoded.split("/");
    const forbidden = segments.some(segment => segment.startsWith(".") || ["test", "tests", "docs", "node_modules", "db", "scripts"].includes(segment))
      || ["/package.json", "/server.mjs", "/src/task-store.mjs", "/src/postgres-task-repository.mjs"].includes(decoded)
      || decoded.startsWith("/src/publisher-") || decoded === "/src/publishing.mjs";
    if (forbidden) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
      return;
    }
    let file = resolve(join(root, decoded));
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" }).end("Forbidden");
      return;
    }
    const info = await stat(file).catch(() => null);
    if (info?.isDirectory()) file = join(file, "index.html");
    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": cacheableAssets.has(extname(file)) ? "public, max-age=300" : "no-cache",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Content-Type-Options": "nosniff"
    });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
  }
}).listen(port, "0.0.0.0", () => console.log(`Chatbliz listening on 0.0.0.0:${port}`));
