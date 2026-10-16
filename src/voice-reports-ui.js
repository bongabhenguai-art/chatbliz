import { createLead, updateLead, leadSummary, readLeads, saveLeads } from "./business-crm.js";
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

const crmKey = "chatbliz:leads:local-preview";
let leads = readLeads(crmKey, ownerId);
const crmPanel = document.createElement("section");
const crmHeading = document.createElement("h3"); crmHeading.textContent = "Customer pipeline · local preview";
const crmForm = document.createElement("form");
const customerName = document.createElement("input"); customerName.placeholder="Customer name";customerName.required=true;customerName.maxLength=120;customerName.setAttribute("aria-label","Customer name");
const customerNeed = document.createElement("input");customerNeed.placeholder="Customer business need";customerNeed.required=true;customerNeed.maxLength=500;customerNeed.setAttribute("aria-label","Customer need");
const customerValue = document.createElement("input");customerValue.type="number";customerValue.min="0";customerValue.step="0.01";customerValue.placeholder="Estimated value R";customerValue.setAttribute("aria-label","Estimated rand value");
const consentLabel=document.createElement("label");
const customerConsent=document.createElement("input");customerConsent.type="checkbox";
consentLabel.append(customerConsent,document.createTextNode(" Customer agreed to contact and local record keeping"));
const saveCustomer=document.createElement("button");saveCustomer.type="submit";saveCustomer.textContent="Save customer";
crmForm.append(customerName,customerNeed,customerValue,consentLabel,saveCustomer);
const crmTotals=document.createElement("p");
const crmRows=document.createElement("div");
crmPanel.append(crmHeading,crmForm,crmTotals,crmRows);
section.append(crmPanel);
function renderCustomers(){
  const stats=leadSummary(leads,ownerId);
  crmTotals.textContent="Saved customers: "+stats.total+" · Confirmed qualified leads: "+stats.qualified+" · Estimated qualified pipeline: R"+stats.qualifiedPipelineZar.toLocaleString("en-ZA")+" (not revenue)";
  crmRows.replaceChildren();
  for(const lead of leads){
    const line=document.createElement("div");
    const label=document.createElement("span");label.textContent=lead.name+" — "+lead.need+" — "+lead.stage+" ";
    line.append(label);
    if(lead.stage==="new"){
      const confirm=document.createElement("button");confirm.type="button";confirm.textContent="Confirm interest";
      confirm.addEventListener("click",()=>{
        if(!window.confirm("Has this customer genuinely confirmed interest?"))return;
        leads=leads.map(l=>l.id===lead.id?updateLead(l,"qualified",{customerConfirmed:true}):l);
        saveLeads(crmKey,ownerId,leads);renderCustomers();show(slot);
      });
      line.append(confirm);
    }
    crmRows.append(line);
  }
}
crmForm.addEventListener("submit",event=>{
  event.preventDefault();
  try{
    leads=[...leads,createLead({ownerId,name:customerName.value,need:customerNeed.value,consent:customerConsent.checked,estimatedValueZar:Number(customerValue.value||0)})];
    saveLeads(crmKey,ownerId,leads);crmForm.reset();renderCustomers();show(slot);
  }catch(error){output.textContent=error.message;}
});
renderCustomers();
