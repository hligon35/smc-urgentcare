import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isInertScript } from './export-scripts.mjs';

// Preserve static content, styles, image preloads and structured data. Public routes
// use a small enhancer; the independently exported portal keeps its Expo runtime.
export function staticPublicHtml(html, scriptPath) {
  const cleaned = html
    .replace(/<script\b([^>]*)>[\s\S]*?<\/script\s*>/gi, (script, attributes) => isInertScript(attributes) ? script : '')
    .replace(/<link\b[^>]*>/gi, link => /\b(?:as=["']script["']|rel=["']modulepreload["'])/i.test(link) || /href=["'][^"']*\/portal-[^"']+\.css/i.test(link) ? '' : link)
    .replace(/<noscript data-public-fallback>[\s\S]*?<\/noscript>/g, '');
  const fallback = '<noscript data-public-fallback><style>@media(max-width:1280px){header{position:static}.nav{height:auto;flex-wrap:wrap;padding-block:16px}.nav .links{display:flex;position:static;width:100%;max-height:none;flex-wrap:wrap;box-shadow:none;padding:8px 0}.nav .nav-actions{display:none}.links .menu-portal{display:inline-flex!important}}.tabs{display:none}</style></noscript>';
  return cleaned.replace('</head>', `${fallback}<script defer src="${scriptPath}"></script></head>`);
}
export async function preparePublicRuntime(directory) {
  const code = await readFile(new URL('./public-site.js', import.meta.url), 'utf8');
  if (Buffer.byteLength(code) > 6_000) throw new Error('Public script exceeds its 6 KB budget.');
  const hash = createHash('sha256').update(code).digest('hex').slice(0, 24);
  const relative = `/_expo/static/js/web/public-${hash}.js`;
  await mkdir(path.join(directory, '_expo/static/js/web'), { recursive: true });
  await writeFile(path.join(directory, relative.slice(1)), code);
  return relative;
}
