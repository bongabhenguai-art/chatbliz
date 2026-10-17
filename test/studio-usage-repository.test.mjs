import test from "node:test";
import assert from "node:assert/strict";
import { createStudioUsageRepository } from "../src/studio-usage-repository.mjs";

const params = {
  businessId: "11111111-1111-4111-8111-111111111111",
  capability: "studio.speech",
  periodKey: "2026-10",
  requestKey: "request_0001",
  limit: 1
};

function fakePool({ existing = [], total = 0 } = {}) {
  const calls = [];
  const client = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql.startsWith("SELECT id, state")) return { rows: existing };
      if (sql.startsWith("SELECT count")) return { rows: [{ total }] };
      return { rows: [] };
    },
    release() { calls.push({ sql: "RELEASE" }); }
  };
  return { calls, connect: async () => client };
}

test("reservation locks transaction and inserts before committing", async () => {
  const pool = fakePool();
  const result = await createStudioUsageRepository({ pool }).reserve(params);
  assert.equal(result.reserved, true);
  const statements = pool.calls.map(c => c.sql);
  assert.equal(statements[0], "BEGIN");
  assert.ok(statements[1].includes("pg_advisory_xact_lock"));
  assert.ok(statements.some(s => s.startsWith("INSERT INTO studio_usage_reservations")));
  assert.ok(statements.indexOf("COMMIT") > statements.findIndex(s => s.startsWith("INSERT")));
  assert.equal(statements.at(-1), "RELEASE");
});

test("exhausted quota does not insert another reservation", async () => {
  const pool = fakePool({ total: 1 });
  const result = await createStudioUsageRepository({ pool }).reserve(params);
  assert.deepEqual(result, { reserved: false, reason: "quota_exhausted" });
  assert.equal(pool.calls.some(c => c.sql.startsWith("INSERT")), false);
});

test("retries return existing reservation without double charging", async () => {
  const pool = fakePool({ existing: [{ id: "prior", state: "completed", period_key: "2026-10" }] });
  const result = await createStudioUsageRepository({ pool }).reserve(params);
  assert.deepEqual(result, { reserved: true, id: "prior", state: "completed", reused: true });
  assert.equal(pool.calls.some(c => c.sql.startsWith("INSERT")), false);
});

test("invalid quotas and identifiers fail before database access", async () => {
  const pool = fakePool();
  const repo = createStudioUsageRepository({ pool });
  await assert.rejects(repo.reserve({ ...params, limit: -1 }), TypeError);
  await assert.rejects(repo.reserve({ ...params, businessId: "invalid" }), TypeError);
  assert.equal(pool.calls.length, 0);
});
