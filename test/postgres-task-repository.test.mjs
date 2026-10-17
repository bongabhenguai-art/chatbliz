import test from "node:test";
import assert from "node:assert/strict";
import { createPostgresTaskRepository } from "../src/postgres-task-repository.mjs";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const T = "33333333-3333-4333-8333-333333333333";
function mockPool(handler = () => ({ rows: [] })) {
  const calls = [];
  let releases = 0;
  return {
    calls,
    get releases() { return releases; },
    connect: async () => ({
      query: async (sql, args) => {
        calls.push({ sql, args });
        return handler(sql, args);
      },
      release: () => { releases++; }
    })
  };
}
test("scopes list to verified user and business inside a transaction", async () => {
  const pool = mockPool();
  const repo = createPostgresTaskRepository({ pool });
  assert.deepEqual(await repo.list({ userId: A, businessId: B }), []);
  assert.equal(pool.calls[0].sql, "BEGIN");
  assert.deepEqual(pool.calls[1].args, [A, B]);
  assert.match(pool.calls[2].sql, /WHERE business_id = \$1/);
  assert.deepEqual(pool.calls[2].args, [B, 50]);
  assert.equal(pool.calls[3].sql, "COMMIT");
  assert.equal(pool.releases, 1);
});
test("invalid identity is rejected before connecting", async () => {
  const pool = mockPool();
  const repo = createPostgresTaskRepository({ pool });
  await assert.rejects(repo.list({ userId: "browser-supplied", businessId: B }), TypeError);
  assert.equal(pool.calls.length, 0);
});
test("database failures roll back and release the connection", async () => {
  const pool = mockPool(sql => {
    if (sql.startsWith("SELECT * FROM business_tasks")) throw new Error("database failure");
    return { rows: [] };
  });
  const repo = createPostgresTaskRepository({ pool });
  await assert.rejects(repo.get({ userId: A, businessId: B, taskId: T }), /database failure/);
  assert.equal(pool.calls.at(-1).sql, "ROLLBACK");
  assert.equal(pool.releases, 1);
});
test("idempotency conflict rejects changed request", async () => {
  const row = { id: T, business_id: B, request: "First", employee: "executive", workspace: "business" };
  const pool = mockPool(sql => {
    if (sql.includes("INSERT INTO business_tasks")) return { rows: [] };
    if (sql.includes("SELECT * FROM business_tasks")) return { rows: [row] };
    return { rows: [] };
  });
  const repo = createPostgresTaskRepository({ pool });
  await assert.rejects(
    repo.create({ userId: A, businessId: B, request: "Different", idempotencyKey: "retry-key-001" }),
    error => error.code === 409
  );
  assert.equal(pool.calls.at(-1).sql, "ROLLBACK");
});
