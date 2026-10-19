import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
const routes = JSON.parse(await readFile("src/content/routes.json", "utf8"));
const clinic = JSON.parse(await readFile("src/config/clinic.json", "utf8"));
const pages = await Promise.all(
  [
    ...routes.map((route) =>
      route.id === "home" ? "index.html" : `${route.id}.html`,
    ),
    "404.html",
  ].map(async (file) => ({
    file,
    html: await readFile(path.join("dist", file), "utf8"),
  })),
);
const headers = [],
  footers = [];
for (const { file, html } of pages) {
  assert.match(html, /<html[^>]*lang="en"/, `${file}: document language`);
  assert.match(html, /<title>[^<]+<\/title>/, `${file}: static title`);
  assert.match(
    html,
    /name="description" content="[^"]+"/,
    `${file}: static description`,
  );
  assert.equal(
    (html.match(/<h1(?:\s|>)/g) || []).length,
    1,
    `${file}: one page heading`,
  );
  assert.match(html, /id="main"/, `${file}: skip link destination`);
  assert.ok(html.includes(clinic.portalUrl), `${file}: configured portal link`);
  headers.push(
    html
      .match(/<header>[\s\S]*?<\/header>/)?.[0]
      ?.replace(/ aria-current="page"/g, ""),
  );
  footers.push(html.match(/<footer[^>]*>[\s\S]*?<\/footer>/)?.[0]);
  for (const [, attrs, code] of html.matchAll(
    /<script([^>]*)>([\s\S]*?)<\/script>/g,
  )) {
    assert.ok(
      !code.trim() || /type="application\/ld\+json"/.test(attrs),
      `${file}: executable inline script would violate CSP`,
    );
  }
  const ids = new Set(
    [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]),
  );
  for (const [, href] of html.matchAll(
    /\bhref="(\/[^"?#]*)(?:\?[^"#]*)?(?:#[^"]*)?"/g,
  )) {
    const pathname = href === "/" ? "index.html" : href.slice(1);
    const resolved = path.join("dist", pathname);
    if (path.extname(resolved)) await stat(resolved);
    else await stat(`${resolved}.html`);
  }
  for (const [, id] of html.matchAll(/href="#([^"\s]+)"/g))
    assert.ok(ids.has(id), `${file}: missing #${id}`);
  for (const [, src] of html.matchAll(
    /(?:src|href)="(\/(?:_expo|images)\/[^"#?]+)"/g,
  ))
    await stat(path.join("dist", src.slice(1)));
}
assert.ok(headers[0] && footers[0], "Shell contains header and footer");
assert.equal(
  new Set(headers).size,
  1,
  "Header is identical across every route",
);
assert.equal(
  new Set(footers).size,
  1,
  "Footer is identical across every route",
);
for (const route of routes) {
  const { html } = pages.find(
    (page) =>
      page.file === (route.id === "home" ? "index.html" : `${route.id}.html`),
  );
  assert.match(html, /rel="canonical"/, `${route.path}: canonical URL`);
}
assert.match(pages.find((page) => page.file === "404.html").html, /noindex/);
const schema = JSON.parse(
  pages[0].html.match(
    /<script id="clinic-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/,
  )[1],
);
assert.equal(schema["@type"], "MedicalClinic");
assert.equal(schema.telephone, clinic.phone);
assert.equal(schema.openingHours, undefined, "No unverified opening hours");
console.log(
  `PASS: ${pages.length} rendered pages, shared shell, metadata, local links/assets, strict-script CSP compatibility, and clinic schema.`,
);

// Check that every supplied care photo has a real page placement and the shared identity is present.
const media = JSON.parse(await readFile("src/content/media.json", "utf8"));
const rendered = pages.map((page) => page.html).join("\n");
for (const photo of Object.values(media))
  assert.ok(
    rendered.includes(`src="${photo.src}"`),
    `Unused care photo: ${photo.source}`,
  );
for (const { file, html } of pages) {
  assert.ok(
    html.includes('src="/images/smc-logo-v1.png"'),
    `${file}: supplied logo`,
  );
  assert.ok(html.includes("/favicon.ico?v=2"), `${file}: updated favicon`);
}
console.log(
  "PASS: supplied SMC logo, favicon, and all 10 care photos are in rendered pages.",
);

// Every shared location section must carry the configured, accessible Google Maps embed.
for (const { file, html } of pages.filter((page) =>
  page.html.includes('class="location"'),
)) {
  const iframe = html.match(/<iframe[^>]+>/)?.[0];
  assert.ok(iframe, `${file}: interactive location map`);
  assert.ok(
    iframe.includes(clinic.mapEmbedUrl.replaceAll("&", "&amp;")),
    `${file}: supplied map URL`,
  );
  assert.ok(
    iframe.includes('loading="lazy"') &&
      iframe.includes('title="SMC Urgent Care location'),
    `${file}: labelled lazy map`,
  );
}
console.log(
  "PASS: configured interactive map in every shared location section.",
);
