import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Expo exports routes in both top-level and nested directories. Process *every*
// generated HTML page, not just files in dist/, before the Worker serves them.
export async function* exportedHtmlFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* exportedHtmlFiles(file);
    else if (entry.isFile() && entry.name.endsWith(".html")) yield file;
  }
}

export function isInertScript(attributes) {
  const type = attributes.match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
  return type === "application/json" || type === "application/ld+json";
}

/**
 * Move executable inline scripts (including Expo hydration bootstraps) into
 * deterministic same-origin JS files. Never require unsafe-inline in CSP.
 * Preserve inert JSON data scripts for metadata and initial state.
 */
export async function externalizeInlineScripts(directory) {
  const assetDirectory = path.join(directory, "_expo", "static", "js", "web");
  await mkdir(assetDirectory, { recursive: true });
  let pages = 0;
  let externalized = 0;
  for await (const file of exportedHtmlFiles(directory)) {
    const assets = [];
    const html = (await readFile(file, "utf8")).replace(
      /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi,
      (original, attributes, source) => {
        if (!source.trim() || /\bsrc\s*=/i.test(attributes) || isInertScript(attributes))
          return original;
        const hash = createHash("sha256").update(source).digest("hex").slice(0, 24);
        const filename = `init-${hash}.js`;
        assets.push([filename, source]);
        externalized++;
        return `<script${attributes} src="/_expo/static/js/web/${filename}"></script>`;
      },
    );
    for (const [filename, source] of assets)
      await writeFile(path.join(assetDirectory, filename), source);
    await writeFile(file, html);
    pages++;
  }
  return { pages, externalized };
}
