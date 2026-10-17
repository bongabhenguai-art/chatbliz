import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";

const STATES = new Set(["queued", "running", "waiting_approval", "completed", "failed", "blocked", "cancelled"]);
const TRANSITIONS = {
  queued: new Set(["running", "blocked", "cancelled"]),
  running: new Set(["waiting_approval", "completed", "failed", "blocked", "cancelled"]),
  waiting_approval: new Set(["running", "cancelled"]),
  blocked: new Set(["queued", "cancelled"]),
  failed: new Set(["queued", "cancelled"]),
  completed: new Set(),
  cancelled: new Set()
};
const clone = value => structuredClone(value);

export function createTaskStore({ filePath }) {
  if (typeof filePath !== "string" || !filePath.trim()) throw new TypeError("filePath is required");
  let queue = Promise.resolve();
  const exclusive = fn => {
    const run = queue.then(fn);
    queue = run.catch(() => {});
    return run;
  };
  async function load() {
    try {
      const data = JSON.parse(await readFile(filePath, "utf8"));
      if (!Array.isArray(data.tasks)) throw new Error("Invalid task database");
      return data;
    } catch (error) {
      if (error.code === "ENOENT") return { tasks: [] };
      throw error;
    }
  }
  async function save(data) {
    await mkdir(dirname(filePath), { recursive: true });
    const temp = `${filePath}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(data, null, 2), { mode: 0o600 });
    await rename(temp, filePath);
  }
  const validateBusiness = businessId => {
    if (typeof businessId !== "string" || !businessId.trim()) throw new TypeError("Authenticated business ID is required");
  };
  return {
    create({ businessId, request, employee = "executive", workspace = "business", idempotencyKey = null }) {
      validateBusiness(businessId);
      if (typeof request !== "string" || !request.trim()) throw new TypeError("Request is required");
      if (idempotencyKey !== null && (typeof idempotencyKey !== "string" || !/^[A-Za-z0-9_-]{8,128}$/.test(idempotencyKey))) throw new TypeError("Invalid idempotency key");
      return exclusive(async () => {
        const db = await load();
        if (idempotencyKey) {
          const previous = db.tasks.find(item => item.businessId === businessId && item.idempotencyKey === idempotencyKey);
          if (previous) {
            if (previous.request !== request.trim()) throw Object.assign(new Error("Idempotency key reused for a different request"), { code: 409 });
            return clone(previous);
          }
        }
        const now = new Date().toISOString();
        const task = {
          id: randomUUID(), businessId, request: request.trim(), employee, workspace, idempotencyKey,
          status: "queued", createdAt: now, updatedAt: now, output: null,
          events: [{ status: "queued", at: now }]
        };
        db.tasks.push(task);
        await save(db);
        return clone(task);
      });
    },
    get({ businessId, taskId }) {
      validateBusiness(businessId);
      return exclusive(async () => {
        const db = await load();
        const task = db.tasks.find(item => item.id === taskId && item.businessId === businessId);
        return task ? clone(task) : null;
      });
    },
    list({ businessId }) {
      validateBusiness(businessId);
      return exclusive(async () => {
        const db = await load();
        return clone(db.tasks.filter(item => item.businessId === businessId));
      });
    },
    transition({ businessId, taskId, status, output = null }) {
      validateBusiness(businessId);
      if (!STATES.has(status)) throw new TypeError("Unknown task status");
      return exclusive(async () => {
        const db = await load();
        const task = db.tasks.find(item => item.id === taskId && item.businessId === businessId);
        if (!task) return null;
        if (!TRANSITIONS[task.status].has(status)) throw new Error(`Invalid transition: ${task.status} -> ${status}`);
        const now = new Date().toISOString();
        task.status = status;
        task.updatedAt = now;
        if (status === "completed") task.output = output;
        task.events.push({ status, at: now });
        await save(db);
        return clone(task);
      });
    }
  };
}
