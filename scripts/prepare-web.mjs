import {
  copyFile,
  readFile,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { preparePublicRuntime, prepareContactRuntime, staticPublicHtml, pruneApplicationScripts, exportedHtmlFiles } from "./public-export.mjs";
const routes = JSON.parse(await readFile("src/content/routes.json", "utf8"));
const clinic = JSON.parse(await readFile("src/config/clinic.json", "utf8"));
const origin = (
  process.env.EXPO_PUBLIC_SITE_URL || "https://smcurgentcareindy.com"
).replace(/\/$/, "");
const production = origin === "https://smcurgentcareindy.com";
const schema = {
  "@context": "https://schema.org",
  "@type": "MedicalClinic",
  "@id": `${origin}/#clinic`,
  name: clinic.name,
  logo: `${origin}/images/smc-logo-v1.png`,
  image: `${origin}/images/caring-visit-v1.webp`,
  sameAs: [clinic.facebookUrl, ...(clinic.linkedinEnabled ? [clinic.linkedinUrl] : [])],
  hasMap: clinic.directionsUrl,
  url: origin,
  telephone: clinic.phone,
  areaServed: { "@type": "City", name: clinic.address.city, address: { "@type": "PostalAddress", addressRegion: clinic.address.region, addressCountry: clinic.address.country } },
  contactPoint: { "@type": "ContactPoint", telephone: clinic.phone, contactType: "customer service", availableLanguage: "English" },
  address: {
    "@type": "PostalAddress",
    streetAddress: clinic.address.street,
    addressLocality: clinic.address.city,
    addressRegion: clinic.address.region,
    postalCode: clinic.address.postalCode,
    addressCountry: clinic.address.country,
  },
};
const xmlEscape = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const jsonScript = (id, data) => `<script id="${id}" type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
const sitemapEntries = [];
const seenPaths = new Set();
const seenIds = new Set();
const publicRuntime = await preparePublicRuntime("dist");
const contactRuntime = await prepareContactRuntime("dist");
// No invented opening hours, reviews, or provider credentials in structured data.
for (const route of routes) {
  if (seenPaths.has(route.path) || seenIds.has(route.id) || !/^[a-z][a-z0-9-]*$/.test(route.id) || ["api", "portal"].includes(route.id) || route.path !== (route.id === "home" ? "/" : `/${route.id}`))
    throw new Error(`Invalid or duplicate public route: ${route.path}`);
  seenPaths.add(route.path);
  seenIds.add(route.id);
  const file = path.join(
    "dist",
    route.id === "home" ? "index.html" : `${route.id}.html`,
  );
  let html = (await readFile(file, "utf8")).replace(/<script id="page-schema"[^>]*>[\s\S]*?<\/script>/g, "");
  if (route.id === "home") {
    html = html.replace(
      /<script id="clinic-schema"[^>]*>[\s\S]*?<\/script>/g,
      "",
    );
    html = html.replace(
      "</head>",
      `<script id="clinic-schema" type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script></head>`,
    );
  }
  const canonical = `${origin}${route.path}`;
  const breadcrumb = {
    "@type": "BreadcrumbList", "@id": `${canonical}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
      ...(route.id === "home" ? [] : [{ "@type": "ListItem", position: 2, name: route.label, item: canonical }]),
    ],
  };
  const pageSchema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": `${origin}/#website`, url: `${origin}/`, name: clinic.name, publisher: { "@id": `${origin}/#clinic` }, inLanguage: "en-US" },
      { "@type": route.id === "about" ? "AboutPage" : route.id === "contact" ? "ContactPage" : "WebPage",
        "@id": `${canonical}#webpage`, url: canonical, name: `${route.title} | ${clinic.name}`,
        description: route.description, inLanguage: "en-US", isPartOf: { "@id": `${origin}/#website` },
        about: { "@id": `${origin}/#clinic` }, breadcrumb: { "@id": breadcrumb["@id"] } },
      breadcrumb,
      ...(route.id === "home" ? [] : [schema]),
    ],
  };
  html = html.replace("</head>", `${jsonScript("page-schema", pageSchema)}</head>`);
  const images = [...new Set([...html.matchAll(/<img[^>]+src="(\/images\/[^"?#]+)"/g)].map(match => match[1]))];
  sitemapEntries.push(`  <url>\n    <loc>${xmlEscape(canonical)}</loc>${images.map(src => `\n    <image:image><image:loc>${xmlEscape(origin + src)}</image:loc></image:image>`).join("")}\n  </url>`);
  // Expo metadata is generated per route; this guard stops an SEO regression before deployment.
  if (!html.includes("<title>") || !html.includes('name="description"'))
    throw new Error(`Missing metadata: ${file}`);
  await writeFile(file, staticPublicHtml(html, publicRuntime, route.id === "contact" ? contactRuntime : undefined));
}
// Reserved not-found routes do not resolve generateMetadata in Expo's static exporter.
const notFoundPath = "dist/+not-found.html";
let notFound = await readFile(notFoundPath, "utf8");
notFound = notFound
  .replace(/<title>[\s\S]*?<\/title>/g, "")
  .replace(/<meta name="(?:description|robots)"[^>]*>/g, "")
  .replace(
    "</head>",
    '<title>Page not found | SMC Urgent Care</title><meta name="description" content="Find your way back to SMC Urgent Care’s clinic information."/><meta name="robots" content="noindex, nofollow"/></head>',
  );
await writeFile(notFoundPath, staticPublicHtml(notFound, publicRuntime));

// A newly exported public route must be represented in the sitemap registry.
const covered = new Set(["index.html", "+not-found.html", "404.html", ...routes.filter(route => route.id !== "home").map(route => `${route.id}.html`)]);
let exportedPages = 0;
for await (const file of exportedHtmlFiles("dist")) {
  exportedPages++;
  const relative = path.relative("dist", file).split(path.sep).join("/");
  if (!covered.has(relative))
    throw new Error(`Public HTML is missing from the route registry/sitemap: ${relative}`);
}
await copyFile("dist/+not-found.html", "dist/404.html");
const prunedScripts = await pruneApplicationScripts("dist");
await writeFile(
  "dist/robots.txt",
  production
    ? `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${origin}/sitemap.xml\n`
    : "User-agent: *\nDisallow: /\n",
);
await writeFile(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${sitemapEntries.join("\n")}\n</urlset>\n`,
);
console.log(
  `Prepared ${routes.length} public routes, ${exportedPages} exported HTML pages, ${prunedScripts} unused application scripts removed, 404, clinic schema, sitemap, and ${production ? "production" : "sandbox"} robots.txt.`,
);
