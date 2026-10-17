import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";

test("static assets are cached briefly, while HTML is revalidated", async () => {
  const port = await new Promise((resolve, reject) => {
    const s = createServer();
    s.once("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const p = s.address().port;
      s.close(() => resolve(p));
    });
  });
  const child = spawn(process.execPath, ["server.mjs"], {
    cwd: new URL("../", import.meta.url),
    env: { ...process.env, PORT: String(port), NODE_ENV: "production" },
    stdio: "ignore"
  });
  try {
    let html;
    for (let i = 0; i < 40; i++) {
      try { html = await fetch(`http://127.0.0.1:${port}/`); break; }
      catch { await new Promise(r => setTimeout(r, 50)); }
    }
    assert.ok(html);
    assert.equal(html.status, 200);
    assert.equal(html.headers.get("cache-control"), "no-cache");
    assert.equal(html.headers.get("x-frame-options"), "DENY");
    const css = await fetch(`http://127.0.0.1:${port}/styles.css`);
    assert.equal(css.status, 200);
    assert.equal(css.headers.get("cache-control"), "public, max-age=300");
    const js = await fetch(`http://127.0.0.1:${port}/src/app.js`);
    assert.equal(js.status, 200);
    assert.equal(js.headers.get("cache-control"), "public, max-age=300");
  } finally {
    child.kill();
    if (child.exitCode === null && child.signalCode === null) await once(child, "exit");
  }
});
