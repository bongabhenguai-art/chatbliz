import { randomUUID } from "node:crypto";

// Must be injected with a dedicated, minimally privileged billing-worker pool.
// All account and plan information must originate from trusted server services.
export function createStudioUsageRepository({ pool }) {
  if (!pool || typeof pool.connect !== "function") throw new TypeError("PostgreSQL pool required");
  return {
    async reserve({ businessId, capability, periodKey, requestKey, limit }) {
      if (typeof businessId !== "string" || !/^[a-f0-9-]{36}$/i.test(businessId)) throw new TypeError("Valid business ID required");
      if (capability !== "studio.speech") throw new TypeError("Unsupported capability");
      if (typeof periodKey !== "string" || !/^\d{4}-\d{2}$/.test(periodKey)) throw new TypeError("Invalid billing period");
      if (typeof requestKey !== "string" || !/^[a-zA-Z0-9_-]{8,128}$/.test(requestKey)) throw new TypeError("Invalid idempotency key");
      if (!Number.isSafeInteger(limit) || limit < 0) throw new TypeError("Finite nonnegative quota required");
      const client = await pool.connect();
      let started = false;
      try {
        await client.query("BEGIN");
        started = true;
        // Serializes concurrent reservations within a business/capability/period.
        await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [businessId + ":" + capability + ":" + periodKey]);
        const prior = await client.query(
          "SELECT id, state, period_key FROM studio_usage_reservations WHERE business_id=$1 AND capability=$2 AND request_key=$3",
          [businessId, capability, requestKey]
        );
        if (prior.rows.length) {
          const record = prior.rows[0];
          if (record.period_key !== periodKey) throw Object.assign(new Error("Request key belongs to another period"), { code: 409 });
          await client.query("COMMIT");
          started = false;
          return { reserved: record.state !== "released", id: record.id, state: record.state, reused: true };
        }
        const usage = await client.query(
          "SELECT count(*)::integer AS total FROM studio_usage_reservations WHERE business_id=$1 AND capability=$2 AND period_key=$3 AND state IN ('reserved','completed')",
          [businessId, capability, periodKey]
        );
        if (Number(usage.rows[0].total) >= limit) {
          await client.query("COMMIT");
          started = false;
          return { reserved: false, reason: "quota_exhausted" };
        }
        const id = randomUUID();
        await client.query(
          "INSERT INTO studio_usage_reservations (id,business_id,capability,period_key,request_key,state) VALUES ($1,$2,$3,$4,$5,'reserved')",
          [id, businessId, capability, periodKey, requestKey]
        );
        await client.query("COMMIT");
        started = false;
        return { reserved: true, id, state: "reserved", reused: false };
      } catch (error) {
        if (started) { try { await client.query("ROLLBACK"); } catch {} }
        throw error;
      } finally {
        client.release();
      }
    }
  };
}
