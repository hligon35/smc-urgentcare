import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import worker from '../worker/index.mjs';

test('public website serves custom and workers.dev hosts without patient authentication', async () => {
  const config = JSON.parse(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
  assert.equal(config.workers_dev, true);
  assert.equal(config.env.production.workers_dev, true);
  assert.equal(config.env.sandbox.workers_dev, true);
  for (const [host, environment] of [['smcurgentcareindy.com', 'production'], ['smc-urgentcare-production.hligon.workers.dev', 'production'], ['smc-urgentcare.hligon.workers.dev', 'sandbox']]) {
    for (const path of ['/', '/services', '/contact']) {
      const response = await worker.fetch(new Request('https://' + host + path), { ENVIRONMENT: environment, ASSETS: { fetch: async () => new Response('Public website', { headers: { 'Content-Type': 'text/html' } }) } });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('Location'), null);
      assert.equal(response.headers.has('Set-Cookie'), false);
      assert.equal(response.headers.get('X-Robots-Tag'), host.endsWith('.workers.dev') ? 'noindex, nofollow' : null);
    }
  }
});
