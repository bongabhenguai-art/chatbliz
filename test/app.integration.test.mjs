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
    const learningMigration = await readFile(new URL("../migrations/0002_customer_build_memory.sql", import.meta.url), "utf8");
    for (const statement of learningMigration.split(";").map(item => item.trim()).filter(Boolean)) await database.prepare(statement).run();

    const base = "http://chatbliz.test";
    const dispatch = (input, init = {}) => {
      const headers = new Headers(init.headers || {});
      if (["POST", "PUT", "PATCH", "DELETE"].includes(String(init.method || "GET").toUpperCase()) && !headers.has("origin")) {
        headers.set("origin", new URL(input, base).origin);
      }
      return mf.dispatchFetch(input, { ...init, headers });
    };
    const health = await mf.dispatchFetch(`${base}/api/health`);
    const healthText = await health.text();
    assert.equal(health.status, 200, healthText);
    assert.deepEqual(JSON.parse(healthText), { ok: true, storage: "connected" });

    const signup = await dispatch(`${base}/api/auth/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName: "Bonga Bhengu", email: "Bonga@example.com", password: "A-strong-password-81" })
    });
    assert.equal(signup.status, 201);
    const cookie = signup.headers.get("set-cookie")?.split(";", 1)[0];
    assert.ok(cookie?.startsWith("chatbliz_session="));
    assert.match(signup.headers.get("set-cookie"), /HttpOnly/u);
    assert.match(signup.headers.get("set-cookie"), /Max-Age=31536000/u);
    const signedUp = await signup.json();
    assert.equal(signedUp.user.email, "bonga@example.com");

    const badOrigin = await mf.dispatchFetch(`${base}/api/profile`, {
      method: "PUT",
      headers: { cookie, origin: "https://attacker.example", "content-type": "application/json" },
      body: JSON.stringify({ displayName: "Hijacked Name" })
    });
    assert.equal(badOrigin.status, 403);
    const missingOrigin = await mf.dispatchFetch(`${base}/api/profile`, {
      method: "PUT", headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ displayName: "Missing Origin" })
    });
    assert.equal(missingOrigin.status, 403);
    const oversized = await dispatch(`${base}/api/profile`, {
      method: "PUT", headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ displayName: "Bonga Bhengu", businessName: "x".repeat(17_000) })
    });
    assert.equal(oversized.status, 413);
    const passwordRecord = await database.prepare("SELECT password_hash, password_salt, password_iterations FROM users WHERE id = ?")
      .bind(signedUp.user.id).first();
    assert.notEqual(passwordRecord.password_hash, "A-strong-password-81");
    assert.notEqual(passwordRecord.password_salt, "");
    assert.equal(passwordRecord.password_iterations, 120000);
    const storedSession = await database.prepare("SELECT token_hash FROM sessions WHERE user_id = ?").bind(signedUp.user.id).first();
    assert.notEqual(storedSession.token_hash, cookie.split("=")[1]);

    const duplicate = await dispatch(`${base}/api/auth/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName: "Bonga Bhengu", email: "bonga@example.com", password: "A-strong-password-81" })
    });
    assert.equal(duplicate.status, 409);

    const protectedResponse = await mf.dispatchFetch(`${base}/api/me`);
    assert.equal(protectedResponse.status, 401);
    const profileSave = await dispatch(`${base}/api/profile`, {
      method: "PUT",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({
        displayName: "Bonga Bhengu", businessName: "Phalamende Meal Palace", industry: "Food", location: "Durban",
        website: "https://chatbliz.online", whatsapp: "+27 82 000 0000"
      })
    });
    assert.equal(profileSave.status, 200);
    assert.equal((await profileSave.json()).profile.businessName, "Phalamende Meal Palace");
    assert.match(profileSave.headers.get("set-cookie"), /Max-Age=31536000/u);
    const refreshedSession = await database.prepare("SELECT expires_at FROM sessions WHERE user_id = ?").bind(signedUp.user.id).first();
    assert.ok(Date.parse(refreshedSession.expires_at) > Date.now() + 364 * 24 * 60 * 60 * 1000);
    const profileRead = await mf.dispatchFetch(`${base}/api/me`, { headers: { cookie } });
    assert.equal((await profileRead.json()).profile.businessName, "Phalamende Meal Palace");

    const chat = await dispatch(`${base}/api/chat`, {
      method: "POST", headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ message: "I need more customers for my business" })
    });
    assert.equal(chat.status, 200);
    const chatResult = await chat.json();
    assert.equal(chatResult.plan.solution.area, "Lead flow and sales");
    const history = await mf.dispatchFetch(`${base}/api/chat`, { headers: { cookie } });
    assert.equal((await history.json()).messages.length, 2);

    const createBuild = await dispatch(`${base}/api/builds`, {
      method: "POST", headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ businessName: "Nokwazi Cover", businessType: "Insurance broker", problem: "Customers struggle to request a quote", goal: "Let customers request a quote online" })
    });
    assert.equal(createBuild.status, 201);
    const savedBuild = (await createBuild.json()).build;
    const saveLearning = await dispatch(`${base}/api/builds/${savedBuild.id}`, {
      method: "PATCH", headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ learningNotes: "Customers want a call-back option after submitting the quote request." })
    });
    assert.equal((await saveLearning.json()).build.learningNotes, "Customers want a call-back option after submitting the quote request.");
    const buildList = await mf.dispatchFetch(`${base}/api/builds`, { headers: { cookie } });
    assert.equal((await buildList.json()).builds[0].id, savedBuild.id);

    const createTask = await dispatch(`${base}/api/tasks`, {
      method: "POST", headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ title: "Record this week's qualified enquiries", sourceMessageId: chatResult.assistantMessageId })
    });
    assert.equal(createTask.status, 201);
    const task = (await createTask.json()).task;
    const markDone = await dispatch(`${base}/api/tasks/${task.id}`, {
      method: "PATCH", headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ status: "done" })
    });
    assert.equal((await markDone.json()).task.status, "done");
    const taskList = await mf.dispatchFetch(`${base}/api/tasks`, { headers: { cookie } });
    assert.equal((await taskList.json()).tasks[0].status, "done");

    const logout = await dispatch(`${base}/api/auth/logout`, { method: "POST", headers: { cookie } });
    assert.equal(logout.status, 200);
    const afterLogout = await mf.dispatchFetch(`${base}/api/me`, { headers: { cookie } });
    assert.equal(afterLogout.status, 401);

    const login = await dispatch(`${base}/api/auth/login`, {
      method: "POST", headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.5" },
      body: JSON.stringify({ email: "Bonga@example.com", password: "A-strong-password-81" })
    });
    assert.equal(login.status, 200);
    const loginCookie = login.headers.get("set-cookie")?.split(";", 1)[0];
    const resumed = await mf.dispatchFetch(`${base}/api/me`, { headers: { cookie: loginCookie } });
    assert.equal((await resumed.json()).profile.businessName, "Phalamende Meal Palace");

    for (let attempt = 0; attempt < 10; attempt++) {
      const denied = await dispatch(`${base}/api/auth/login`, {
        method: "POST", headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.99" },
        body: JSON.stringify({ email: "unknown@example.com", password: "not-the-password" })
      });
      assert.equal(denied.status, 401);
    }
    const rateLimited = await dispatch(`${base}/api/auth/login`, {
      method: "POST", headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.99" },
      body: JSON.stringify({ email: "unknown@example.com", password: "not-the-password" })
    });
    assert.equal(rateLimited.status, 429);

    const secondSignup = await dispatch(`${base}/api/auth/signup`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName: "Second Owner", email: "second@example.com", password: "Another-strong-password-82" })
    });
    const secondCookie = secondSignup.headers.get("set-cookie")?.split(";", 1)[0];
    const secondOwnerTasks = await mf.dispatchFetch(`${base}/api/tasks`, { headers: { cookie: secondCookie } });
    assert.deepEqual((await secondOwnerTasks.json()).tasks, []);
    const secondOwnerBuilds = await mf.dispatchFetch(`${base}/api/builds`, { headers: { cookie: secondCookie } });
    assert.deepEqual((await secondOwnerBuilds.json()).builds, []);
    const crossOwnerEdit = await dispatch(`${base}/api/builds/${savedBuild.id}`, {
      method: "PATCH", headers: { cookie: secondCookie, "content-type": "application/json" },
      body: JSON.stringify({ learningNotes: "This must not change the first owner's project." })
    });
    assert.equal(crossOwnerEdit.status, 404);

    const staticPage = await mf.dispatchFetch(`${base}/`);
    const staticHtml = await staticPage.text();
    assert.equal(staticPage.status, 200, staticHtml);
    assert.match(staticHtml, /Create account/u);
    const appHtml = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
    assert.match(appHtml, /id="technical-repair"/u);
    assert.match(appHtml, /codespaces\/new\?repo=bongabhenguai-art\/chatbliz/u);
    assert.match(appHtml, /id="social-platform"/u);
    const devcontainer = JSON.parse(await readFile(new URL("../.devcontainer/devcontainer.json", import.meta.url), "utf8"));
    assert.deepEqual(devcontainer.forwardPorts, [8787]);
    assert.match(devcontainer.postCreateCommand, /db:apply:local/u);
  } finally {
    await mf.dispose();
  }
});
