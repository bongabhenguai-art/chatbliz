// Read-only business report adapter for the in-memory Chatbliz TaskEngine.
// Sales and payment figures stay unknown until verified provider integrations exist.
export function taskReport(engine, ownerId) {
  if (!engine || typeof engine.list !== "function") throw new Error("task engine required");
  if (typeof ownerId !== "string" || !ownerId.trim()) throw new Error("authenticated owner ID required");
  const tasks = engine.list(ownerId);
  const statuses = Object.fromEntries(["backlog","ready","in_progress","blocked","awaiting_approval","done","cancelled"].map(s=>[s,0]));
  const agents = {};
  for (const task of tasks) {
    statuses[task.status] += 1;
    agents[task.role] = (agents[task.role] || 0) + 1;
  }
  const active = tasks.filter(t=>["ready","in_progress","blocked","awaiting_approval"].includes(t.status));
  const nextActions = active.slice(0,3).map(t=>t.role + ": " + t.title);
  return {
    taskSummary: { total:tasks.length, statuses, agents },
    paidRevenueZar:null, paidOrders:null, actualReplies:null,
    confirmedAppointments:null, qualifiedPipelineZar:null,
    issuesFixed:null,
    blockers:["Payment records not connected", "CRM replies and customer confirmations not connected"],
    nextActions,
    verified:false
  };
}
