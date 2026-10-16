import { makeBusinessBriefing } from "../voice-briefings.mjs";
import { createTask, summarizeTasks, readTasks, saveTasks, transitionTask } from "./business-tasks.js";

const context = {
  blockers: ["Payment, CRM and calendar providers are not connected"],
  nextActions: ["Verify Harry Gwala tender eligibility from official documents", "Connect approved sales data sources"]
};
const ownerId = "local-preview"; // Only local browser demo; replace with authenticated tenant identity.
const storeKey = "chatbliz:tasks:local-preview";
let current = "";
let slot = "morning";
const output = document.getElementById("voice-report-text");
const taskList = document.createElement("div");
taskList.id = "voice-task-list";
const section = document.getElementById("voice-business-reports");
const controls = document.createElement("div");
const title = document.createElement("input");
title.type = "text"; title.maxLength = 140; title.placeholder = "New business task"; title.setAttribute("aria-label", "Task title");
const role = document.createElement("select");
role.setAttribute("aria-label", "Assigned AI employee");
for (const name of ["Hunting","Fishing","Closer","Design Influence","Studio","Fixer","Legal Support","Research"]) {
  const option = document.createElement("option"); option.value = name; option.textContent = name; role.append(option);
}
const add = document.createElement("button"); add.type = "button"; add.textContent = "Add task";
controls.append(title, role, add);
section.append(controls, taskList);
let tasks = readTasks(storeKey, ownerId);

function renderTasks() {
  taskList.replaceChildren();
  const heading = document.createElement("h3"); heading.textContent = "My Business tasks (saved on this device)"; taskList.append(heading);
  if (!tasks.length) { const p = document.createElement("p"); p.textContent = "No local tasks yet."; taskList.append(p); }
  for (const task of tasks) {
    const row = document.createElement("div");
    const label = document.createElement("span");
    label.textContent = task.title + " — " + task.role + " — " + task.status + " ";
    row.append(label);
    if (task.status === "backlog" || task.status === "ready" || task.status === "in_progress") {
      const button = document.createElement("button");
      button.type = "button";
      const next = task.status === "backlog" ? "ready" : task.status === "ready" ? "in_progress" : "done";
      button.textContent = "Mark " + next.replaceAll("_", " ");
      button.addEventListener("click", () => {
        tasks = tasks.map(t => t.id === task.id ? transitionTask(t, next) : t);
        saveTasks(storeKey, ownerId, tasks); renderTasks(); show(slot);
      });
      row.append(button);
    }
    taskList.append(row);
  }
}
function show(nextSlot) {
  slot = nextSlot;
  const summary = summarizeTasks(tasks);
  const snapshot = {
    paidRevenueZar: null, paidOrders: null, actualReplies: null, confirmedAppointments: null,
    qualifiedPipelineZar: null, issuesFixed: null,
    blockers: context.blockers,
    nextActions: [...context.nextActions, summary.pending + " local tasks awaiting completion"]
  };
  const report = makeBusinessBriefing(snapshot, { slot, businessName: "Chatbliz OS" });
  current = report.text + " Local tasks: " + summary.total + ". Completed local tasks: " + summary.completed + ". These are planning records, not verified production fixes.";
  output.textContent = current;
}
add.addEventListener("click", () => {
  try {
    const task = createTask({ title: title.value, role: role.value, ownerId });
    tasks = [...tasks, task]; saveTasks(storeKey, ownerId, tasks);
    title.value = ""; renderTasks(); show(slot);
  } catch (error) { output.textContent = error.message; }
});
document.querySelectorAll("[data-voice-slot]").forEach(button => button.addEventListener("click", () => show(button.dataset.voiceSlot)));
document.getElementById("voice-speak").addEventListener("click", () => {
  if (!("speechSynthesis" in window)) { output.textContent = current + " Voice playback is unavailable in this browser."; return; }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(current);
  utterance.lang = "en-ZA"; utterance.rate = 0.94; window.speechSynthesis.speak(utterance);
});
document.getElementById("voice-stop").addEventListener("click", () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); });
renderTasks(); show("morning");
