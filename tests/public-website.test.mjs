import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import worker from '../worker/index.mjs';

test('public website serves custom and workers.dev hosts without patient authentication', async () => {
  const config = JSON.parse(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
  assert.equal(config.workers_dev, true);
  assert.equal(config.env.production.workers_dev, true);
  assert.equal(config.env.sandbox.workers_dev, true);
  for (const [host, environment] of [['smcurgentcareindy.com', 'production'], ['smc-urgentcare.hligon.workers.dev', 'production'], ['smc-urgentcare-sandbox.hligon.workers.dev', 'sandbox']]) {
    for (const path of ['/', '/services', '/contact']) {
      const response = await worker.fetch(new Request('https://' + host + path), { ENVIRONMENT: environment, ASSETS: { fetch: async () => new Response('Public website', { headers: { 'Content-Type': 'text/html' } }) } });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('Location'), null);
      assert.equal(response.headers.has('Set-Cookie'), false);
      assert.equal(response.headers.get('X-Robots-Tag'), host.endsWith('.workers.dev') ? 'noindex, nofollow' : null);
    }
  }
});

test('deployment targets preserve domain ownership and isolate sandbox data and routes', async () => {
  const config = JSON.parse(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
  assert.equal(config.name, 'smc-urgentcare');
  assert.equal(config.env.production.name, config.name);
  assert.equal(config.env.sandbox.name, 'smc-urgentcare-sandbox');
  assert.deepEqual(config.env.production.routes, config.routes);
  assert.deepEqual(config.routes.map(route => route.pattern).sort(), ['smcurgentcareindy.com', 'www.smcurgentcareindy.com']);
  assert.ok(config.routes.every(route => route.custom_domain === true));
  assert.deepEqual(config.env.sandbox.routes, []);
  assert.notEqual(config.env.sandbox.d1_databases[0].database_id, config.env.production.d1_databases[0].database_id);
  assert.deepEqual(config.d1_databases, config.env.production.d1_databases);
  const sandboxOrigin = 'https://' + config.env.sandbox.name + '.hligon.workers.dev';
  assert.equal(config.env.sandbox.vars.AUTH_ORIGIN, sandboxOrigin);
  assert.equal(config.env.sandbox.vars.AUTH_ALLOWED_ORIGINS, sandboxOrigin);
  const template = await readFile(new URL('../.env.sandbox.example', import.meta.url), 'utf8');
  assert.ok(template.includes('EXPO_PUBLIC_SITE_URL=' + sandboxOrigin));
});
