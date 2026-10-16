// Chatbliz OS: verified-data business briefings and voice-ready narration.
// This module does not synthesize audio, schedule jobs or access customer accounts.
export const BRIEFING_TIMES = Object.freeze(["08:00", "13:00", "19:00"]);
export const TIMEZONE = "Africa/Johannesburg";
const money = n => n == null ? "not verified" : new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(n);
const number = n => n == null ? "not verified" : String(n);
const safe = x => typeof x === "string" ? x.replace(/[<>]/g, "").slice(0, 250) : "";
export function validateReport(report) {
  if (!report || typeof report !== "object") throw new Error("report required");
  for (const key of ["paidRevenueZar", "paidOrders", "confirmedAppointments", "actualReplies", "qualifiedPipelineZar", "issuesFixed"]) {
    if (report[key] !== null && report[key] !== undefined && (!Number.isFinite(report[key]) || report[key] < 0)) throw new Error("invalid " + key);
  }
  if (report.paidRevenueZar != null && report.paymentVerified !== true) throw new Error("payment evidence required");
  if (report.confirmedAppointments != null && report.appointmentsVerified !== true) throw new Error("appointment evidence required");
  return report;
}
export function makeBusinessBriefing(report, { slot = "morning", businessName = "your business" } = {}) {
  validateReport(report);
  if (!["morning", "afternoon", "evening"].includes(slot)) throw new Error("unknown briefing slot");
  const heading = slot === "morning" ? "Morning business briefing" : slot === "afternoon" ? "Afternoon progress briefing" : "Evening business review";
  const lines = [
    heading + " for " + safe(businessName) + ".",
    "Verified paid revenue: " + money(report.paidRevenueZar) + ".",
    "Paid orders: " + number(report.paidOrders) + ".",
    "Actual customer replies: " + number(report.actualReplies) + ".",
    "Customer-confirmed appointments: " + number(report.confirmedAppointments) + ".",
    "Qualified pipeline: " + money(report.qualifiedPipelineZar) + ".",
    "Issues fixed: " + number(report.issuesFixed) + "."
  ];
  if (Array.isArray(report.blockers) && report.blockers.length) lines.push("Blockers: " + report.blockers.slice(0, 3).map(safe).join("; ") + ".");
  if (Array.isArray(report.nextActions) && report.nextActions.length) lines.push("Next priorities: " + report.nextActions.slice(0, 3).map(safe).join("; ") + ".");
  lines.push("Weekly revenue goal: five thousand to twenty thousand rand. This is a target, not a verified result.");
  return { slot, timezone: TIMEZONE, text: lines.join(" "), source: "provided verified data only" };
}
export function slotForLocalHour(hour) {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error("invalid hour");
  return hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
}
