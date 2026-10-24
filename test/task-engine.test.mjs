import test from "node:test";
import assert from "node:assert/strict";
import { TaskEngine } from "../task-engine.mjs";
const setup = () => new TaskEngine({ id: () => "task-1", clock: () => "2026-10-16T10:00:00.000Z" });
const create = e => e.create({ ownerId: "tenant-a", title: "Verify procurement eligibility", role: "Hunting" });
test("creates tenant-scoped task and immutable output", () => {
  const e = setup(); const t = create(e);
  assert.equal(t.status, "backlog"); t.title = "tampered";
  assert.equal(e.get(t.id, "tenant-a").title, "Verify procurement eligibility");
  assert.throws(() => e.get(t.id, "tenant-b"), /not found/);
});
test("enforces status transitions", () => {
  const e = setup(); create(e);
  assert.throws(() => e.transition("task-1", "tenant-a", "done"), /invalid/);
  e.transition("task-1", "tenant-a", "ready");
  e.transition("task-1", "tenant-a", "in_progress");
  assert.equal(e.transition("task-1", "tenant-a", "done").status, "done");
});
test("cannot invent pipeline without consent, interest and evidence", () => {
  const e = setup(); create(e);
  assert.throws(() => e.recordQualification("task-1", "tenant-a", { consent: true, confirmed: true, pipelineZar: 5000 }), /evidence/);
  e.attachEvidence("task-1", "tenant-a", { url: "https://example.org/tender", note: "Official listing" });
  assert.throws(() => e.recordQualification("task-1", "tenant-a", { consent: false, confirmed: true, pipelineZar: 5000 }), /requires/);
  assert.equal(e.recordQualification("task-1", "tenant-a", { consent: true, confirmed: true, pipelineZar: 5000 }).qualifiedPipelineZar, 5000);
});
test("external actions are approval requests, not execution", () => {
  const e = setup(); create(e);
  e.transition("task-1", "tenant-a", "ready"); e.transition("task-1", "tenant-a", "in_progress");
  assert.throws(() => e.requestExternalAction("task-1", "tenant-a", "book_appointment"), /consent/);
  e.recordQualification("task-1", "tenant-a", { consent: true, confirmed: false, pipelineZar: null });
  assert.throws(() => e.requestExternalAction("task-1", "tenant-a", "book_appointment"), /confirmation/);
  e.recordQualification("task-1", "tenant-a", { consent: true, confirmed: true, pipelineZar: null });
  const action = e.requestExternalAction("task-1", "tenant-a", "book_appointment");
  assert.equal(action.executed, false); assert.equal(action.task.status, "awaiting_approval");
});
