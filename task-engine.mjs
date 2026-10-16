// Chatbliz OS task engine — dependency-free, explicit owner-controlled transitions.
// In-memory prototype: integrate durable tenant-scoped persistence and authentication before production.
import { randomUUID } from "node:crypto";

export const STATUSES = Object.freeze(["backlog", "ready", "in_progress", "blocked", "awaiting_approval", "done", "cancelled"]);
export const ROLES = Object.freeze(["Hunting", "Fishing", "Closer", "Design Influence", "Studio", "Fixer", "Legal Support", "Research"]);
const transitions = {
  backlog: ["ready", "cancelled"], ready: ["in_progress", "blocked", "cancelled"],
  in_progress: ["blocked", "awaiting_approval", "done", "cancelled"],
  blocked: ["ready", "cancelled"], awaiting_approval: ["in_progress", "done", "cancelled"],
  done: [], cancelled: []
};
const actionKinds = new Set(["send_message", "submit_tender", "book_appointment", "publish", "collect_payment"]);
const allowed = (x, arr) => arr.includes(x);
const nonempty = x => typeof x === "string" && x.trim().length > 0;
const iso = x => typeof x === "string" && Number.isFinite(Date.parse(x));

export class TaskEngine {
  #tasks = new Map();
  #events = [];
  constructor({ clock = () => new Date().toISOString(), id = randomUUID } = {}) {
    this.clock = clock; this.id = id;
  }
  create(input, actor = "owner") {
    if (!nonempty(input?.title) || !nonempty(input?.ownerId)) throw new Error("title and ownerId required");
    if (!allowed(input.role, ROLES)) throw new Error("unknown agent role");
    if (input.deadline && !iso(input.deadline)) throw new Error("invalid deadline");
    const task = {
      id: this.id(), ownerId: input.ownerId, title: input.title.trim(), role: input.role,
      status: "backlog", sourceUrl: input.sourceUrl ?? null, deadline: input.deadline ?? null,
      evidence: [], customerConsent: false, customerConfirmed: false,
      qualifiedPipelineZar: null, paidRevenueZar: null,
      createdAt: this.clock(), updatedAt: this.clock()
    };
    this.#tasks.set(task.id, task);
    this.#log(task, "created", actor);
    return structuredClone(task);
  }
  get(id, ownerId) {
    const task = this.#tasks.get(id);
    if (!task || task.ownerId !== ownerId) throw new Error("task not found");
    return structuredClone(task);
  }
  list(ownerId) { return [...this.#tasks.values()].filter(t => t.ownerId === ownerId).map(t => structuredClone(t)); }
  transition(id, ownerId, status, actor = "owner") {
    const task = this.#owned(id, ownerId);
    if (!allowed(status, transitions[task.status])) throw new Error("invalid status transition");
    task.status = status; task.updatedAt = this.clock(); this.#log(task, "status:" + status, actor);
    return structuredClone(task);
  }
  attachEvidence(id, ownerId, { url, note }, actor = "owner") {
    const task = this.#owned(id, ownerId);
    if (!nonempty(note) || !nonempty(url) || !/^https:\/\//.test(url)) throw new Error("https evidence URL and note required");
    task.evidence.push({ url, note, at: this.clock() }); task.updatedAt = this.clock();
    this.#log(task, "evidence", actor); return structuredClone(task);
  }
  recordQualification(id, ownerId, { consent, confirmed, pipelineZar }, actor = "owner") {
    const task = this.#owned(id, ownerId);
    if (typeof consent !== "boolean" || typeof confirmed !== "boolean") throw new Error("explicit consent and confirmation required");
    if (pipelineZar != null && (!Number.isFinite(pipelineZar) || pipelineZar < 0)) throw new Error("invalid pipeline amount");
    if (pipelineZar != null && (!consent || !confirmed || !task.evidence.length)) throw new Error("qualification requires consent, confirmed interest and evidence");
    task.customerConsent = consent; task.customerConfirmed = confirmed;
    task.qualifiedPipelineZar = consent && confirmed ? (pipelineZar ?? null) : null;
    task.updatedAt = this.clock(); this.#log(task, "qualification", actor);
    return structuredClone(task);
  }
  requestExternalAction(id, ownerId, kind, actor = "owner") {
    const task = this.#owned(id, ownerId);
    if (!actionKinds.has(kind)) throw new Error("unknown external action");
    if (["send_message", "book_appointment"].includes(kind) && !task.customerConsent) throw new Error("consent required");
    if (kind === "book_appointment" && !task.customerConfirmed) throw new Error("customer confirmation required");
    if (task.status !== "in_progress") throw new Error("task must be in progress");
    task.status = "awaiting_approval"; task.updatedAt = this.clock();
    this.#log(task, "approval_requested:" + kind, actor);
    // Approval requests are not execution. External adapters must separately verify owner approval.
    return { task: structuredClone(task), kind, executed: false };
  }
  events(ownerId) { return this.#events.filter(e => e.ownerId === ownerId).map(e => structuredClone(e)); }
  #owned(id, ownerId) {
    const task = this.#tasks.get(id);
    if (!task || task.ownerId !== ownerId) throw new Error("task not found");
    return task;
  }
  #log(task, action, actor) {
    this.#events.push({ taskId: task.id, ownerId: task.ownerId, action, actor, at: this.clock() });
  }
}
