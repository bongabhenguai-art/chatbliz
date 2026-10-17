import test from "node:test";
import assert from "node:assert/strict";
import { createStudioSpeechService } from "../src/studio-speech.mjs";

test("unauthorized accounts cannot trigger paid generation", async () => {
  let calls = 0;
  const studio = createStudioSpeechService({
    authorize: async () => false,
    provider: { invoke: async () => { calls++; } }
  });
  await assert.rejects(studio.generate({ userId: "user", businessId: "business", text: "Hello" }), /not permitted/);
  assert.equal(calls, 0);
});

test("rejects empty and excessive speech before calling provider", async () => {
  let calls = 0;
  const studio = createStudioSpeechService({
    authorize: async () => true,
    provider: { invoke: async () => { calls++; } }
  });
  await assert.rejects(studio.generate({ text: "" }), TypeError);
  await assert.rejects(studio.generate({ text: "a".repeat(1501) }), TypeError);
  await assert.rejects(studio.generate({ text: "Hello", voice: "unknown" }), TypeError);
  assert.equal(calls, 0);
});

test("authorized speech generation uses a controlled payload", async () => {
  let request;
  const studio = createStudioSpeechService({
    authorize: async ({ capability }) => capability === "studio.speech",
    provider: { invoke: async input => { request = input; return { ok: true }; } }
  });
  assert.deepEqual(await studio.generate({ userId: "user", businessId: "business", text: " Welcome " }), { ok: true });
  assert.equal(request.payload.text, "Welcome");
  assert.equal(request.payload.stream, false);
  assert.equal(request.payload.audio_setting.format, "mp3");
});
