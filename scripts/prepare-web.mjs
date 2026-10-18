import {
  copyFile,
  readFile,
  writeFile,
  mkdir,
  readdir,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
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
// Keep Expo's hydration initializer working under a strict same-origin script policy.
// Externalize executable inline code into content-addressed assets, including the 404 route.
const scriptsDirectory = "dist/_expo/static/js/web";
await mkdir(scriptsDirectory, { recursive: true });
for (const name of (await readdir("dist")).filter((name) =>
  name.endsWith(".html"),
)) {
  const file = path.join("dist", name);
  const assets = [];
  let source = await readFile(file, "utf8");
  // Reserved not-found routes do not resolve generateMetadata in Expo's static exporter.
  if (name === "+not-found.html") {
    source = source
      .replace(/<title>[\s\S]*?<\/title>/g, "")
      .replace(/<meta name="(?:description|robots)"[^>]*>/g, "");
    source = source.replace(
      "</head>",
      '<title>Page not found | SMC Urgent Care</title><meta name="description" content="Find your way back to SMC Urgent Care’s clinic information."/><meta name="robots" content="noindex, nofollow"/></head>',
    );
  }
  const html = source.replace(
    /<script([^>]*)>([\s\S]*?)<\/script>/g,
    (tag, attributes, code) => {
      if (
        !code.trim() ||
        /\bsrc=/.test(attributes) ||
        /type=["']application\/(ld\+)?json["']/.test(attributes)
      )
        return tag;
      const hash = createHash("sha256").update(code).digest("hex").slice(0, 24);
      const filename = `init-${hash}.js`;
      assets.push([filename, code]);
      return `<script${attributes} src="/_expo/static/js/web/${filename}"></script>`;
    },
  );
  for (const [filename, code] of assets)
    await writeFile(path.join(scriptsDirectory, filename), code);
  await writeFile(file, html);
}
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
  `Prepared ${routes.length} pages, 404, clinic schema, sitemap, and ${production ? "production" : "sandbox"} robots.txt.`,
);
