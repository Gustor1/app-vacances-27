import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlanningExtractionHandler, planningOutputSchema } from '../server/planning-extraction.mjs';
import { getExtractionAvailability, extractPlanning } from '../src/planning-import/extraction.ts';

const source = 'Paris\nJour 1\nLouvre';
const evidence = quote => ({ origin: 'source', quote });
const draft = { version: 1, title: 'Paris', evidence: { title: evidence('Paris') }, notes: [],
  cities: [{ name: 'Paris', evidence: { name: evidence('Paris') }, days: [{ title: 'Jour 1', date: '',
    evidence: { title: evidence('Jour 1') }, items: [{ title: 'Louvre', category: 'visit', description: '', address: '',
      period: '', time: '', optional: false, booked: false, kind: 'activity', coordinates: null,
      checkIn: '', checkOut: '', departure: '', arrival: '', toCity: '', mode: 'other', reference: '', excluded: false,
      evidence: { title: evidence('Louvre') } }] }] }] };
const request = (body = { source }, options = {}) => new Request('https://detours.test/api/planning-extraction', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer synthetic-test-token' }, body: JSON.stringify(body), ...options,
});
const upstream = value => Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }] });
const configured = overrides => createPlanningExtractionHandler({ enabled: true, apiKey: 'synthetic-test-key',
  authenticate: async () => ({ id: 'synthetic-account' }), consumeQuota: async () => true,
  fetchImpl: async () => upstream(draft), ...overrides });

test('extraction client is unavailable without an explicit build flag; no simulated result', async () => {
  assert.equal(getExtractionAvailability(), false);
  await assert.rejects(extractPlanning(source), error => error.code === 'unavailable');
});
test('endpoint fails closed when enablement, auth or quota adapter is absent', async () => {
  for (const overrides of [{ enabled: false }, { authenticate: undefined }, { consumeQuota: undefined }, { apiKey: '' }]) {
    let calls = 0;
    const handler = configured({ ...overrides, fetchImpl: async () => { calls++; return upstream(draft); } });
    assert.equal((await handler(request())).status, 503); assert.equal(calls, 0);
  }
});
test('authentication, source bounds and atomic quota precede a provider call', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls++; return upstream(draft); };
  assert.equal((await configured({ authenticate: async () => null, fetchImpl })(request())).status, 401);
  assert.equal((await configured({ fetchImpl })(request({ source: 'x'.repeat(50_001) }))).status, 400);
  assert.equal((await configured({ fetchImpl })(request({ source, injected: true }))).status, 400);
  assert.equal((await configured({ consumeQuota: async () => false, fetchImpl })(request())).status, 429);
  assert.equal((await configured({ consumeQuota: async () => { throw new Error('durable quota offline'); }, fetchImpl })(request())).status, 503);
  assert.equal(calls, 0);
});
test('provider receives only source plus extraction instructions, bounded strict output and no tools', async () => {
  const events = [];
  const handler = configured({ consumeQuota: async (id, reservation) => {
    events.push('quota'); assert.equal(id, 'synthetic-account'); assert.equal(reservation.maxOutputTokens, 12_000); return true;
  }, fetchImpl: async (url, options) => {
    events.push('provider'); assert.equal(url, 'https://api.openai.com/v1/responses');
    const payload = JSON.parse(options.body);
    assert.equal(payload.input[0].content, source); assert.equal(payload.store, false);
    assert.equal(payload.text.format.strict, true); assert.deepEqual(payload.text.format.schema, planningOutputSchema);
    assert.equal(payload.tools, undefined); return upstream(draft);
  } });
  const response = await handler(request()); assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), draft); assert.deepEqual(events, ['quota', 'provider']);
});
test('invalid, hallucinated, incomplete, oversized outputs and provider errors are rejected without retries', async () => {
  const hallucinated = structuredClone(draft); hallucinated.title = 'Rome'; hallucinated.evidence.title.quote = 'Rome';
  const responses = [upstream({ version: 1 }), upstream(hallucinated), Response.json({ status: 'incomplete', output: [] }),
    new Response('x'.repeat(1_000_001)), new Response('provider error', { status: 429 })];
  for (const response of responses) {
    let calls = 0;
    const result = await configured({ fetchImpl: async () => { calls++; return response; } })(request());
    assert.equal(result.status, 502); assert.equal(calls, 1);
  }
});
test('cancellation and bounded provider timeout abort fetch and create no draft response', async () => {
  for (const cancelled of [false, true]) {
    const controller = new AbortController();
    const handler = configured({ timeoutMs: 15, fetchImpl: async (_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    }) });
    const pending = handler(request({ source }, { signal: controller.signal }));
    if (cancelled) setTimeout(() => controller.abort(), 5);
    const keepAlive = setTimeout(() => {}, 100);
    try { assert.equal((await pending).status, 504); } finally { clearTimeout(keepAlive); }
  }
});
test('timeout bounds authentication and quota adapters even when they ignore cancellation', async () => {
  for (const adapter of ['authenticate', 'consumeQuota']) {
    let calls = 0;
    const handler = configured({ timeoutMs: 10, [adapter]: async () => new Promise(() => {}),
      fetchImpl: async () => { calls++; return upstream(draft); } });
    const keepAlive = setTimeout(() => {}, 100);
    try { assert.equal((await handler(request())).status, 504); assert.equal(calls, 0); }
    finally { clearTimeout(keepAlive); }
  }
});
