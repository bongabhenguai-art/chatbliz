import { makeBusinessBriefing } from "../voice-briefings.mjs";
const snapshot = {
  paidRevenueZar: null, paidOrders: null, actualReplies: null, confirmedAppointments: null,
  qualifiedPipelineZar: null, issuesFixed: null,
  blockers: ["Checkout and payment records not connected", "CRM and calendar records not connected"],
  nextActions: ["Verify the official Harry Gwala tender details and eligibility", "Connect approved sales data sources", "Review task engine integration"]
};
let current = "";
function show(slot) {
  const report = makeBusinessBriefing(snapshot, { slot, businessName: "Chatbliz OS" });
  current = report.text;
  document.getElementById("voice-report-text").textContent = current;
}
document.querySelectorAll("[data-voice-slot]").forEach(button => {
  button.addEventListener("click", () => show(button.dataset.voiceSlot));
});
document.getElementById("voice-speak").addEventListener("click", () => {
  if (!("speechSynthesis" in window)) {
    document.getElementById("voice-report-text").textContent = current + " Voice playback is not supported in this browser.";
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(current);
  utterance.lang = "en-ZA";
  utterance.rate = 0.94;
  window.speechSynthesis.speak(utterance);
});
document.getElementById("voice-stop").addEventListener("click", () => {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
});
show("morning");
