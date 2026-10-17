import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
const port = await new Promise((resolve, reject) => {
  const s = createServer();
  s.once("error", reject);
  s.listen(0, "127.0.0.1", () => {
    const p = s.address().port;
    s.close(() => resolve(p));
  });
});
test("public capabilities report does not claim unavailable services", async () => {
  const child = spawn(process.execPath, ["server.mjs"], {
    cwd: new URL("../", import.meta.url),
    env: { ...process.env, PORT: String(port), NODE_ENV: "production" },
    stdio: "ignore"
  });
  try {
    let response;
    for (let i = 0; i < 40; i++) {
      try { response = await fetch(`http://127.0.0.1:${port}/api/capabilities`); break; }
      catch { await new Promise(r => setTimeout(r, 50)); }
    }
    assert.ok(response, "Server did not start");
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.planning, "local-browser");
    assert.equal(data.aiExecution, "not-connected");
    assert.equal(data.customerAuthentication, "not-connected");
    assert.equal(data.customerTasks, "not-connected");
    const dev = await fetch(`http://127.0.0.1:${port}/api/dev/tasks`);
    assert.equal(dev.status, 404);
    for (const privatePath of [
      "/src/postgres-task-repository.mjs",
      "/src/customer-task-handler.mjs",
      "/src/task-store.mjs",
      "/db/migrations/001_foundation.sql",
      "/scripts/integration/postgres-repository.mjs",
      "/docs/customer-auth-contract.md",
      "/.github/workflows/security.yml"
    ]) {
      const privateResponse = await fetch(`http://127.0.0.1:${port}${privatePath}`);
      assert.equal(privateResponse.status, 404, `Private source exposed: ${privatePath}`);
    }
    const homepage = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(homepage.status, 200);
    assert.match(await homepage.text(), /Chatbliz OS/);

  } finally {
    child.kill();
    if (child.exitCode === null && child.signalCode === null) await once(child, "exit");
  }
});
