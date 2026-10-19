import {
  copyFile,
  readFile,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { externalizeInlineScripts } from "./export-scripts.mjs";
const routes = JSON.parse(await readFile("src/content/routes.json", "utf8"));
const clinic = JSON.parse(await readFile("src/config/clinic.json", "utf8"));
const origin = (
  process.env.EXPO_PUBLIC_SITE_URL || "https://smc-urgentcare.com"
).replace(/\/$/, "");
const production = origin === "https://smc-urgentcare.com";
const schema = {
  "@context": "https://schema.org",
  "@type": "MedicalClinic",
  name: clinic.name,
  url: origin,
  telephone: clinic.phone,
  address: {
    "@type": "PostalAddress",
    streetAddress: clinic.address.street,
    addressLocality: clinic.address.city,
    addressRegion: clinic.address.region,
    postalCode: clinic.address.postalCode,
    addressCountry: clinic.address.country,
  },
};
// No invented opening hours, reviews, or provider credentials in structured data.
for (const route of routes) {
  const file = path.join(
    "dist",
    route.id === "home" ? "index.html" : `${route.id}.html`,
  );
  let html = await readFile(file, "utf8");
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
  // Expo metadata is generated per route; this guard stops an SEO regression before deployment.
  if (!html.includes("<title>") || !html.includes('name="description"'))
    throw new Error(`Missing metadata: ${file}`);
  await writeFile(file, html);
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
await writeFile(notFoundPath, notFound);

// Transform every HTML route, including nested patient portal pages.
// Scripts execute from content-addressed same-origin assets under strict CSP.
const inlineScripts = await externalizeInlineScripts("dist");
await copyFile("dist/+not-found.html", "dist/404.html");
await writeFile(
  "dist/robots.txt",
  production
    ? `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${origin}/sitemap.xml\n`
    : "User-agent: *\nDisallow: /\n",
);
await writeFile(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((route) => `<url><loc>${origin}${route.path}</loc></url>`).join("")}</urlset>\n`,
);
console.log(
  `Prepared ${routes.length} public routes, ${inlineScripts.pages} exported HTML pages, ${inlineScripts.externalized} externalized scripts, 404, clinic schema, sitemap, and ${production ? "production" : "sandbox"} robots.txt.`,
);
