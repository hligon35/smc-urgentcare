import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { isInertScript, exportedHtmlFiles } from './export-scripts.mjs';

// Preserve static content, styles, image preloads and structured data. Public routes
// use a small enhancer and a contact-only form script.
export function staticPublicHtml(html, scriptPath, contactScriptPath) {
  const cleaned = html
    .replace(/<script\b([^>]*)>[\s\S]*?<\/script\s*>/gi, (script, attributes) => isInertScript(attributes) ? script : '')
    .replace(/<link\b[^>]*>/gi, link => /\b(?:as=["']script["']|rel=["']modulepreload["'])/i.test(link) ? '' : link)
    .replace(/<noscript data-public-fallback>[\s\S]*?<\/noscript>/g, '');
  const fallback = '<noscript data-public-fallback><style>@media(max-width:1280px){header{position:static}.nav{height:auto;flex-wrap:wrap;padding-block:16px}.nav .links{display:flex;position:static;width:100%;max-height:none;flex-wrap:wrap;box-shadow:none;padding:8px 0}.nav .nav-actions{display:none}.links .menu-portal{display:inline-flex!important}}.tabs{display:none}</style></noscript>';
  return cleaned.replace('</head>', `${fallback}<script defer src="${scriptPath}"></script>${contactScriptPath ? `<script defer src="${contactScriptPath}"></script>` : ""}</head>`);
}
async function prepareRuntime(directory, file, prefix) {
  const code = await readFile(new URL(file, import.meta.url), 'utf8');
  if (Buffer.byteLength(code) > 6_000) throw new Error('Page script exceeds its 6 KB budget.');
  const hash = createHash('sha256').update(code).digest('hex').slice(0, 24);
  const relative = `/_expo/static/js/web/${prefix}-${hash}.js`;
  await mkdir(path.join(directory, '_expo/static/js/web'), { recursive: true });
  await writeFile(path.join(directory, relative.slice(1)), code);
  return relative;
}

export const preparePublicRuntime = directory => prepareRuntime(directory, './public-site.js', 'public');
export const prepareContactRuntime = directory => prepareRuntime(directory, './contact-form.js', 'contact');

// The final static pages use standalone enhancers. Expo's now-unreferenced
// hydration chunks must not be packaged with the public Worker assets.
export async function pruneApplicationScripts(directory) {
  const scriptDirectory = path.join(directory, "_expo/static/js/web");
  const used = new Set();
  for await (const file of exportedHtmlFiles(directory)) {
    const html = await readFile(file, "utf8");
    for (const [, source] of html.matchAll(/<script\b[^>]*\bsrc="(\/_expo\/static\/js\/web\/[^"?#]+)"/gi))
      used.add(path.basename(source));
  }
  let removed = 0;
  for (const entry of await readdir(scriptDirectory, { withFileTypes: true })) {
    if (entry.isFile() && /\.(?:js|js\.map)$/.test(entry.name) && !used.has(entry.name)) {
      await rm(path.join(scriptDirectory, entry.name));
      removed++;
    }
  }
  return removed;
}
