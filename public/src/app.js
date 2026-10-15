import { PACKAGES, PARTNERS, PRODUCTS } from "./domain.mjs";

const byId = id => document.getElementById(id);
const partnerList = byId("partner-list");
const productGrid = byId("product-grid");
const planGrid = byId("plan-grid");
const thread = byId("chat-thread");
const input = byId("message-input");
let selectedPartner = null;
let authMode = "signup";
let currentUser = null;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "content-type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && path !== "/api/auth/login" && path !== "/api/auth/signup") showAuth();
    throw new Error(payload.error || `Request failed (${response.status}).`);
  }
  return payload;
}

function showAuth(message = "") {
  currentUser = null;
  byId("app-shell").hidden = true;
  byId("auth-screen").hidden = false;
  byId("auth-error").textContent = message;
}

function showApp() {
  byId("auth-screen").hidden = true;
  byId("app-shell").hidden = false;
  byId("owner-name").textContent = currentUser.displayName;
  byId("owner-email").textContent = currentUser.email;
  byId("owner-avatar").textContent = currentUser.displayName.split(/\s+/u).map(part => part[0]).join("").slice(0, 2).toUpperCase();
  byId("greeting").textContent = `Welcome, ${currentUser.displayName}. Tell your business team what you are working on.`;
}

function setAuthMode(mode) {
  authMode = mode;
  const signup = mode === "signup";
  byId("auth-name-label").hidden = !signup;
  byId("auth-name").required = signup;
  byId("auth-name").autocomplete = signup ? "name" : "off";
  byId("auth-password").autocomplete = signup ? "new-password" : "current-password";
  byId("auth-title").textContent = signup ? "Create your workspace" : "Welcome back";
  byId("auth-copy").textContent = signup
    ? "Create your secure account to save your business profile, conversations and tasks."
    : "Sign in to return to your saved business workspace.";
  byId("auth-submit").textContent = signup ? "Create account" : "Sign in";
  byId("auth-toggle").textContent = signup ? "Already have an account? Sign in" : "New to Chatbliz? Create an account";
  byId("auth-error").textContent = "";
}

