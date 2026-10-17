// Pure policy factory: the caller must provide verified subscription data.
// Never trust plan names, quotas or usage counts supplied by the browser.
const SPEECH_LIMITS = Object.freeze({
  starter: 0,
  professional: 0,
  business: 30,
  enterprise: null
});
export function createStudioEntitlementGate({ getSubscription, getUsage }) {
  if (typeof getSubscription !== "function" || typeof getUsage !== "function") {
    throw new TypeError("Trusted subscription and usage readers are required");
  }
  return async function authorize({ userId, businessId, capability }) {
    if (!userId || !businessId || capability !== "studio.speech") return false;
    const subscription = await getSubscription({ userId, businessId });
    if (!subscription || subscription.status !== "active") return false;
    const plan = String(subscription.plan || "").toLowerCase();
    if (!Object.hasOwn(SPEECH_LIMITS, plan)) return false;
    const limit = SPEECH_LIMITS[plan];
    if (limit === null) return true; // Enterprise still requires separate billing and rate controls.
    if (limit === 0) return false;
    const usage = await getUsage({ businessId, capability, period: "month" });
    if (!Number.isSafeInteger(usage) || usage < 0) return false;
    return usage < limit;
  };
}
