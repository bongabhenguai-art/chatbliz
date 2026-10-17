import { PACKAGES, PARTNERS, PRODUCTS, preparePlan } from "./domain.mjs";

const byId = id => document.getElementById(id);
const partnerList = byId("partner-list");
const productGrid = byId("product-grid");
const planGrid = byId("plan-grid");
const thread = byId("chat-thread");
const input = byId("message-input");
let selectedPartner = null;
let selectedSkill = null;

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

// Fetch and render existing messages
async function loadMessages() {
  try {
    const res = await fetch('/api/messages');
    if (res.ok) {
      const items = await res.json();
      for (const it of items) appendMessage('assistant', it.plan.response, `Saved: ${it.createdAt}`);
    }
  } catch (e) { console.error('Could not load messages', e); }
}

loadMessages();

// Skills UI (kept simplified client-side)
const skills = [
  { id: 'scheduler', name: 'Scheduler', icon: '📅' },
  { id: 'seo', name: 'SEO Analyzer', icon: '🔎' },
  { id: 'copy', name: 'Copywriter', icon: '✍' }
];
const skillsContainer = el("div", "skills-container");
skillsContainer.setAttribute("aria-label", "Skills");
const skillsLabel = el("p", "nav-label", "SKILLS");
const skillsList = el("nav", "skills-list");
for (const skill of skills) {
  const button = el("button", "skill-chip");
  button.type = "button";
  button.title = skill.description || skill.name;
  button.setAttribute("aria-pressed", "false");
  button.append(el("span", "skill-icon", skill.icon), el("span", "", skill.name));
  button.addEventListener("click", () => {
    selectedSkill = selectedSkill === skill.id ? null : skill.id;
    for (const chip of skillsList.querySelectorAll("button")) {
      const active = chip === button && selectedSkill === skill.id;
      chip.classList.toggle("selected", active);
      chip.setAttribute("aria-pressed", String(active));
    }
    input.focus();
  });
  skillsList.append(button);
}
skillsContainer.append(skillsLabel, skillsList);
partnerList.parentNode.insertBefore(skillsContainer, partnerList.nextSibling);

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

function appendMessage(role, text, status) {
  const article = el("article", `message ${role === "user" ? "user-message" : "assistant-message"}`);
  article.append(el("span", "message-avatar", role === "user" ? "BB" : "C"));
  const body = el("div", "message-body");
  body.append(el("p", "", text));
  if (status) body.append(el("small", "", status));
  article.append(body);
  thread.append(article);
  thread.scrollTop = thread.scrollHeight;
}

async function sendMessage(value) {
  const text = value.trim();
  if (!text) return;
  appendMessage("user", text, "Sending…");
  try {
    const res = await fetch('/api/messages', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: text, selectedPartner, selectedSkill }) });
    if (res.ok) {
      const saved = await res.json();
      appendMessage('assistant', saved.plan.response, `Saved: ${saved.createdAt}`);
      setWorkspace(saved.plan.product);
    } else {
      appendMessage('assistant', 'Failed to save message on server', 'Error');
    }
  } catch (e) { appendMessage('assistant', 'Network error', 'Error'); }

  selectedPartner = null;
  partnerList.querySelectorAll("button").forEach(button => {
    button.classList.remove("selected");
    button.setAttribute("aria-pressed", "false");
  });
  selectedSkill = null;
  skillsList.querySelectorAll("button").forEach(button => { button.classList.remove("selected"); button.setAttribute("aria-pressed","false"); });
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
