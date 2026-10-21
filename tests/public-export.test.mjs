import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { staticPublicHtml } from '../scripts/public-export.mjs';

const script = '/_expo/static/js/web/public-test.js';
test('public export retains crawlable content, styles and JSON-LD while removing the application runtime', () => {
  const html = '<html><head><link rel="preload" as="image" href="/hero.webp"><link rel="preload" href="/entry.js" as="script"><link rel="modulepreload" href="/chunk.js"><link rel="stylesheet" href="/_expo/static/css/global-hash.css"><script type="application/ld+json">{"@type":"MedicalClinic"}</script></head><body><h1>Clinic information</h1><script>window.bootstrap=1</script><script defer src="/entry.js"></script></body></html>';
  const result = staticPublicHtml(html, script);
  assert.match(result, /<h1>Clinic information<\/h1>/);
  assert.match(result, /as="image"/);
  assert.match(result, /global-hash.css/);
  assert.match(result, /type="application\/ld\+json"/);
  assert.doesNotMatch(result, /bootstrap|entry.js|chunk.js/);
  assert.match(result, /<noscript data-public-fallback>/);
  assert.ok(result.includes(`<script defer src="${script}"></script>`));
  assert.equal(staticPublicHtml(result, script), result, 'Reprocessing does not accumulate scripts/fallbacks');
});

const prepareScript = fileURLToPath(new URL('../scripts/prepare-web.mjs', import.meta.url));
async function fixture() {
  const dir = await mkdtemp(path.join(tmpdir(), 'smc-search-'));
  await mkdir(path.join(dir, 'src/config'), { recursive: true });
  await mkdir(path.join(dir, 'src/content'), { recursive: true });
  await mkdir(path.join(dir, 'dist'), { recursive: true });
  for (const file of ['src/config/clinic.json', 'src/content/routes.json'])
    await writeFile(path.join(dir, file), await readFile(new URL('../' + file, import.meta.url)));
  const routes = JSON.parse(await readFile(path.join(dir, 'src/content/routes.json')));
  const html = '<html><head><title>Clinic</title><meta name="description" content="Clinic information"></head><body><img src="/images/example-v1.webp"><script>window.bootstrap=1</script><script src="/_expo/entry.js"></script></body></html>';
  for (const route of routes) await writeFile(path.join(dir, 'dist', route.id === 'home' ? 'index.html' : `${route.id}.html`), html);
  await writeFile(path.join(dir, 'dist/+not-found.html'), html);
  return { dir, routes };
}
test('sitemap includes every public page and its images; sandbox stays uncrawlable; contact script is contact-only', async () => {
  const { dir, routes } = await fixture();
  try {
    const run = origin => spawnSync(process.execPath, [prepareScript], { cwd: dir, env: { ...process.env, EXPO_PUBLIC_SITE_URL: origin }, encoding: 'utf8' });
    const origin = 'https://smcurgentcareindy.com';
    const first = run(origin); assert.equal(first.status, 0, first.stderr);
    const xml = await readFile(path.join(dir, 'dist/sitemap.xml'), 'utf8');
    assert.deepEqual([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]), routes.map(r => origin + r.path));
    assert.match(xml, /<image:loc>https:\/\/smcurgentcareindy.com\/images\/example-v1.webp<\/image:loc>/);
    assert.doesNotMatch(xml, /\/portal|404|lastmod/);
    const contact = await readFile(path.join(dir, 'dist/contact.html'), 'utf8');
    const home = await readFile(path.join(dir, 'dist/index.html'), 'utf8');
    assert.match(contact, /src="\/_expo\/static\/js\/web\/contact-[a-f0-9]{24}\.js"/);
    assert.doesNotMatch(home, /src="[^"]*contact-[a-f0-9]{24}\.js"/);
    assert.equal(run(origin).status, 0, 'Repeat export succeeds');
    assert.equal(await readFile(path.join(dir, 'dist/sitemap.xml'), 'utf8'), xml);
    const sandbox = run('https://smc-urgentcare-sandbox.hligon.workers.dev'); assert.equal(sandbox.status, 0, sandbox.stderr);
    assert.equal(await readFile(path.join(dir, 'dist/robots.txt'), 'utf8'), 'User-agent: *\nDisallow: /\n');
    await writeFile(path.join(dir, 'dist/new-public-page.html'), '<html></html>');
    const missing = run(origin); assert.notEqual(missing.status, 0);
    assert.match(missing.stderr, /missing from the route registry\/sitemap/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
