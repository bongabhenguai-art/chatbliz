import { PARTNERS, preparePlan } from "../public/src/domain.mjs";

// Keep active owner devices signed in. Each successful API request renews this
// one-year cookie and its D1 expiry; signing out revokes the session immediately.
const SESSION_SECONDS = 60 * 60 * 24 * 365;
const PASSWORD_ITERATIONS = 120_000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LIMIT = 10;
const MAX_JSON_BYTES = 16_384;
const DUMMY_PASSWORD_RECORD = {
  password_hash: base64url(new Uint8Array(32)),
  password_salt: base64url(new Uint8Array(16)),
  password_iterations: PASSWORD_ITERATIONS
};
const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders }
  });
}

function fail(message, status = 400) {
  return json({ error: message }, status);
}

async function readJson(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Send valid JSON.");
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_JSON_BYTES) {
        await reader.cancel();
        const error = new Error("Request is too large.");
        error.status = 413;
        throw error;
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const data = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!data || Array.isArray(data) || typeof data !== "object") throw new Error();
    return data;
  } catch (error) {
    if (error?.status === 413) throw error;
    throw new Error("Send valid JSON.");
  }
}

function validateBrowserMutation(request, url) {
  const origin = request.headers.get("origin");
  if (!origin) return "An Origin header is required for this request.";
  try {
    if (new URL(origin).origin !== url.origin) return "Cross-origin requests are not allowed.";
  } catch {
    return "Cross-origin requests are not allowed.";
  }
  if (url.pathname !== "/api/auth/logout") {
    const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
    if (contentType !== "application/json") return "Send this request as JSON.";
  }
  return "";
}

function cookieValue(request, name) {
  const cookies = request.headers.get("cookie") || "";
  for (const item of cookies.split(";")) {
    const separator = item.indexOf("=");
    if (separator < 0) continue;
    if (item.slice(0, separator).trim() === name) return item.slice(separator + 1).trim();
  }
  return "";
}

function base64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function fromBase64url(value) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

async function sha256(value) {
  return base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))));
}

async function derivePassword(password, salt, iterations = PASSWORD_ITERATIONS) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256
  );
  return new Uint8Array(bits);
}

async function makePassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePassword(password, salt);
  return { salt: base64url(salt), hash: base64url(hash), iterations: PASSWORD_ITERATIONS };
}

async function verifyPassword(password, user) {
  const expected = fromBase64url(user.password_hash);
  const actual = await derivePassword(password, fromBase64url(user.password_salt), user.password_iterations);
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index++) difference |= actual[index] ^ expected[index];
  return difference === 0;
}

async function newSession(db, userId, request) {
  const token = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash = await sha256(token);
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString();
  await db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(tokenHash, userId, expiresAt).run();
  const stored = await db.prepare("SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > ?")
    .bind(tokenHash, new Date().toISOString()).first();
  if (!stored || stored.user_id !== userId) throw new Error("Could not verify the new session in storage.");
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `chatbliz_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_SECONDS}${secure}`;
}

async function currentUser(request, db) {
  const token = cookieValue(request, "chatbliz_session");
  if (!token || token.length > 100) return null;
  const tokenHash = await sha256(token);
  return db.prepare(`SELECT users.id, users.email, users.display_name
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?`)
    .bind(tokenHash, new Date().toISOString()).first();
}

function clearSessionCookie(request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `chatbliz_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`;
}

function limitedText(value, max, field) {
  const text = String(value ?? "").trim();
  if (text.length > max) throw new Error(`${field} must be ${max} characters or fewer.`);
  return text;
}

function profileShape(row) {
  return {
    businessName: row?.business_name || "",
    industry: row?.industry || "",
    location: row?.location || "",
    website: row?.website || "",
    whatsapp: row?.whatsapp || ""
  };
}

