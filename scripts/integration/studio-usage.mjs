import assert from "node:assert/strict";
import pg from "pg";
import { createStudioUsageRepository } from "../../src/studio-usage-repository.mjs";

const admin = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const businessId = "88888888-8888-4888-8888-888888888888";
try {
  await admin.query("INSERT INTO businesses (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING", [businessId, "Studio integration test"]);
  // Dedicated worker role provisioning is required in production. CI uses its own temporary database.
  const repository = createStudioUsageRepository({ pool: admin });
  const common = { businessId, capability: "studio.speech", periodKey: "2026-10", limit: 1 };
  const results = await Promise.all([
    repository.reserve({ ...common, requestKey: "studio_race_a" }),
    repository.reserve({ ...common, requestKey: "studio_race_b" })
  ]);
  assert.equal(results.filter(r => r.reserved).length, 1, "Only one concurrent reservation may succeed");
  assert.equal(results.filter(r => !r.reserved).length, 1);
  const winningKey = results[0].reserved ? "studio_race_a" : "studio_race_b";
  const retry = await repository.reserve({ ...common, requestKey: winningKey });
  assert.equal(retry.reused, true);
  assert.equal(retry.reserved, true);
  console.log("Studio PostgreSQL concurrency and idempotency checks passed");
} finally {
  await admin.query("DELETE FROM studio_usage_reservations WHERE business_id=$1", [businessId]);
  await admin.query("DELETE FROM businesses WHERE id=$1", [businessId]);
  await admin.end();
}
