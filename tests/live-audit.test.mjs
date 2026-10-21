import test from 'node:test';
import assert from 'node:assert/strict';
import { readPublic } from '../scripts/audit-live.mjs';

test('live audit rejects Access redirects without following them or exposing signed login URLs', async () => {
  const response = new Response(null, { status: 302, headers: { location: 'https://example.cloudflareaccess.com/cdn-cgi/access/login/site?secret=signed' } });
  await assert.rejects(readPublic(response, '/'), error => /Cloudflare Access requires sign-in/.test(error.message) && !error.message.includes('signed'));
});
test('a login page with HTTP 200 and firewall 403 are not counted as a healthy public website', async () => {
  await assert.rejects(readPublic(new Response('<title>Sign in · Cloudflare Access</title>'), '/sitemap.xml'), /login page/);
  await assert.rejects(readPublic(new Response('error code: 1010', { status: 403 }), '/robots.txt'), /HTTP 403/);
});
test('live audit accepts an ordinary unauthenticated public response', async () => {
  assert.equal(await readPublic(new Response('<h1>Clinic</h1>'), '/'), '<h1>Clinic</h1>');
});
