import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.mjs';

const origin = 'https://smcurgentcareindy.com';
const payload = { name: 'Sam Sample', email: 'sam@example.test', topic: 'General question', message: 'What are your current opening hours?', privacyAccepted: true, website: '', turnstileToken: 'valid-token' };
function setup() {
  const sent = [], rateKeys = [];
  return { sent, rateKeys, env: { ENVIRONMENT: 'production', SITE_ORIGIN: origin, CONTACT_ALLOWED_ORIGINS: origin, CONTACT_TO: 'front-desk@alphazonelabs.com', CONTACT_FROM: 'front-desk@alphazonelabs.com', TURNSTILE_SITE_KEY: 'test-site', TURNSTILE_SECRET_KEY: 'test-secret', CONTACT_RATE_LIMITER: { async limit({ key }) { rateKeys.push(key); return { success: true }; } }, CONTACT_EMAIL: { async send(message) { sent.push(message); return { messageId: 'test' }; } } } };
}
const request = (data = payload, headers = {}, path = '/api/contact') => new Request(origin + path, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...headers }, body: typeof data === 'string' ? data : JSON.stringify(data) });
function verify(fn) {
  const saved = globalThis.fetch;
  globalThis.fetch = fn;
  return () => { globalThis.fetch = saved; };
}
const valid = async url => { assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify'); return Response.json({ success: true, hostname: 'smcurgentcareindy.com', action: 'contact_form' }); };

test('recipient is deliberately unset: readiness stays false and no submission can be accepted', async () => {
  const { env, sent } = setup(); env.CONTACT_TO = '';
  const config = await worker.fetch(new Request(origin + '/api/contact/config'), env);
  assert.deepEqual(await config.json(), { ready: false, turnstileReady: true, siteKey: 'test-site' });
  assert.equal(config.headers.get('Cache-Control'), 'no-store');
  const result = await worker.fetch(request(), env);
  assert.equal(result.status, 503); assert.equal((await result.json()).ok, false); assert.equal(sent.length, 0);
});
test('validated general message goes only to configured Cloudflare destination with a safe reply address', async () => {
  const { env, sent, rateKeys } = setup(); const restore = verify(valid);
  try {
    const response = await worker.fetch(request(), env);
    assert.equal(response.status, 200); assert.equal((await response.json()).ok, true);
    assert.equal(sent.length, 2); assert.equal(sent[0].to, env.CONTACT_TO); assert.equal(sent[0].from, env.CONTACT_FROM); assert.equal(sent[0].replyTo, payload.email);
    assert.equal(sent[0].subject, 'SMC website contact: General question'); assert.ok(sent[0].text.includes(payload.message));
    assert.equal(sent[0].html, undefined); assert.equal(sent[0].attachments, undefined);
    assert.equal(sent[1].to, payload.email); assert.match(sent[1].html, /smc-logo-v1\.png/);
    assert.match(rateKeys[0], /^contact:[a-f0-9]{64}$/); assert.ok(!rateKeys[0].includes(payload.email));
    assert.equal(response.headers.get('Cache-Control'), 'no-store'); assert.equal(response.headers.has('Set-Cookie'), false);
  } finally { restore(); }
});
test('origin checks reject other hosts, missing origins and cross-site requests before any email', async () => {
  const { env, sent } = setup();
  for (const headers of [{ Origin: 'https://evil.example' }, { Origin: '' }, { 'Sec-Fetch-Site': 'cross-site' }]) assert.equal((await worker.fetch(request(payload, headers), env)).status, 403);
  const other = new Request('https://evil.example/api/contact', { method: 'POST', headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  assert.equal((await worker.fetch(other, env)).status, 403); assert.equal(sent.length, 0);
});
test('invalid fields, injection, spam trap, arbitrary recipients and missing consent never send email', async () => {
  const { env, sent } = setup();
  for (const changes of [{ email: 'sam@example.test\r\nBcc: victim@example.test' }, { name: 'A\r\nBcc: bad' }, { topic: 'Injected subject' }, { message: 'short' }, { message: 'x'.repeat(2001) }, { privacyAccepted: false }, { website: 'https://spam.example' }, { turnstileToken: '' }, { to: 'attacker@example.test' }, { attachment: 'file' }]) {
    const response = await worker.fetch(request({ ...payload, ...changes }), env); assert.equal(response.status, 400, JSON.stringify(changes));
  }
  assert.equal(sent.length, 0);
});
test('content type, malformed JSON and oversized bodies are rejected, even without a Content-Length', async () => {
  const { env, sent } = setup();
  assert.equal((await worker.fetch(request(payload, { 'Content-Type': 'text/plain' }), env)).status, 415);
  assert.equal((await worker.fetch(request('not JSON'), env)).status, 400);
  assert.equal((await worker.fetch(request('x'.repeat(17000)), env)).status, 413);
  assert.equal(sent.length, 0);
});
test('email rate limits reject before security calls and never send', async () => {
  const { env, sent } = setup(); env.CONTACT_RATE_LIMITER.limit = async () => ({ success: false });
  const restore = verify(() => { throw Error('No verification call expected'); });
  try { const response = await worker.fetch(request(), env); assert.equal(response.status, 429); assert.equal(response.headers.get('Retry-After'), '60'); assert.equal(sent.length, 0); } finally { restore(); }
});
test('Turnstile must prove success, current hostname and contact action; no replay acceptance is simulated', async () => {
  const { env, sent } = setup();
  for (const result of [{ success: false, 'error-codes': ['timeout-or-duplicate'] }, { success: true, hostname: 'other.example', action: 'contact_form' }, { success: true, hostname: 'smcurgentcareindy.com', action: 'other_action' }]) {
    const restore = verify(async () => Response.json(result));
    try { assert.equal((await worker.fetch(request(), env)).status, 403); } finally { restore(); }
  }
  assert.equal(sent.length, 0);
});
test('verification and email-provider failures are safe errors, not false successes or leaked exceptions', async () => {
  const { env } = setup();
  let restore = verify(async () => { throw Error('private provider details'); });
  try { const response = await worker.fetch(request(), env); assert.equal(response.status, 503); assert.ok(!(await response.text()).includes('private')); } finally { restore(); }
  env.CONTACT_EMAIL.send = async () => { throw Error('recipient@example.test private provider details'); }; restore = verify(valid);
  try { const response = await worker.fetch(request(), env); assert.equal(response.status, 503); const text = await response.text(); assert.ok(!text.includes('private')); assert.ok(!text.includes(env.CONTACT_TO)); } finally { restore(); }
});
test('misconfigured mail or protection bindings keep the contact endpoint closed', async () => {
  for (const key of ['CONTACT_TO', 'CONTACT_FROM', 'TURNSTILE_SITE_KEY', 'TURNSTILE_SECRET_KEY', 'CONTACT_EMAIL', 'CONTACT_RATE_LIMITER']) {
    const { env } = setup(); delete env[key];
    assert.equal((await worker.fetch(request(), env)).status, 503, key);
    const configuration = await (await worker.fetch(new Request(origin + '/api/contact/config'), env)).json();
    assert.equal(configuration.ready, false);
    assert.equal(configuration.turnstileReady, !['TURNSTILE_SITE_KEY', 'TURNSTILE_SECRET_KEY'].includes(key));
  }
});
