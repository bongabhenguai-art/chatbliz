import test from "node:test";
import assert from "node:assert/strict";
import { createCustomerTaskHandler } from "../src/customer-task-handler.mjs";

function response() {
  return { status: null, body: null, writeHead(status) { this.status = status; }, end(body) { this.body = JSON.parse(body); } };
}

test("anonymous customers cannot read tasks", async () => {
  let called = false;
  const handler = createCustomerTaskHandler({
    verifySession: async () => null,
    repository: { list: async () => { called = true; }, get: async () => { called = true; } }
  });
  const res = response();
  assert.equal(await handler({ method: "GET" }, res, "/api/customer/tasks"), true);
  assert.equal(res.status, 401);
  assert.equal(called, false);
});

test("reads are scoped to server verified identity", async () => {
  let actual;
  const handler = createCustomerTaskHandler({
    verifySession: async () => ({ userId: "11111111-1111-4111-8111-111111111111", businessId: "22222222-2222-4222-8222-222222222222" }),
    repository: { list: async scope => { actual = scope; return []; }, get: async () => null }
  });
  const res = response();
  await handler({ method: "GET", headers: { "x-business-id": "other-business" } }, res, "/api/customer/tasks");
  assert.equal(res.status, 200);
  assert.deepEqual(actual, { userId: "11111111-1111-4111-8111-111111111111", businessId: "22222222-2222-4222-8222-222222222222" });
});

test("unrecognized task routes are rejected", async () => {
  const handler = createCustomerTaskHandler({
    verifySession: async () => ({ userId: "11111111-1111-4111-8111-111111111111", businessId: "22222222-2222-4222-8222-222222222222" }),
    repository: { list: async () => [], get: async () => null }
  });
  const res = response();
  await handler({ method: "POST" }, res, "/api/customer/tasks");
  assert.equal(res.status, 404);
});

test("rejects malformed identities before accessing repository", async () => {
  let called = false;
  const handler = createCustomerTaskHandler({
    verifySession: async () => ({ userId: "not-a-uuid", businessId: "also-invalid" }),
    repository: { list: async () => { called = true; }, get: async () => { called = true; } }
  });
  const res = response();
  await handler({ method: "GET" }, res, "/api/customer/tasks");
  assert.equal(res.status, 401);
  assert.equal(called, false);
});