byId("auth-toggle").addEventListener("click", () => setAuthMode(authMode === "signup" ? "login" : "signup"));
byId("auth-form").addEventListener("submit", async event => {
  event.preventDefault();
  const button = byId("auth-submit");
  button.disabled = true;
  byId("auth-error").textContent = "";
  const body = {
    displayName: byId("auth-name").value,
    email: byId("auth-email").value,
    password: byId("auth-password").value
  };
  try {
    const result = await api(authMode === "signup" ? "/api/auth/signup" : "/api/auth/login", {
      method: "POST", body: JSON.stringify(body)
    });
    currentUser = result.user;
    showApp();
    await loadWorkspace(result.profile);
  } catch (error) {
    byId("auth-error").textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

byId("sign-out").addEventListener("click", async () => {
  try { await api("/api/auth/logout", { method: "POST", body: "{}" }); }
  catch { /* The server may already have expired this session. */ }
  setAuthMode("login");
  showAuth();
});

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
  const action = el("button", "product-link", "Work with Chatbliz →");
  action.type = "button";
  action.addEventListener("click", () => {
    setWorkspace(product);
    input.value = `Help me work on ${product.name} for my business`;
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
  "I need more customers for my business",
  "Help me improve my online visibility",
  "The sign-up says successful but does not save",
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

document.querySelectorAll("[data-journey-workspace]").forEach(button => {
  button.addEventListener("click", () => {
    const product = PRODUCTS.find(item => item.id === button.dataset.journeyWorkspace);
    if (!product) return;
    setWorkspace(product);
    input.value = button.dataset.journeyPrompt || `Help me work on ${product.name} for my business`;
    input.focus();
    input.scrollIntoView({ behavior: "smooth", block: "center" });
  });
});

function renderTask(task) {
  const row = el("label", `task-row${task.status === "done" ? " is-done" : ""}`);
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.status === "done";
  checkbox.setAttribute("aria-label", `${checkbox.checked ? "Reopen" : "Complete"} task: ${task.title}`);
  checkbox.addEventListener("change", async () => {
    checkbox.disabled = true;
    try {
      const result = await api(`/api/tasks/${encodeURIComponent(task.id)}`, {
        method: "PATCH", body: JSON.stringify({ status: checkbox.checked ? "done" : "open" })
      });
      row.classList.toggle("is-done", result.task.status === "done");
      await loadTasks();
    } catch (error) {
      checkbox.checked = !checkbox.checked;
      alert(error.message);
    } finally { checkbox.disabled = false; }
  });
  row.append(checkbox, el("span", "", task.title));
  return row;
}

async function loadTasks() {
  const { tasks } = await api("/api/tasks");
  const list = byId("task-list");
  list.replaceChildren();
  byId("task-count").textContent = `${tasks.filter(task => task.status === "open").length} open · ${tasks.length} total`;
  if (!tasks.length) list.append(el("p", "empty-state", "Your saved follow-up actions will appear here."));
  else for (const task of tasks) list.append(renderTask(task));
}

async function saveTask(title, sourceMessageId) {
  await api("/api/tasks", { method: "POST", body: JSON.stringify({ title, sourceMessageId }) });
  await loadTasks();
}

function appendMessage(role, text, status) {
  const article = el("article", `message ${role === "user" ? "user-message" : "assistant-message"}`);
  article.append(el("span", "message-avatar", role === "user" ? currentUser.displayName.slice(0, 2).toUpperCase() : "C"));
  const body = el("div", "message-body");
  body.append(el("p", "", text));
  if (status) body.append(el("small", "", status));
  article.append(body);
  thread.append(article);
  thread.scrollTop = thread.scrollHeight;
}

function appendSolution(plan, sourceMessageId) {
  const article = el("article", "message assistant-message");
  article.append(el("span", "message-avatar", "F"));
  const body = el("div", "message-body");
  body.append(el("p", "", `Problem area: ${plan.solution.area}. ${plan.solution.assessment}`));
  body.append(el("strong", "", "Practical next steps"));
  const steps = el("ol");
  for (const action of plan.solution.actions) {
    const item = el("li", "");
    item.append(document.createTextNode(action));
    const add = el("button", "add-task", "Add task");
    add.type = "button";
    add.addEventListener("click", async () => {
      add.disabled = true;
      try { await saveTask(action, sourceMessageId); add.textContent = "Saved"; }
      catch (error) { add.disabled = false; add.textContent = "Retry"; alert(error.message); }
    });
    item.append(add);
    steps.append(item);
  }
  body.append(steps);
  body.append(el("p", "", `Measure: ${plan.solution.measure}`));
  body.append(el("p", "", `To make this specific: ${plan.solution.questions.join(" ")}`));
  body.append(el("small", "", "Saved conversation · Planning workflow (no external action taken)"));
  article.append(body);
  thread.append(article);
  thread.scrollTop = thread.scrollHeight;
}

function renderSavedMessage(item) {
  if (item.role === "user") appendMessage("user", item.body, "Saved in your account");
  else if (item.plan?.problemSolving) appendSolution(item.plan, item.id);
  else appendMessage("assistant", item.body, "Saved in your account");
}

async function submitChat(value) {
  const message = value.trim();
  if (!message) return;
  appendMessage("user", message, "Saving to your account…");
  const button = document.querySelector("#chat-form button[type='submit']");
  button.disabled = true;
  try {
    const result = await api("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message, partnerId: selectedPartner })
    });
    const plan = result.plan;
    const useSolver = selectedPartner === "problem_solver" || plan.problemSolving;
    if (useSolver) {
      plan.problemSolving = true;
      appendSolution(plan, result.assistantMessageId);
    } else appendMessage("assistant", plan.response, "Saved conversation · Built-in planning workflow");
    setWorkspace(plan.product);
  } catch (error) {
    appendMessage("assistant", error.message, "Not saved · retry when the connection is restored");
  } finally {
    button.disabled = false;
    selectedPartner = null;
    partnerList.querySelectorAll("button").forEach(chip => {
      chip.classList.remove("selected");
      chip.setAttribute("aria-pressed", "false");
    });
    input.placeholder = "Tell Chatbliz what your business needs…";
  }
}

byId("chat-form").addEventListener("submit", async event => {
  event.preventDefault();
  const value = input.value;
  input.value = "";
  await submitChat(value);
  input.focus();
});
input.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    byId("chat-form").requestSubmit();
  }
});

byId("profile-form").addEventListener("submit", async event => {
  event.preventDefault();
  const status = byId("profile-status");
  status.textContent = "Saving…";
  const profile = {
    displayName: byId("profile-display-name").value,
    businessName: byId("profile-business-name").value,
    industry: byId("profile-industry").value,
    location: byId("profile-location").value,
    website: byId("profile-website").value,
    whatsapp: byId("profile-whatsapp").value
  };
  try {
    const result = await api("/api/profile", { method: "PUT", body: JSON.stringify(profile) });
    currentUser = result.user;
    showApp();
    fillProfile(result.user, result.profile);
    status.textContent = "Saved and verified.";
  } catch (error) { status.textContent = error.message; }
});

function fillProfile(user, profile = {}) {
  byId("profile-display-name").value = user.displayName || "";
  byId("profile-business-name").value = profile.businessName || "";
  byId("profile-industry").value = profile.industry || "";
  byId("profile-location").value = profile.location || "";
  byId("profile-website").value = profile.website || "";
  byId("profile-whatsapp").value = profile.whatsapp || "";
}

async function loadWorkspace(initialProfile) {
  showApp();
  byId("connection-status").innerHTML = "<i></i> Account storage connected";
  try {
    const details = initialProfile ? { user: currentUser, profile: initialProfile } : await api("/api/me");
    fillProfile(details.user, details.profile);
    const [messages] = await Promise.all([api("/api/chat"), loadTasks()]);
    if (messages.messages.length) {
      thread.replaceChildren();
      for (const item of messages.messages) renderSavedMessage(item);
    }
  } catch (error) {
    if (error.message !== "Sign in to continue.") byId("connection-status").textContent = "Storage connection issue";
  }
}

async function boot() {
  setAuthMode("signup");
  try {
    await api("/api/health");
    const result = await api("/api/me");
    currentUser = result.user;
    await loadWorkspace(result.profile);
  } catch (error) {
    if (error.message === "Sign in to continue.") showAuth();
    else showAuth("Chatbliz storage is not connected yet. Please try again later.");
  }
}

boot();
