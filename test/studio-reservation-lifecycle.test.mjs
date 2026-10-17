import test from "node:test";
import assert from "node:assert/strict";
import { createStudioReservationLifecycle } from "../src/studio-reservation-lifecycle.mjs";

const ids = { id: "11111111-1111-4111-8111-111111111111", businessId: "22222222-2222-4222-8222-222222222222" };
function poolWithState(initial) {
  let state = initial;
  return {
    get state() { return state; },
    async query(sql) {
      if (sql.startsWith("UPDATE")) {
        if (state !== "reserved") return { rows: [] };
        state = sql.includes("state='completed'") ? "completed" : "released";
        return { rows: [{ state }] };
      }
      return { rows: [{ state }] };
    }
  };
}

test("completes once, retries are idempotent", async () => {
  const pool = poolWithState("reserved");
  const lifecycle = createStudioReservationLifecycle({ pool });
  assert.deepEqual(await lifecycle.complete(ids), { state: "completed", changed: true });
  assert.deepEqual(await lifecycle.complete(ids), { state: "completed", changed: false });
});

test("completed usage cannot be released", async () => {
  const pool = poolWithState("completed");
  const result = await createStudioReservationLifecycle({ pool }).release({ ...ids, confirmedFailure: true });
  assert.deepEqual(result, { state: "completed", changed: false });
});

test("release requires a confirmed failure", async () => {
  const pool = poolWithState("reserved");
  const lifecycle = createStudioReservationLifecycle({ pool });
  await assert.rejects(lifecycle.release({ ...ids, confirmedFailure: false }), TypeError);
  assert.equal(pool.state, "reserved");
  assert.deepEqual(await lifecycle.release({ ...ids, confirmedFailure: true }), { state: "released", changed: true });
});
