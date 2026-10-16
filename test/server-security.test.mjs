import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as sleep } from "node:timers/promises";

test("server serves app and health but not private files", { timeout: 12000 }, async () => {
  const port = 31000 + Math.floor(Math.random() * 20000);
  const child = spawn(process.execPath, ["server.mjs"], { env: { ...process.env, PORT: String(port) }, stdio: ["ignore", "pipe", "pipe"] });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 50; attempt++) {
      if (child.exitCode !== null) throw new Error("Server exited unexpectedly");
      try {
        const response = await fetch(`http://127.0.0.1:${port}/healthz`);
        if (response.ok) { ready = true; break; }
      } catch {}
      await sleep(100);
    }
    assert.equal(ready, true, "Server did not start");
    const root = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(root.status, 200);
    const module = await fetch(`http://127.0.0.1:${port}/src/app.js`);
    assert.equal(module.status, 200);
    for (const path of ["/server.mjs", "/package.json", "/.github/workflows/security.yml", "/src/publisher-gateway.mjs", "/docs/PUBLISHING-ENGINE.md"]) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`);
      assert.equal(response.status, 404, `${path} should not be publicly served`);
    }
  } finally {
    child.kill();
    await Promise.race([once(child, "exit").catch(() => {}), sleep(1000)]);
  }
});
