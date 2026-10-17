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
