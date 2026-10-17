import { PACKAGES, PARTNERS, PRODUCTS, preparePlan } from "./domain.mjs";

const byId = id => document.getElementById(id);
const partnerList = byId("partner-list");
const productGrid = byId("product-grid");
const planGrid = byId("plan-grid");
const thread = byId("chat-thread");
const input = byId("message-input");
let selectedPartner = null;
const HISTORY_KEY = "chatbliz-local-chat-v1";
let history = [];
try {
  const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  if (Array.isArray(stored)) history = stored.filter(m => ["user", "assistant"].includes(m?.role) && typeof m.text === "string" && m.text.length <= 8000).slice(-80);
} catch { /* storage unavailable */ }
function remember(role, text, status) {
  history.push({ role, text, status });
  history = history.slice(-80);
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch { /* storage unavailable */ }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

for (const partner of PARTNERS) {
  const button = el("button", "partner-chip");
  button.type = "button";
  button.setAttribute("aria-pressed", "false");
  button.title = partner.description;
  button.append(el("span", "partner-icon", partner.icon), el("span", "", partner.name));
  button.addEventListener("click", () => {
    selectedPartner = selectedPartner === partner.id ? null : partner.id;
    for (const chip of partnerList.querySelectorAll("button")) {
      const active = chip === button && selectedPartner === partner.id;
      chip.classList.toggle("selected", active);
      chip.setAttribute("aria-pressed", String(active));
    }
    input.placeholder = selectedPartner ? `Ask ${partner.name}…` : "Tell Chatbliz what your business needs…";
    input.focus();
  });
  partnerList.append(button);
}

for (const product of PRODUCTS) {
  const card = el("article", "product-card");
  card.append(el("span", "product-icon", product.icon), el("h3", "", product.name), el("p", "", product.description));
  const action = el("button", "product-link", "Plan with Chatbliz →");
  action.type = "button";
  action.addEventListener("click", () => {
    setWorkspace(product);
    input.value = `Help me plan ${product.name} for my business`;
    input.focus();
  });
  card.append(action);
  productGrid.append(card);
}

for (const plan of PACKAGES) {
  const card = el("article", `plan-card${plan.name === "Growth" ? " featured" : ""}`);
  if (plan.badge) card.append(el("span", "plan-badge", plan.badge));
  card.append(el("h3", "", plan.name), el("p", "plan-price", plan.price));
  const list = el("ul");
  for (const detail of plan.details) list.append(el("li", "", detail));
  card.append(list);
  planGrid.append(card);
}

for (const text of [
  "Help me find more customers",
  "Check how people find my business online",
  "Plan a website for my business",
  "Help me prepare for a customer negotiation"
]) {
  const button = el("button", "suggestion", text);
  button.type = "button";
  button.addEventListener("click", () => { input.value = text; input.focus(); });
  byId("suggestions").append(button);
}

document.querySelectorAll("[data-workspace]").forEach(button => {
  button.addEventListener("click", () => {
    const product = PRODUCTS.find(item => item.id === button.dataset.workspace);
    if (product) setWorkspace(product);
  });
});

function setWorkspace(product) {
  document.querySelectorAll("[data-workspace]").forEach(button => button.classList.toggle("active", button.dataset.workspace === product.id));
  byId("active-workspace-label").textContent = product.name.toUpperCase();
  byId("workspace-title").textContent = product.id === "business" ? "What are we working on today?" : `Let's work on ${product.name}`;
}

function appendMessage(role, text, status, persist = true) {
  const article = el("article", `message ${role === "user" ? "user-message" : "assistant-message"}`);
  article.append(el("span", "message-avatar", role === "user" ? "BB" : "C"));
  const body = el("div", "message-body");
  body.append(el("p", "", text));
  if (status) body.append(el("small", "", status));
  article.append(body);
  thread.append(article);
  thread.scrollTop = thread.scrollHeight;
  if (persist) remember(role, text, status);
}

function sendMessage(value) {
  const text = value.trim();
  if (!text) return;
  appendMessage("user", text, "Sent to your local Chatbliz preview");
  const plan = preparePlan(text);
  if (selectedPartner) {
    const partner = PARTNERS.find(item => item.id === selectedPartner);
    plan.partners = [partner.name];
    plan.response = `${partner.name} can help with ${plan.product.name}. I’ve prepared this as a planning request. ${plan.product.status}. No external action has been taken.`;
  }
  appendMessage("assistant", plan.response, `Status: ${plan.status} · External execution: ${plan.execution}`);
  const taskInput = byId("task-input");
  if (taskInput) {
    taskInput.value = text.slice(0, 240);
    const taskHint = byId("task-hint");
    if (taskHint) taskHint.textContent = "Your latest chat request is ready to add as a task. Review it and select Add task.";
  }
  setWorkspace(plan.product);
  selectedPartner = null;
  partnerList.querySelectorAll("button").forEach(button => {
    button.classList.remove("selected");
    button.setAttribute("aria-pressed", "false");
  });
  input.placeholder = "Tell Chatbliz what your business needs…";
}

byId("chat-form").addEventListener("submit", event => {
  event.preventDefault();
  sendMessage(input.value);
  input.value = "";
  input.focus();
});
input.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    byId("chat-form").requestSubmit();
  }
});

