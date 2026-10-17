import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { createStudioUsageRepository } from "../../src/studio-usage-repository.mjs";
import { createStudioReservationLifecycle } from "../../src/studio-reservation-lifecycle.mjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const businessId = randomUUID();
const periodKey = "2026-10";
try {
  await pool.query("INSERT INTO businesses (id,name) VALUES ($1,$2)", [businessId, "Lifecycle test"]);
  const reservations = createStudioUsageRepository({ pool });
  const lifecycle = createStudioReservationLifecycle({ pool });
  const common = { businessId, capability: "studio.speech", periodKey, limit: 2 };
  const first = await reservations.reserve({ ...common, requestKey: "lifecycle_success_001" });
  assert.equal(first.reserved, true);
  assert.deepEqual(await lifecycle.complete({ id: first.id, businessId }), { state: "completed", changed: true });
  assert.deepEqual(await lifecycle.complete({ id: first.id, businessId }), { state: "completed", changed: false });
  assert.deepEqual(await lifecycle.release({ id: first.id, businessId, confirmedFailure: true }), { state: "completed", changed: false });
  const second = await reservations.reserve({ ...common, requestKey: "lifecycle_failure_002" });
  assert.equal(second.reserved, true);
  await assert.rejects(lifecycle.release({ id: second.id, businessId, confirmedFailure: false }), TypeError);
  assert.deepEqual(await lifecycle.release({ id: second.id, businessId, confirmedFailure: true }), { state: "released", changed: true });
  const third = await reservations.reserve({ ...common, requestKey: "lifecycle_replacement_003" });
  assert.equal(third.reserved, true, "released usage must free quota");
  const denied = await reservations.reserve({ ...common, requestKey: "lifecycle_denied_004" });
  assert.equal(denied.reserved, false, "completed and reserved usage consume quota");
  console.log("Studio lifecycle database integration checks passed");
} finally {
  await pool.query("DELETE FROM studio_usage_reservations WHERE business_id=$1", [businessId]);
  await pool.query("DELETE FROM businesses WHERE id=$1", [businessId]);
  await pool.end();
}
