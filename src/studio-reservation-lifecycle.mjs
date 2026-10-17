// Trusted billing-worker operations. Caller must verify provider outcome first.
// Do not release reservations after ambiguous network timeouts.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function createStudioReservationLifecycle({ pool }) {
  if (!pool || typeof pool.query !== "function") throw new TypeError("Billing worker pool required");
  return {
    async complete({ id, businessId }) {
      if (!UUID.test(id) || !UUID.test(businessId)) throw new TypeError("Valid IDs required");
      const result = await pool.query(
        "UPDATE studio_usage_reservations SET state='completed' WHERE id=$1 AND business_id=$2 AND state='reserved' RETURNING id, state",
        [id, businessId]
      );
      if (result.rows.length) return { state: "completed", changed: true };
      return current(pool, id, businessId);
    },
    async release({ id, businessId, confirmedFailure }) {
      if (!UUID.test(id) || !UUID.test(businessId)) throw new TypeError("Valid IDs required");
      if (confirmedFailure !== true) throw new TypeError("Confirmed provider failure required to release usage");
      const result = await pool.query(
        "UPDATE studio_usage_reservations SET state='released' WHERE id=$1 AND business_id=$2 AND state='reserved' RETURNING id, state",
        [id, businessId]
      );
      if (result.rows.length) return { state: "released", changed: true };
      return current(pool, id, businessId);
    }
  };
}
async function current(pool, id, businessId) {
  const result = await pool.query(
    "SELECT state FROM studio_usage_reservations WHERE id=$1 AND business_id=$2",
    [id, businessId]
  );
  if (!result.rows.length) return { state: "not_found", changed: false };
  return { state: result.rows[0].state, changed: false };
}
