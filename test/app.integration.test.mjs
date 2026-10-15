import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Miniflare } from "miniflare";

test("Chatbliz accounts, profiles, conversations and tasks persist in D1", async () => {
  const mf = new Miniflare({
    scriptPath: new URL("../src/worker.js", import.meta.url).pathname,
    modules: true,
    compatibilityDate: "2026-10-15",
    d1Databases: { DB: "chatbliz-test-db" },
    serviceBindings: { ASSETS: async () => new Response("<h1>Create account</h1>", { headers: { "content-type": "text/html" } }) }
  });
  try {
    const database = await mf.getD1Database("DB");
    const migration = await readFile(new URL("../migrations/0001_initial.sql", import.meta.url), "utf8");
    for (const statement of migration.split(";").map(item => item.trim()).filter(Boolean)) await database.prepare(statement).run();

    const base = "http://chatbliz.test";
    const health = await mf.dispatchFetch(`${base}/api/health`);
    const healthText = await health.text();
    assert.equal(health.status, 200, healthText);
    assert.deepEqual(JSON.parse(healthText), { ok: true, storage: "connected" });

    const signup = await mf.dispatchFetch(`${base}/api/auth/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName: "Bonga Bhengu", email: "Bonga@example.com", password: "A-strong-password-81" })
    });
    assert.equal(signup.status, 201);
    const cookie = signup.headers.get("set-cookie")?.split(";", 1)[0];
    assert.ok(cookie?.startsWith("chatbliz_session="));
    assert.match(signup.headers.get("set-cookie"), /HttpOnly/u);
    const signedUp = await signup.json();
    assert.equal(signedUp.user.email, "bonga@example.com");
    const passwordRecord = await database.prepare("SELECT password_hash, password_salt, password_iterations FROM users WHERE id = ?")
      .bind(signedUp.user.id).first();
    assert.notEqual(passwordRecord.password_hash, "A-strong-password-81");
    assert.notEqual(passwordRecord.password_salt, "");
    assert.equal(passwordRecord.password_iterations, 120000);
    const storedSession = await database.prepare("SELECT token_hash FROM sessions WHERE user_id = ?").bind(signedUp.user.id).first();
    assert.notEqual(storedSession.token_hash, cookie.split("=")[1]);

    const duplicate = await mf.dispatchFetch(`${base}/api/auth/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName: "Bonga Bhengu", email: "bonga@example.com", password: "A-strong-password-81" })
    });
    assert.equal(duplicate.status, 409);

    const protectedResponse = await mf.dispatchFetch(`${base}/api/me`);
    assert.equal(protectedResponse.status, 401);
    const profileSave = await mf.dispatchFetch(`${base}/api/profile`, {
      method: "PUT",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({
        displayName: "Bonga Bhengu", businessName: "Phalamende Meal Palace", industry: "Food", location: "Durban",
        website: "https://chatbliz.online", whatsapp: "+27 82 000 0000"
      })
    });
    assert.equal(profileSave.status, 200);
    assert.equal((await profileSave.json()).profile.businessName, "Phalamende Meal Palace");
    const profileRead = await mf.dispatchFetch(`${base}/api/me`, { headers: { cookie } });
    assert.equal((await profileRead.json()).profile.businessName, "Phalamende Meal Palace");

    const chat = await mf.dispatchFetch(`${base}/api/chat`, {
      method: "POST", headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ message: "I need more customers for my business" })
    });
    assert.equal(chat.status, 200);
    const chatResult = await chat.json();
    assert.equal(chatResult.plan.solution.area, "Lead flow and sales");
    const history = await mf.dispatchFetch(`${base}/api/chat`, { headers: { cookie } });
    assert.equal((await history.json()).messages.length, 2);

    const createTask = await mf.dispatchFetch(`${base}/api/tasks`, {
      method: "POST", headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ title: "Record this week's qualified enquiries", sourceMessageId: chatResult.assistantMessageId })
    });
    assert.equal(createTask.status, 201);
    const task = (await createTask.json()).task;
    const markDone = await mf.dispatchFetch(`${base}/api/tasks/${task.id}`, {
      method: "PATCH", headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ status: "done" })
    });
    assert.equal((await markDone.json()).task.status, "done");
    const taskList = await mf.dispatchFetch(`${base}/api/tasks`, { headers: { cookie } });
    assert.equal((await taskList.json()).tasks[0].status, "done");

    const logout = await mf.dispatchFetch(`${base}/api/auth/logout`, { method: "POST", headers: { cookie } });
    assert.equal(logout.status, 200);
    const afterLogout = await mf.dispatchFetch(`${base}/api/me`, { headers: { cookie } });
    assert.equal(afterLogout.status, 401);

    const login = await mf.dispatchFetch(`${base}/api/auth/login`, {
      method: "POST", headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.5" },
      body: JSON.stringify({ email: "Bonga@example.com", password: "A-strong-password-81" })
    });
    assert.equal(login.status, 200);
    const loginCookie = login.headers.get("set-cookie")?.split(";", 1)[0];
    const resumed = await mf.dispatchFetch(`${base}/api/me`, { headers: { cookie: loginCookie } });
    assert.equal((await resumed.json()).profile.businessName, "Phalamende Meal Palace");

    for (let attempt = 0; attempt < 10; attempt++) {
      const denied = await mf.dispatchFetch(`${base}/api/auth/login`, {
        method: "POST", headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.99" },
        body: JSON.stringify({ email: "unknown@example.com", password: "not-the-password" })
      });
      assert.equal(denied.status, 401);
    }
    const rateLimited = await mf.dispatchFetch(`${base}/api/auth/login`, {
      method: "POST", headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.99" },
      body: JSON.stringify({ email: "unknown@example.com", password: "not-the-password" })
    });
    assert.equal(rateLimited.status, 429);

    const secondSignup = await mf.dispatchFetch(`${base}/api/auth/signup`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName: "Second Owner", email: "second@example.com", password: "Another-strong-password-82" })
    });
    const secondCookie = secondSignup.headers.get("set-cookie")?.split(";", 1)[0];
    const secondOwnerTasks = await mf.dispatchFetch(`${base}/api/tasks`, { headers: { cookie: secondCookie } });
    assert.deepEqual((await secondOwnerTasks.json()).tasks, []);

    const staticPage = await mf.dispatchFetch(`${base}/`);
    const staticHtml = await staticPage.text();
    assert.equal(staticPage.status, 200, staticHtml);
    assert.match(staticHtml, /Create account/u);
  } finally {
    await mf.dispose();
  }
});
