/**
 * Chatbliz publishing requests: pure, dependency-free validation.
 * Never put publisher API tokens in browser code.
 */
export const PUBLISH_TARGETS = Object.freeze(["github-pages", "coolify", "dokploy"]);
const repoPattern = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
const domainPattern = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
export function validatePublishRequest(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Publishing request must be an object.");
  const { repository, branch = "main", target, domain, approved } = value;
  if (typeof repository !== "string" || !repoPattern.test(repository)) throw new Error("Repository must be owner/name.");
  if (typeof branch !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,150}$/.test(branch) || branch.includes("..") || branch.includes("//") || branch.endsWith("/")) throw new Error("Invalid Git branch.");
  if (!PUBLISH_TARGETS.includes(target)) throw new Error("Unsupported publishing target.");
  if (domain !== undefined && (typeof domain !== "string" || !domainPattern.test(domain))) throw new Error("Invalid domain.");
  if (approved !== true) throw new Error("Owner approval is required.");
  return Object.freeze({ repository, branch, target, ...(domain ? { domain: domain.toLowerCase() } : {}), status: "validated-not-deployed" });
}
export function publishChecklist(value) {
  const request = validatePublishRequest(value);
  return Object.freeze({
    ...request,
    checks: ["repository-access", "owner-authorization", "tests", "dependency-audit", "secret-scan", "build", "tls-and-health-check"],
    execution: "requires-server-side-publisher-and-credentials"
  });
}
