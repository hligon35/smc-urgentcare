import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

/** Public probes never use a staff/patient session or follow an Access sign-in. */
export async function readPublic(response, pathname) {
  const location = response.headers.get('location');
  if (location && /cloudflareaccess\.com|\/cdn-cgi\/access\/login/i.test(location))
    throw new Error(`${pathname}: Cloudflare Access requires sign-in. Exclude public clinic pages, robots.txt, sitemap.xml and static assets from the whole-site Access application; keep staff/private resources protected.`);
  if (response.status !== 200)
    throw new Error(`${pathname}: HTTP ${response.status}; public crawlers and visitors need an unauthenticated 200 response. Check Access/WAF/browser-integrity rules.`);
  const text = await response.text();
  if (/Sign in[^<]*Cloudflare Access|<title>[^<]*Cloudflare Access/i.test(text))
    throw new Error(`${pathname}: received a Cloudflare Access login page instead of clinic content.`);
  return text;
}

export async function auditLive(origin = 'https://smcurgentcareindy.com') {
  const routes = JSON.parse(await readFile(new URL('../src/content/routes.json', import.meta.url), 'utf8'));
  const canonical = new URL(origin).origin;
  const get = async pathname => {
    const response = await fetch(new URL(pathname, canonical), {
      redirect: 'manual', signal: AbortSignal.timeout(20000),
      // A regular browser profile tests the public experience, not crawler allowlists.
      headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36' },
    });
    const text = await readPublic(response, pathname);
    assert.doesNotMatch(response.headers.get('X-Robots-Tag') || '', /noindex/i, `${pathname}: header blocks indexing`);
    return text;
  };
  for (const route of routes) {
    const html = await get(route.path);
    assert.ok(html.includes('id="main"'), `${route.path}: clinic content landmark`);
    assert.ok(html.includes(`rel="canonical" href="${canonical}${route.path}"`), `${route.path}: canonical domain/path`);
    const robots = html.match(/<meta\b[^>]*name="robots"[^>]*content="([^"]+)"/i)?.[1] || '';
    assert.doesNotMatch(robots, /noindex/, `${route.path}: metadata blocks indexing`);
  }
  const robots = await get('/robots.txt');
  assert.doesNotMatch(robots, /^Disallow:\s*\/\s*$/m, 'robots.txt blocks the entire site');
  assert.ok(robots.includes(`Sitemap: ${canonical}/sitemap.xml`), 'robots.txt advertises sitemap');
  const sitemap = await get('/sitemap.xml');
  assert.match(sitemap, /<urlset\b/);
  assert.deepEqual([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]).sort(), routes.map(route => canonical + route.path).sort(), 'All canonical public pages in sitemap');
  console.log(`PASS: ${routes.length} public pages, canonical/indexability checks, robots.txt and complete sitemap at ${canonical}.`);
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url)
  auditLive(process.argv[2]).catch(error => { console.error('LIVE AUDIT FAILED: ' + error.message); process.exitCode = 1; });