for (const message of history) appendMessage(message.role, message.text, message.status, false);
byId("clear-local-history")?.addEventListener("click", () => {
  history = [];
  try { localStorage.removeItem(HISTORY_KEY); } catch { /* storage unavailable */ }
  thread.replaceChildren();
  appendMessage("assistant", "Your local chat is cleared. What should we work on?", "Local planning only", false);
});

const capabilityStatus = byId("capability-status");
if (capabilityStatus) {
  fetch("/api/capabilities", { cache: "no-store" })
    .then(response => {
      if (!response.ok) throw new Error("Service unavailable");
      return response.json();
    })
    .then(data => {
      capabilityStatus.textContent = data.planning === "local-browser"
        ? "Planning available · AI execution and customer connections not connected"
        : "Service status unavailable";
    })
    .catch(() => {
      capabilityStatus.textContent = "Backend status unavailable · local planning only";
    });
}

byId("export-local-chat")?.addEventListener("click", () => {
  if (!history.length) {
    appendMessage("assistant", "There is no saved conversation to export yet. Send a message to begin.", "Local planning only", false);
    return;
  }
  const lines = [
    "# Chatbliz OS — Business Conversation",
    "",
    "Exported: " + new Date().toISOString(),
    "Source: local browser planning history; no external business actions are implied.",
    "",
    ...history.flatMap(message => [
      "## " + (message.role === "user" ? "Business owner" : "Chatbliz planning assistant"),
      "",
      message.text,
      "",
      message.status ? "Status: " + message.status : "",
      ""
    ])
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "chatbliz-business-conversation-" + new Date().toISOString().slice(0, 10) + ".md";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

const TASKS_KEY = "chatbliz-local-tasks-v1";
const taskBoard = byId("task-board");
let localTasks = [];
try {
  const saved = JSON.parse(localStorage.getItem(TASKS_KEY) || "[]");
  if (Array.isArray(saved)) localTasks = saved.filter(t => typeof t?.id === "string" && typeof t?.title === "string" && t.title.length <= 240 && typeof t?.done === "boolean").slice(-200);
} catch { /* private browsing may block storage */ }
function saveTasks() {
  try { localStorage.setItem(TASKS_KEY, JSON.stringify(localTasks)); } catch { /* storage may be disabled */ }
}
let taskFilter = "all";
function renderTasks() {
  taskBoard.replaceChildren();
  const visible = localTasks.filter(t => taskFilter === "all" || (taskFilter === "open" ? !t.done : t.done));
  const count = byId("task-count");
  if (count) count.textContent = localTasks.filter(t => !t.done).length + " open · " + localTasks.filter(t => t.done).length + " completed";
  if (!visible.length) {
    taskBoard.append(el("p", "disclosure", localTasks.length ? "No tasks match this filter." : "No tasks yet. Add your first business action above."));
    return;
  }
  for (const task of visible) {
    const item = el("div", "message");
    item.setAttribute("role", "listitem");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", "Complete " + task.title);
    checkbox.addEventListener("change", () => { task.done = checkbox.checked; saveTasks(); renderTasks(); });
    const label = el("span", "", task.title);
    if (task.done) label.style.textDecoration = "line-through";
    const remove = el("button", "icon-button", "Remove");
    remove.type = "button";
    remove.setAttribute("aria-label", "Remove " + task.title);
    remove.addEventListener("click", () => {
      localTasks = localTasks.filter(t => t.id !== task.id);
      saveTasks(); renderTasks();
    });
    item.append(checkbox, label, remove);
    taskBoard.append(item);
  }
}
byId("task-form")?.addEventListener("submit", event => {
  event.preventDefault();
  const field = byId("task-input");
  const title = field.value.trim();
  if (!title || title.length > 240 || localTasks.length >= 200) return;
  localTasks.unshift({ id: crypto.randomUUID(), title, done: false });
  saveTasks();
  renderTasks();
  field.value = "";
  field.focus();
});
renderTasks();

byId("export-local-tasks")?.addEventListener("click", () => {
  if (!localTasks.length) {
    const hint = byId("task-hint");
    if (hint) hint.textContent = "Add a task before exporting.";
    return;
  }
  const documentText = [
    "# Chatbliz OS — Business Task List",
    "",
    "Exported: " + new Date().toISOString(),
    "Source: local browser tasks; not synchronized with customer accounts.",
    "",
    ...localTasks.map(t => (t.done ? "- [x] " : "- [ ] ") + t.title.replace(/\r?\n/g, " "))
  ].join("\n");
  const url = URL.createObjectURL(new Blob([documentText], { type: "text/markdown;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "chatbliz-business-tasks-" + new Date().toISOString().slice(0, 10) + ".md";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
byId("task-filter")?.addEventListener("change", event => {
  taskFilter = ["all", "open", "completed"].includes(event.target.value) ? event.target.value : "all";
  renderTasks();
});
