import { randomUUID } from "node:crypto";

// The pool is injected by the server after configuring a real PostgreSQL driver.
// This module never reads database credentials or accepts browser-supplied identities.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KEY = /^[A-Za-z0-9_-]{8,128}$/;
function identity(value, label) {
  if (typeof value !== "string" || !UUID.test(value)) throw new TypeError(`Invalid ${label}`);
  return value;
}
function toTask(row) {
  return row ? {
    id: row.id, businessId: row.business_id, request: row.request,
    employee: row.employee, workspace: row.workspace, status: row.status,
    idempotencyKey: row.idempotency_key,
    output: row.output, createdAt: row.created_at, updatedAt: row.updated_at
  } : null;
}
export function createPostgresTaskRepository({ pool }) {
  if (!pool || typeof pool.connect !== "function") throw new TypeError("A PostgreSQL pool is required");
  async function scoped({ userId, businessId }, action) {
    identity(userId, "authenticated user ID");
    identity(businessId, "authorized business ID");
    const client = await pool.connect();
    let begun = false;
    try {
      await client.query("BEGIN");
      begun = true;
      await client.query("SELECT set_config('app.user_id', $1, true), set_config('app.business_id', $2, true)", [userId, businessId]);
      const result = await action(client);
      await client.query("COMMIT");
      begun = false;
      return result;
    } catch (error) {
      if (begun) {
        try { await client.query("ROLLBACK"); } catch { /* preserve original failure */ }
      }
      throw error;
    } finally {
      client.release();
    }
  }
  return {
    async create({ userId, businessId, request, employee = "executive", workspace = "business", idempotencyKey = null }) {
      if (typeof request !== "string" || request.trim().length < 1 || request.trim().length > 4000) throw new TypeError("Request must contain 1-4000 characters");
      if (idempotencyKey !== null && (typeof idempotencyKey !== "string" || !KEY.test(idempotencyKey))) throw new TypeError("Invalid idempotency key");
      if (typeof employee !== "string" || !employee.trim() || typeof workspace !== "string" || !workspace.trim()) throw new TypeError("Invalid task assignment");
      return scoped({ userId, businessId }, async client => {
        const id = randomUUID();
        const result = await client.query(
          `INSERT INTO business_tasks (id, business_id, request, employee, workspace, idempotency_key)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (business_id, idempotency_key) DO NOTHING
           RETURNING *`,
          [id, businessId, request.trim(), employee, workspace, idempotencyKey]
        );
        if (result.rows.length) return toTask(result.rows[0]);
        // The unique constraint guarantees a single row for each business/key.
        const existing = await client.query(
          "SELECT * FROM business_tasks WHERE business_id = $1 AND idempotency_key = $2",
          [businessId, idempotencyKey]
        );
        const row = existing.rows[0];
        if (!row) throw new Error("Idempotent task could not be retrieved");
        if (row.request !== request.trim() || row.employee !== employee || row.workspace !== workspace) {
          throw Object.assign(new Error("Idempotency key reused for a different task"), { code: 409 });
        }
        return toTask(row);
      });
    },
    get({ userId, businessId, taskId }) {
      identity(taskId, "task ID");
      return scoped({ userId, businessId }, async client => {
        const result = await client.query(
          "SELECT * FROM business_tasks WHERE id = $1 AND business_id = $2",
          [taskId, businessId]
        );
        return toTask(result.rows[0]);
      });
    },
    list({ userId, businessId, limit = 50 }) {
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new TypeError("Limit must be between 1 and 100");
      return scoped({ userId, businessId }, async client => {
        const result = await client.query(
          "SELECT * FROM business_tasks WHERE business_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2",
          [businessId, limit]
        );
        return result.rows.map(toTask);
      });
    }
  };
}
