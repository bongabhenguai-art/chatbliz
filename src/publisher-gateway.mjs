import { validatePublishRequest } from "./publishing.mjs";

export function createPublisher({ fetchImpl = globalThis.fetch, environment = process.env } = {}) {
  if (typeof fetchImpl !== "function") throw new Error("Server-side fetch is required.");
  return async function publish(input) {
    const request = validatePublishRequest(input);
    if (request.target === "github-pages") {
      throw new Error("GitHub Pages deploys through the authorized GitHub Actions workflow; no server-side trigger is configured.");
    }
    const url = environment.CHATBLIZ_PUBLISHER_URL;
    const token = environment.CHATBLIZ_PUBLISHER_TOKEN;
    if (!url || !token) throw new Error("Publisher server URL and token must be configured securely.");
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.search || parsed.hash) {
      throw new Error("Publisher URL must be a clean HTTPS endpoint.");
    }
    const configuredTarget = environment.CHATBLIZ_PUBLISHER_TARGET;
    if (configuredTarget !== request.target) throw new Error("Publishing target is not configured for this server.");
    // This adapter calls an operator-controlled gateway, not an arbitrary customer-supplied URL.
    // The gateway must implement authentication, tenant authorization and target-specific deployment.
    const response = await fetchImpl(new URL("/v1/deployments", parsed.origin), {
      method: "POST",
      headers: {
        "authorization": `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        repository: request.repository,
        branch: request.branch,
        target: request.target,
        ...(request.domain ? { domain: request.domain } : {})
      }),
      signal: AbortSignal.timeout(20000)
    });
    if (!response.ok) throw new Error(`Publisher gateway returned HTTP ${response.status}`);
    const result = await response.json();
    if (!result || typeof result.deploymentId !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(result.deploymentId)) {
      throw new Error("Publisher gateway returned an invalid deployment ID.");
    }
    return { deploymentId: result.deploymentId, status: "submitted-unverified", target: request.target };
  };
}
