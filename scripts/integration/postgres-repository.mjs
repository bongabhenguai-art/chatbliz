import assert from "node:assert/strict";
import pg from "pg";
import { randomUUID } from "node:crypto";
import { createPostgresTaskRepository } from "../../src/postgres-task-repository.mjs";

const admin = new pg.Pool();
const businessA = randomUUID(), businessB = randomUUID();
const alice = randomUUID(), bob = randomUUID();
try {
  await admin.query("INSERT INTO businesses(id,name) VALUES($1,'A'),($2,'B')", [businessA, businessB]);
  await admin.query("INSERT INTO app_users(id,identity_provider,provider_subject) VALUES($1,'test','alice'),($2,'test','bob')", [alice, bob]);
  await admin.query("INSERT INTO business_memberships(business_id,user_id,role) VALUES($1,$2,'owner'),($3,$4,'viewer')", [businessA, alice, businessB, bob]);
  await admin.query("CREATE ROLE chatbliz_repository_test LOGIN PASSWORD 'integration_test_only' NOSUPERUSER NOBYPASSRLS");
  await admin.query("GRANT USAGE ON SCHEMA public TO chatbliz_repository_test");
  await admin.query("GRANT SELECT ON businesses,app_users,business_memberships,business_tasks,task_events TO chatbliz_repository_test");
  await admin.query("GRANT INSERT ON business_tasks TO chatbliz_repository_test");
  const pool = new pg.Pool({
    host: process.env.PGHOST, port: Number(process.env.PGPORT),
    database: process.env.PGDATABASE,
    user: "chatbliz_repository_test", password: "integration_test_only"
  });
  try {
    const repo = createPostgresTaskRepository({ pool });
    const first = await repo.create({ userId: alice, businessId: businessA, request: "Generate my business report", idempotencyKey: "report-test-001" });
    assert.equal(first.businessId, businessA);
    assert.equal(first.status, "queued");
    const retry = await repo.create({ userId: alice, businessId: businessA, request: "Generate my business report", idempotencyKey: "report-test-001" });
    assert.equal(retry.id, first.id);
    assert.equal((await repo.list({ userId: alice, businessId: businessA })).length, 1);
    assert.equal((await repo.list({ userId: alice, businessId: businessB })).length, 0);
    assert.equal(await repo.get({ userId: alice, businessId: businessB, taskId: first.id }), null);
    assert.equal((await repo.list({ userId: bob, businessId: businessB })).length, 0);
    await assert.rejects(repo.create({ userId: bob, businessId: businessB, request: "Viewer write" }), /row-level security|policy/i);
    await assert.rejects(repo.create({ userId: alice, businessId: businessA, request: "Different", idempotencyKey: "report-test-001" }), error => error.code === 409);
    console.log("PostgreSQL task repository integration checks passed");
  } finally {
    await pool.end();
  }
} finally {
  await admin.end();
}
