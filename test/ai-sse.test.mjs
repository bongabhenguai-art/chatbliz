import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as sleep } from 'node:timers/promises';

async function withServer(apiKey, callback) {
  const port = 31000 + Math.floor(Math.random() * 20000);
  const env = { ...process.env, PORT: String(port) };
  if (apiKey === null) delete env.OPENAI_API_KEY;
  else env.OPENAI_API_KEY = apiKey;
  const child = spawn(process.execPath, ['server.mjs'], {
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 50; attempt++) {
      if (child.exitCode !== null) throw new Error('Server exited unexpectedly');
      try {
        const response = await fetch(`http://127.0.0.1:${port}/healthz`);
        if (response.ok) { ready = true; break; }
      } catch {}
      await sleep(100);
    }
    assert.equal(ready, true, 'Server did not start');
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    child.kill();
    await Promise.race([once(child, 'exit').catch(() => {}), sleep(1000)]);
  }
}

async function assertErrorEvent(response, expectedStatus, expectedError) {
  assert.equal(response.status, expectedStatus);
  assert.match(response.headers.get('content-type') || '', /^text\/event-stream/);
  const body = await response.text();
  const match = /^data: ([^\n]+)\n\n$/.exec(body);
  assert.ok(match, 'Expected exactly one newline-terminated SSE data event');
  assert.deepEqual(JSON.parse(match[1]), { error: expectedError });
}

test('AI chat missing provider key returns parseable SSE error', { timeout: 12000 }, async () => {
  await withServer(null, async base => {
    const response = await fetch(`${base}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] })
    });
    await assertErrorEvent(response, 503, 'AI provider is not configured');
  });
});

test('AI chat malformed JSON returns parseable SSE error without contacting provider', { timeout: 12000 }, async () => {
  await withServer('test-key-not-used', async base => {
    const response = await fetch(`${base}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalid'
    });
    await assertErrorEvent(response, 400, 'Invalid chat request');
  });
});
