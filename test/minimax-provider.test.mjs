import test from "node:test";
import assert from "node:assert/strict";
import { createMiniMaxProvider } from "../src/minimax-provider.mjs";

test("rejects unsafe endpoints and missing keys", () => {
  assert.throws(() => createMiniMaxProvider({ apiKey: "short", endpoint: "https://api.minimax.io/v1" }));
  assert.throws(() => createMiniMaxProvider({ apiKey: "server-secret-key", endpoint: "https://example.org/collect" }));
  assert.throws(() => createMiniMaxProvider({ apiKey: "server-secret-key", endpoint: "http://api.minimax.io/v1" }));
});

test("uses server token and returns provider response", async () => {
  let called;
  const provider = createMiniMaxProvider({
    apiKey: "server-secret-key",
    endpoint: "https://api.minimax.io/v1/t2a_v2",
    fetchImpl: async (url, options) => {
      called = { url, options };
      return { ok: true, json: async () => ({ task_id: "example" }) };
    }
  });
  const result = await provider.invoke({ payload: { text: "Welcome to Chatbliz" } });
  assert.deepEqual(result, { task_id: "example" });
  assert.equal(called.options.headers.Authorization, "Bearer server-secret-key");
  assert.equal(called.options.method, "POST");
});

test("does not expose provider error response bodies", async () => {
  const provider = createMiniMaxProvider({
    apiKey: "server-secret-key",
    endpoint: "https://api.minimax.io/v1/t2a_v2",
    fetchImpl: async () => ({ ok: false, status: 401 })
  });
  await assert.rejects(provider.invoke({ payload: { text: "test" } }), /provider request failed/);
});
