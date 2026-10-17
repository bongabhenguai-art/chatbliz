import { createServer } from "node:http";
import { readFile, stat, writeFile, mkdir, readFile as rf } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { preparePlan } from "./src/domain.mjs";
import { runSkill } from "./src/agents.mjs";
import { parseReport } from "./src/reports.mjs";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const port = Number(process.env.PORT) || 3000;
const dataDir = join(root, "data");
const messagesFile = join(dataDir, "messages.json");
const reportsFile = join(dataDir, "reports.json");
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

async function ensureDataDir() {
  try { await mkdir(dataDir, { recursive: true }); } catch {};
}

async function readJson(file) {
  try {
    const txt = await readFile(file, "utf8");
    return JSON.parse(txt);
  } catch { return [];
  }
}

createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, `http://localhost`);

    // API endpoints
    if (pathname === "/healthz") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }).end(JSON.stringify({ status: "ok", service: "chatbliz-os" }));
      return;
    }

    if (pathname.startsWith("/api/")) {
      // Ensure data dir
      await ensureDataDir();
      if (pathname === "/api/messages") {
        if (req.method === "POST") {
          const body = await new Promise((resolveBody, reject) => {
            let data = "";
            req.on("data", chunk => data += chunk);
            req.on("end", () => resolveBody(data));
            req.on("error", reject);
          });
          let payload;
          try { payload = JSON.parse(body); } catch { res.writeHead(400, {"Content-Type":"text/plain; charset=utf-8"}).end("Invalid JSON"); return; }
          const text = String(payload.message ?? "").trim();
          if (!text) { res.writeHead(400, {"Content-Type":"text/plain; charset=utf-8"}).end("Empty message"); return; }

          // Prepare plan server-side
          const plan = preparePlan(text);
          if (payload.selectedPartner) {
            plan.partners = [payload.selectedPartner];
            // keep response structure consistent
            plan.response = `${payload.selectedPartner} can help with ${plan.product.name}. I’ve prepared this as a planning request. ${plan.product.status}. No external action has been taken.`;
          }
          if (payload.selectedSkill) {
            try {
              const skillOutput = await runSkill(payload.selectedSkill, text);
              plan.response = plan.response + "\n\n" + skillOutput;
              plan.partners = Array.from(new Set([...(plan.partners || []), payload.selectedSkill]));
            } catch (e) { /* ignore skill runtime errors */ }
          }

          // persist message
          const messages = await readJson(messagesFile);
          const item = { id: Date.now().toString(36) + Math.floor(Math.random()*1000), message: text, plan, partner: payload.selectedPartner ?? null, skill: payload.selectedSkill ?? null, createdAt: new Date().toISOString() };
          messages.push(item);
          await writeFile(messagesFile, JSON.stringify(messages, null, 2), "utf8");
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" }).end(JSON.stringify(item));
          return;
        }
        if (req.method === "GET") {
          const messages = await readJson(messagesFile);
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" }).end(JSON.stringify(messages));
          return;
        }
      }

      if (pathname === "/api/reports") {
        if (req.method === "POST") {
          const body = await new Promise((resolveBody, reject) => {
            let data = "";
            req.on("data", chunk => data += chunk);
            req.on("end", () => resolveBody(data));
            req.on("error", reject);
          });
          let payload;
          try { payload = JSON.parse(body); } catch { res.writeHead(400, {"Content-Type":"text/plain; charset=utf-8"}).end("Invalid JSON"); return; }
          try {
            const report = parseReport(payload.text);
            const reports = await readJson(reportsFile);
            const item = { id: Date.now().toString(36) + Math.floor(Math.random()*1000), text: report.text, timestamp: report.timestamp, sources: report.sources, importedAt: report.importedAt };
            reports.push(item);
            await writeFile(reportsFile, JSON.stringify(reports, null, 2), "utf8");
            res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" }).end(JSON.stringify(item));
          } catch (err) {
            res.writeHead(400, {"Content-Type":"text/plain; charset=utf-8"}).end(String(err.message || err));
          }
          return;
        }
        if (req.method === "GET") {
          const reports = await readJson(reportsFile);
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" }).end(JSON.stringify(reports));
          return;
        }
      }

      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
      return;
    }

    // existing static server behavior with security checks
    const decoded = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const segments = decoded.split("/");
    const forbidden = segments.some(segment => segment.startsWith(".") || ["test", "tests", "docs", "node_modules"].includes(segment))
      || ["/package.json", "/server.mjs"].includes(decoded)
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
  } catch (err) {
    console.error(err);
    try { res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" }).end("Internal server error"); } catch {}
  }
}).listen(port, "0.0.0.0", () => console.log(`Chatbliz listening on 0.0.0.0:${port}`));
