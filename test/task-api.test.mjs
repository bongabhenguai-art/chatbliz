import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";

async function freePort() {
  return await new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}
async function startServer(env, port) {
  const child = spawn(process.execPath, ["server.mjs"], {
    cwd: new URL("../", import.meta.url),
    env: { ...process.env, ...env, PORT: String(port) },
    stdio: "ignore"
  });
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 80; i++) {
    if (child.exitCode !== null) throw new Error("Server exited before startup");
    try {
      const res = await fetch(`${url}/healthz`);
      if (res.ok) return { child, url };
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  child.kill();
  throw new Error("Server did not become ready");
}
async function stopServer(child) {
  if (child.exitCode !== null) return;
  await new Promise(resolve => {
    child.once("exit", resolve);
    child.kill();
  });
}

test("development task API requires secret and persists after restart", async () => {
  const dir = await mkdtemp(join(tmpdir(), "chatbliz-api-"));
  const port = await freePort();
  const token = "test-only-token-not-for-production-123456789";
  const env = {
    CHATBLIZ_DEV_TASK_TOKEN: token,
    CHATBLIZ_DEV_BUSINESS_ID: "api-test-business",
    CHATBLIZ_TASK_FILE: join(dir, "tasks.json")
  };
  let running;
  try {
    running = await startServer(env, port);
    let response = await fetch(`${running.url}/api/dev/tasks`);
    assert.equal(response.status, 401);
    response = await fetch(`${running.url}/api/dev/tasks`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ request: "Research my business" })
    });
    assert.equal(response.status, 201);
    const { task } = await response.json();
    assert.equal(task.status, "queued");
    response = await fetch(`${running.url}/src/task-store.mjs`);
    assert.equal(response.status, 404);
    await stopServer(running.child);
    running = await startServer(env, port);
    response = await fetch(`${running.url}/api/dev/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).task.request, "Research my business");
  } finally {
    if (running) await stopServer(running.child);
    await rm(dir, { recursive: true, force: true });
  }
});


test("development API is unavailable when NODE_ENV is production", async () => {
  const port = await freePort();
  const running = await startServer({
    NODE_ENV: "production",
    CHATBLIZ_DEV_TASK_TOKEN: "test-only-token-not-for-production-123456789",
    CHATBLIZ_DEV_BUSINESS_ID: "test-business"
  }, port);
  try {
    const response = await fetch(`${running.url}/api/dev/tasks`, {
      headers: { Authorization: "Bearer test-only-token-not-for-production-123456789" }
    });
    assert.equal(response.status, 404);
  } finally {
    await stopServer(running.child);
  }
});