function buildShape(row) {
  return {
    id: row.id,
    businessName: row.business_name,
    businessType: row.business_type,
    problem: row.problem,
    goal: row.goal,
    learningNotes: row.learning_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function handleApi(request, env) {
  if (!env.DB) return fail("Chatbliz storage is not configured.", 503);
  const { pathname } = new URL(request.url);
  const method = request.method.toUpperCase();

  if (pathname === "/api/health" && method === "GET") {
    try {
      const row = await env.DB.prepare("SELECT 1 AS ok").first();
      if (row?.ok !== 1) throw new Error("D1 health query returned an unexpected result.");
      return json({ ok: true, storage: "connected" });
    } catch {
      return fail("Chatbliz storage check failed.", 503);
    }
  }

  if (pathname === "/api/auth/signup" && method === "POST") {
    let input;
    try { input = await readJson(request); } catch (error) { return fail(error.message, error.status || 400); }
    const displayName = limitedText(input.displayName, 80, "Name");
    const email = limitedText(input.email, 254, "Email").toLowerCase();
    const password = String(input.password ?? "");
    if (displayName.length < 2) return fail("Enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) return fail("Enter a valid email address.");
    if (password.length < 10 || password.length > 256) return fail("Password must be between 10 and 256 characters.");

    const id = crypto.randomUUID();
    const profile = await makePassword(password);
    const token = base64url(crypto.getRandomValues(new Uint8Array(32)));
    const tokenHash = await sha256(token);
    const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString();
    try {
      await env.DB.batch([
        env.DB.prepare(`INSERT INTO users (id, email, display_name, password_hash, password_salt, password_iterations)
          VALUES (?, ?, ?, ?, ?, ?)`)
          .bind(id, email, displayName, profile.hash, profile.salt, profile.iterations),
        env.DB.prepare("INSERT INTO business_profiles (user_id) VALUES (?)").bind(id),
        env.DB.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
          .bind(tokenHash, id, expiresAt)
      ]);
    } catch (error) {
      if (/UNIQUE constraint failed: users\.email/i.test(String(error?.message))) {
        return fail("An account with this email already exists. Sign in instead.", 409);
      }
      return fail("The account could not be saved. Please try again.", 500);
    }

    const stored = await env.DB.prepare(`SELECT users.id, users.email, users.display_name, business_profiles.business_name
      FROM users JOIN business_profiles ON business_profiles.user_id = users.id WHERE users.id = ?`)
      .bind(id).first();
    const session = await env.DB.prepare("SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > ?")
      .bind(tokenHash, new Date().toISOString()).first();
    if (!stored || stored.id !== id || !session || session.user_id !== id) {
      return fail("The account write did not verify in Chatbliz storage. Please try again.", 500);
    }
    const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
    return json({ user: { id: stored.id, email: stored.email, displayName: stored.display_name }, profile: profileShape(stored) }, 201, {
      "set-cookie": `chatbliz_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_SECONDS}${secure}`
    });
  }

  if (pathname === "/api/auth/login" && method === "POST") {
    let input;
    try { input = await readJson(request); } catch (error) { return fail(error.message, error.status || 400); }
    const email = limitedText(input.email, 254, "Email").toLowerCase();
    const password = String(input.password ?? "");
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const actorHashes = [await sha256(`email:${email}`), await sha256(`ip:${ip}`)];
    const cutoff = new Date(Date.now() - LOGIN_WINDOW_MS).toISOString();
    const attempts = await env.DB.prepare(`SELECT COUNT(*) AS count FROM login_attempts
      WHERE (email_hash = ? OR ip_hash = ?) AND attempted_at > ?`).bind(actorHashes[0], actorHashes[1], cutoff).first();
    if ((attempts?.count || 0) >= LOGIN_LIMIT) return fail("Too many sign-in attempts. Wait 15 minutes and try again.", 429);
    const found = await env.DB.prepare("SELECT id, email, display_name, password_hash, password_salt, password_iterations FROM users WHERE email = ?")
      .bind(email).first();
    const valid = password.length <= 256 && await verifyPassword(password, found || DUMMY_PASSWORD_RECORD);
    if (!found || !valid) {
      const now = new Date().toISOString();
      await env.DB.prepare("INSERT INTO login_attempts (id, email_hash, ip_hash, attempted_at) VALUES (?, ?, ?, ?)")
        .bind(crypto.randomUUID(), actorHashes[0], actorHashes[1], now).run();
      await env.DB.prepare("DELETE FROM login_attempts WHERE attempted_at < ?").bind(cutoff).run();
      return fail("Email or password is incorrect.", 401);
    }
    await env.DB.prepare("DELETE FROM login_attempts WHERE email_hash = ?").bind(actorHashes[0]).run();
    const cookie = await newSession(env.DB, found.id, request);
    return json({ user: { id: found.id, email: found.email, displayName: found.display_name } }, 200, { "set-cookie": cookie });
  }

  const user = await currentUser(request, env.DB);
  if (!user && pathname === "/api/auth/logout" && method === "POST") {
    return json({ ok: true }, 200, { "set-cookie": clearSessionCookie(request) });
  }
  if (!user) return fail("Sign in to continue.", 401);

  if (pathname === "/api/auth/logout" && method === "POST") {
    const token = cookieValue(request, "chatbliz_session");
    if (token) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
    return json({ ok: true }, 200, { "set-cookie": clearSessionCookie(request) });
  }

  if (pathname === "/api/me" && method === "GET") {
    const profile = await env.DB.prepare("SELECT business_name, industry, location, website, whatsapp FROM business_profiles WHERE user_id = ?")
      .bind(user.id).first();
    return json({ user: { id: user.id, email: user.email, displayName: user.display_name }, profile: profileShape(profile) });
  }

  if (pathname === "/api/builds" && method === "GET") {
    const { results } = await env.DB.prepare(`SELECT id, business_name, business_type, problem, goal, learning_notes, created_at, updated_at
      FROM customer_builds WHERE owner_id = ? ORDER BY updated_at DESC LIMIT 100`).bind(user.id).all();
    return json({ builds: (results || []).map(buildShape) });
  }

  if (pathname === "/api/builds" && method === "POST") {
    let input;
    try { input = await readJson(request); } catch (error) { return fail(error.message, error.status || 400); }
    let businessName, businessType, problem, goal;
    try {
      businessName = limitedText(input.businessName, 120, "Business name");
      businessType = limitedText(input.businessType, 100, "Business type");
      problem = limitedText(input.problem, 1000, "Customer need");
      goal = limitedText(input.goal, 700, "Build goal");
    } catch (error) { return fail(error.message); }
    if (!businessName || !businessType || !problem || !goal) return fail("Complete the business, type, customer need and build goal.");
    const id = crypto.randomUUID();
    try {
      await env.DB.prepare(`INSERT INTO customer_builds (id, owner_id, business_name, business_type, problem, goal)
        VALUES (?, ?, ?, ?, ?, ?)`).bind(id, user.id, businessName, businessType, problem, goal).run();
    } catch {
      return fail("The customer build could not be saved. Please try again.", 500);
    }
    const saved = await env.DB.prepare(`SELECT id, business_name, business_type, problem, goal, learning_notes, created_at, updated_at
      FROM customer_builds WHERE id = ? AND owner_id = ?`).bind(id, user.id).first();
    if (!saved) return fail("The customer build did not verify in Chatbliz storage.", 500);
    return json({ build: buildShape(saved) }, 201);
  }

  const buildMatch = pathname.match(/^\/api\/builds\/([\w-]+)$/u);
  if (buildMatch && method === "PATCH") {
    let input;
    try { input = await readJson(request); } catch (error) { return fail(error.message, error.status || 400); }
    let learningNotes;
    try { learningNotes = limitedText(input.learningNotes, 2000, "Learning notes"); }
    catch (error) { return fail(error.message); }
    await env.DB.prepare(`UPDATE customer_builds SET learning_notes = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = ? AND owner_id = ?`).bind(learningNotes, buildMatch[1], user.id).run();
    const saved = await env.DB.prepare(`SELECT id, business_name, business_type, problem, goal, learning_notes, created_at, updated_at
      FROM customer_builds WHERE id = ? AND owner_id = ?`).bind(buildMatch[1], user.id).first();
    if (!saved) return fail("Customer build not found.", 404);
    if (saved.learning_notes !== learningNotes) return fail("The learning note did not verify in Chatbliz storage.", 500);
    return json({ build: buildShape(saved) });
  }

  if (pathname === "/api/profile" && method === "PUT") {
    let input;
    try { input = await readJson(request); } catch (error) { return fail(error.message, error.status || 400); }
    let displayName, businessName, industry, location, website, whatsapp;
    try {
      displayName = limitedText(input.displayName, 80, "Name");
      businessName = limitedText(input.businessName, 120, "Business name");
      industry = limitedText(input.industry, 100, "Industry");
      location = limitedText(input.location, 120, "Location");
      website = limitedText(input.website, 200, "Website");
      whatsapp = limitedText(input.whatsapp, 32, "WhatsApp number");
    } catch (error) { return fail(error.message); }
    if (displayName.length < 2) return fail("Enter your name.");
    if (website && !/^https?:\/\//iu.test(website)) return fail("Website must start with https:// or http://.");
    await env.DB.batch([
      env.DB.prepare("UPDATE users SET display_name = ? WHERE id = ?").bind(displayName, user.id),
      env.DB.prepare(`UPDATE business_profiles SET business_name = ?, industry = ?, location = ?, website = ?, whatsapp = ?,
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE user_id = ?`)
        .bind(businessName, industry, location, website, whatsapp, user.id)
    ]);
    const saved = await env.DB.prepare(`SELECT users.display_name, business_profiles.business_name, business_profiles.industry,
      business_profiles.location, business_profiles.website, business_profiles.whatsapp
      FROM users JOIN business_profiles ON business_profiles.user_id = users.id WHERE users.id = ?`)
      .bind(user.id).first();
    if (!saved || saved.display_name !== displayName || saved.business_name !== businessName) {
      return fail("The profile update did not verify in Chatbliz storage.", 500);
    }
    return json({ user: { id: user.id, email: user.email, displayName: saved.display_name }, profile: profileShape(saved) });
  }

  if (pathname === "/api/chat" && method === "GET") {
    const { results } = await env.DB.prepare(`SELECT id, role, body, metadata_json, created_at
      FROM chat_messages WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 100`)
      .bind(user.id).all();
    return json({ messages: (results || []).reverse().map(row => ({
      id: row.id, role: row.role, body: row.body,
      plan: row.metadata_json ? JSON.parse(row.metadata_json) : null,
      createdAt: row.created_at
    })) });
  }

  if (pathname === "/api/chat" && method === "POST") {
    let input;
    try { input = await readJson(request); } catch (error) { return fail(error.message, error.status || 400); }
    let message;
    try { message = limitedText(input.message, 4000, "Message"); } catch (error) { return fail(error.message); }
    if (!message) return fail("Write a message first.");
    let plan;
    try { plan = preparePlan(message); } catch { return fail("Chatbliz could not prepare a plan for that message.", 422); }
    const requestedPartner = PARTNERS.find(partner => partner.id === input.partnerId);
    if (requestedPartner) {
      plan.partners = [requestedPartner.name];
      if (requestedPartner.id === "problem_solver") plan.problemSolving = true;
    }
    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();
    try {
      await env.DB.batch([
        env.DB.prepare("INSERT INTO chat_messages (id, user_id, role, body) VALUES (?, ?, 'user', ?)")
          .bind(userMessageId, user.id, message),
        env.DB.prepare("INSERT INTO chat_messages (id, user_id, role, body, metadata_json) VALUES (?, ?, 'assistant', ?, ?)")
          .bind(assistantMessageId, user.id, plan.response, JSON.stringify(plan))
      ]);
    } catch {
      return fail("The conversation could not be saved. Your message was not recorded.", 500);
    }
    const verified = await env.DB.prepare("SELECT COUNT(*) AS count FROM chat_messages WHERE user_id = ? AND id IN (?, ?)")
      .bind(user.id, userMessageId, assistantMessageId).first();
    if (verified?.count !== 2) return fail("The conversation write did not verify in Chatbliz storage.", 500);
    return json({ userMessageId, assistantMessageId, plan });
  }

  if (pathname === "/api/tasks" && method === "GET") {
    const { results } = await env.DB.prepare(`SELECT id, title, status, source_message_id, created_at, updated_at
      FROM tasks WHERE user_id = ? ORDER BY CASE status WHEN 'open' THEN 0 ELSE 1 END, created_at DESC LIMIT 100`)
      .bind(user.id).all();
    return json({ tasks: results || [] });
  }

  if (pathname === "/api/tasks" && method === "POST") {
    let input;
    try { input = await readJson(request); } catch (error) { return fail(error.message, error.status || 400); }
    let title;
    try { title = limitedText(input.title, 240, "Task"); } catch (error) { return fail(error.message); }
    if (!title) return fail("Task title is required.");
    const id = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO tasks (id, user_id, title, source_message_id) VALUES (?, ?, ?, ?)")
      .bind(id, user.id, title, limitedText(input.sourceMessageId, 80, "Message ID")).run();
    const saved = await env.DB.prepare("SELECT id, title, status, created_at FROM tasks WHERE id = ? AND user_id = ?")
      .bind(id, user.id).first();
    if (!saved) return fail("The task did not verify in Chatbliz storage.", 500);
    return json({ task: saved }, 201);
  }

  const taskMatch = pathname.match(/^\/api\/tasks\/([\w-]+)$/u);
  if (taskMatch && method === "PATCH") {
    let input;
    try { input = await readJson(request); } catch (error) { return fail(error.message, error.status || 400); }
    if (input.status !== "open" && input.status !== "done") return fail("Task status must be open or done.");
    await env.DB.prepare(`UPDATE tasks SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = ? AND user_id = ?`).bind(input.status, taskMatch[1], user.id).run();
    const saved = await env.DB.prepare("SELECT id, title, status, updated_at FROM tasks WHERE id = ? AND user_id = ?")
      .bind(taskMatch[1], user.id).first();
    if (!saved) return fail("Task not found.", 404);
    if (saved.status !== input.status) return fail("The task update did not verify in Chatbliz storage.", 500);
    return json({ task: saved });
  }

  return fail("This Chatbliz endpoint was not found.", 404);
}

async function renewActiveSession(request, env, response) {
  if (response.status === 401 || new URL(request.url).pathname === "/api/auth/logout") return response;
  const token = cookieValue(request, "chatbliz_session");
  if (!token || token.length > 100) return response;
  const tokenHash = await sha256(token);
  const now = new Date().toISOString();
  const session = await env.DB.prepare("SELECT token_hash FROM sessions WHERE token_hash = ? AND expires_at > ?")
    .bind(tokenHash, now).first();
  if (!session) return response;
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString();
  try {
    await env.DB.prepare("UPDATE sessions SET expires_at = ? WHERE token_hash = ?")
      .bind(expiresAt, tokenHash).run();
  } catch {
    return response;
  }
  const headers = new Headers(response.headers);
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  headers.set("set-cookie", `chatbliz_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_SECONDS}${secure}`);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "allow": "GET, POST, PUT, PATCH, OPTIONS" } });
      if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method.toUpperCase())) {
        const invalid = validateBrowserMutation(request, url);
        if (invalid) return fail(invalid, 403);
      }
      try {
        const response = await handleApi(request, env);
        return await renewActiveSession(request, env, response);
      } catch (error) {
        console.error("Chatbliz request failed", error?.message || "unknown error");
        return fail("Chatbliz could not complete that request. Please try again.", 500);
      }
    }
    return env.ASSETS.fetch(request);
  }
};

export { derivePassword, makePassword, verifyPassword };
