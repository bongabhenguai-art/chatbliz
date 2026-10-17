import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTaskStore } from "../src/task-store.mjs";

test("tasks persist, transition, and isolate businesses", async () => {
  const dir = await mkdtemp(join(tmpdir(), "chatbliz-tasks-"));
  try {
    const filePath = join(dir, "tasks.json");
    const store = createTaskStore({ filePath });
    const task = await store.create({ businessId: "business-a", request: "Check my online presence" });
    assert.equal(task.status, "queued");
    assert.equal(await store.get({ businessId: "business-b", taskId: task.id }), null);
    await store.transition({ businessId: "business-a", taskId: task.id, status: "running" });
    await store.transition({ businessId: "business-a", taskId: task.id, status: "completed", output: { report: "Draft report" } });
    const restarted = createTaskStore({ filePath });
    const saved = await restarted.get({ businessId: "business-a", taskId: task.id });
    assert.equal(saved.status, "completed");
    assert.deepEqual(saved.output, { report: "Draft report" });
    assert.equal(saved.events.length, 3);
    await assert.rejects(restarted.transition({ businessId: "business-a", taskId: task.id, status: "running" }), /Invalid transition/);
    assert.deepEqual(await restarted.list({ businessId: "business-b" }), []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("serializes concurrent writes without losing tasks", async () => {
  const dir = await mkdtemp(join(tmpdir(), "chatbliz-tasks-"));
  try {
    const store = createTaskStore({ filePath: join(dir, "tasks.json") });
    await Promise.all(Array.from({ length: 12 }, (_, i) => store.create({ businessId: "b", request: `Request ${i}` })));
    assert.equal((await store.list({ businessId: "b" })).length, 12);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
