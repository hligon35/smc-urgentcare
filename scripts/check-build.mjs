import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { exportedHtmlFiles, isInertScript } from "./export-scripts.mjs";
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
  assert.ok(html.includes('href="/portal"'), `${file}: CareConnect entry link`);
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
    else {
      // Expo emits directory index pages for routes that also have child routes.
      try { await stat(`${resolved}.html`); }
      catch (error) {
        if (error.code !== "ENOENT") throw error;
        await stat(path.join(resolved, "index.html"));
      }
    }
  }
  for (const [, id] of html.matchAll(/href="#([^"\s]+)"/g))
    assert.ok(ids.has(id), `${file}: missing #${id}`);
  for (const [, src] of html.matchAll(
    /(?:src|href)="(\/(?:_expo|images)\/[^"#?]+)"/g,
  ))
    await stat(path.join("dist", src.slice(1)));
}
// Every exported page shares the social footer; Find Us also exposes both profiles.
for (const { file, html } of pages) {
  for (const [name, url] of [
    ["Facebook", clinic.facebookUrl],
    ["LinkedIn", clinic.linkedinUrl],
  ]) {
    assert.ok(html.includes(url), `${file}: ${name} social profile`);
    assert.ok(
      html.includes(`SMC Urgent Care on ${name}`),
      `${file}: accessible ${name} link`,
    );
  }
}
const visitHtml = pages.find((page) => page.file === "visit.html")?.html || "";
assert.ok(visitHtml.includes(clinic.portalUrl), "Visit page retains existing clinical portal option");
const contactHtml = pages.find((page) => page.file === "contact.html")?.html;
assert.ok(contactHtml, "Find Us page exported");
for (const url of [clinic.facebookUrl, clinic.linkedinUrl]) {
  assert.ok(
    contactHtml.split(url).length >= 3,
    `Find Us includes a profile link in addition to the shared footer: ${url}`,
  );
}
// The homepage intentionally contains only the original hero, location CTA, and shared footer.
const homepage = pages.find((page) => page.file === "index.html")?.html || "";
assert.match(homepage, /A little care\./, "Homepage preserves original hero");
assert.match(homepage, /Your neighborhood urgent care/, "Homepage retains location");
assert.doesNotMatch(homepage, /class="quick-strip"/, "Homepage omits quick information strip");
assert.doesNotMatch(homepage, /class="services wrap"/, "Homepage omits services grid");
assert.doesNotMatch(homepage, /class="faq"/, "Homepage omits FAQs");
assert.match(homepage, /href="\/portal"/, "Homepage patient access points to CareConnect");
const sharedHeader = homepage.match(/<header>[\s\S]*?<\/header>/)?.[0] || "";
assert.match(sharedHeader, /href="\/"[^>]*>Home<\/a>/, "Header includes Home navigation");
assert.match(sharedHeader, /href="\/portal"/, "Header opens local patient portal");
for (const { file, html } of pages) {
  assert.match(html, /href="\/portal"/, `${file}: portal link is internal`);
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
for (const photo of Object.values(media)) {
  assert.ok(
    rendered.includes(`src="${photo.src}"`),
    `Unused care photo: ${photo.source}`,
  );
  await stat(photo.source);
  await stat(path.join("public", photo.src.slice(1)));
}
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
for (const { file, html } of pages.filter(
  (page) =>
    page.html.includes('class="location"') ||
    page.html.includes('class="contact-panel location-panel"'),
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
  "PASS: configured interactive map in every shared location section and the Find Us panel.",
);
// Check all exported HTML, including nested portal pages, against the Worker CSP.
let checkedHtml = 0;
for await (const file of exportedHtmlFiles("dist")) {
  const html = await readFile(file, "utf8");
  for (const [, attrs, code] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    assert.ok(!code.trim() || isInertScript(attrs), `${file}: executable inline script violates CSP`);
    const match = attrs.match(/\bsrc\s*=\s*["\x27](\/_expo\/static\/js\/web\/init-[^"\x27]+\.js)["\x27]/i);
    if (match) await stat(path.join("dist", match[1].slice(1)));
  }
  checkedHtml++;
}
assert.ok(checkedHtml > routes.length, "Expected patient portal HTML exports");
console.log(`PASS: strict CSP in all ${checkedHtml} exported HTML pages.`);

