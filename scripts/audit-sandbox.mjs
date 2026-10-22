import assert from 'node:assert/strict';
const origin = 'https://smc-urgentcare-sandbox.hligon.workers.dev';
const get = async (path) => {
  const response = await fetch(new URL(path, origin), { redirect: 'manual', signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, 200, path + ': HTTP ' + response.status);
  return response;
};
const page = await get('/');
const html = await page.text();
assert.match(html, /<main\\b[^>]*id="main"/, 'Expected server-rendered content');
assert.match(html, /A little care\\./, 'Expected visible hero text');
assert.match(page.headers.get('x-robots-tag') || '', /noindex/, 'Sandbox must remain unindexed');
const assets = [...new Set([...html.matchAll(/(?:href|src)="(\\/(?:_expo\\/static\\/(?:css|js)\\/|images\\/)[^"#?]+)"/g)].map(m => m[1]))];
assert.ok(assets.some(url => url.endsWith('.css')), 'CSS must be linked');
assert.ok(assets.some(url => url.endsWith('.js')), 'Public script must be linked');
for (const asset of assets) {
  const response = await get(asset);
  const type = response.headers.get('content-type') || '';
  if (asset.endsWith('.css')) assert.match(type, /text\\/css/, asset + ': CSS MIME type');
  if (asset.endsWith('.js')) assert.match(type, /javascript/, asset + ': JavaScript MIME type');
  if (/\\.(?:png|webp|jpg)$/.test(asset)) assert.match(type, /image\\//, asset + ': image MIME type');
  const body = await response.arrayBuffer();
  assert.ok(body.byteLength > 0, asset + ': asset must not be empty');
  console.log('PASS', asset, response.status, type, body.byteLength, 'bytes');
}
console.log('PASS sandbox homepage, anti-indexing and ' + assets.length + ' critical assets. If the browser stays blank, check embedded-frame blocking, extensions and DevTools errors.');
