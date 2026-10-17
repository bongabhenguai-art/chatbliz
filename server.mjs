import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const port = Number(process.env.PORT) || 3000;
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

createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, "http://localhost");
    if (pathname === "/api/ai/chat" && req.method === "POST") {
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("X-Content-Type-Options", "nosniff");
      if (!process.env.OPENAI_API_KEY) {
        res.writeHead(503);
        res.end('data: {"error":"AI provider is not configured"}\\n\\n'.replaceAll("\\\\n","\\n"));
        return;
      }
      try {
        let raw = "";
        for await (const chunk of req) {
          raw += chunk.toString();
          if (raw.length > 100000) throw new Error("Request too large");
        }
        const input = JSON.parse(raw);
        const messages = Array.isArray(input.messages) ? input.messages.slice(-20) : [];
        const safe = messages.filter(m => ["user", "assistant"].includes(m.role) && typeof m.content === "string")
          .map(m => ({ role: m.role, content: m.content.slice(0, 12000) }));
        if (!safe.length || safe.at(-1).role !== "user") throw new Error("A user message is required");
        const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            stream: true,
            messages: [
              { role: "system", content: "You are ChatBliz OS, a helpful business partner coordinating My Brand, My Website & App, My Studio and My Business. You can advise and plan but must never claim to have published, charged, messaged, or executed tools without verified tool results. Never expose secrets." },
              ...safe
            ]
          })
        });
        if (!upstream.ok || !upstream.body) {
          res.writeHead(502);
          res.end('data: {"error":"AI provider request failed"}\\n\\n'.replaceAll("\\\\n","\\n"));
          return;
        }
        res.writeHead(200);
        for await (const chunk of upstream.body) res.write(chunk);
        res.end();
      } catch (error) {
        if (!res.headersSent) res.writeHead(400);
        res.end(`data: ${JSON.stringify({ error: error.message === "Request too large" ? error.message : "Invalid chat request" })}\\n\\n`);
      }
      return;
    }
    if (pathname === "/healthz") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }).end(JSON.stringify({ status: "ok", service: "chatbliz-os" }));
      return;
    }
    const decoded = decodeURIComponent(pathname);
    const segments = decoded.split("/");
    const forbidden = segments.some(segment => segment.startsWith(".") || ["test", "tests", "docs", "node_modules"].includes(segment))
      || ["/package.json", "/server.mjs", "/.env"].includes(decoded)
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
    res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
  }
}).listen(port, "0.0.0.0", () => console.log(`Chatbliz listening on 0.0.0.0:${port}`));
