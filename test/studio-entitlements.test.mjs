import test from "node:test";
import assert from "node:assert/strict";
import { createStudioEntitlementGate } from "../src/studio-entitlements.mjs";

const identity = { userId: "verified-user", businessId: "verified-business", capability: "studio.speech" };
function gate(plan, status, usage) {
  return createStudioEntitlementGate({
    getSubscription: async () => ({ plan, status }),
    getUsage: async () => usage
  });
}

test("inactive subscriptions cannot generate speech", async () => {
  assert.equal(await gate("enterprise", "canceled", 0)(identity), false);
});
test("starter and professional plans have no speech quota in this policy", async () => {
  assert.equal(await gate("starter", "active", 0)(identity), false);
  assert.equal(await gate("professional", "active", 0)(identity), false);
});
test("business tier is limited to 30 monthly requests", async () => {
  assert.equal(await gate("business", "active", 29)(identity), true);
  assert.equal(await gate("business", "active", 30)(identity), false);
});
test("rejects invalid usage, unknown plans and missing identity", async () => {
  assert.equal(await gate("business", "active", -1)(identity), false);
  assert.equal(await gate("unknown", "active", 0)(identity), false);
  assert.equal(await gate("enterprise", "active", 0)({ ...identity, businessId: "" }), false);
});
