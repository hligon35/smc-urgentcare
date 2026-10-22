import { handleContact } from "./contact.mjs";
import clinic from "../src/config/clinic.json" with { type: "json" };
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  // Expo's generated style elements require inline styles; executable scripts remain same-origin only.
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://challenges.cloudflare.com; object-src 'none'; frame-src https://www.google.com/maps/embed https://challenges.cloudflare.com; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
};

/** Apply protections consistently to assets, errors, and future API responses. */
export function secureResponse(response, request, environment = "sandbox") {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(securityHeaders))
    headers.set(name, value);
  const path = new URL(request.url).pathname;
  const type = headers.get("Content-Type") || "";
  headers.delete("Server");
  headers.delete("X-Powered-By");
  if (response.status >= 400 || path.startsWith("/api/") || path.startsWith("/portal"))
    headers.set("Cache-Control", "no-store");
  else if (
    response.status === 200 &&
    (path.startsWith("/_expo/static/") ||
      /^\/images\/[a-z-]+-v\d+\.(?:webp|png|jpg|avif)$/.test(path))
  )
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
  else if (type.includes("text/html"))
    headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  else headers.set("Cache-Control", "public, max-age=3600");
  if (
    environment !== "production" ||
    !["smcurgentcareindy.com", "www.smcurgentcareindy.com"].includes(
      new URL(request.url).hostname,
    ) ||
    response.status >= 400 ||
    path.startsWith("/portal") ||
    path.startsWith("/api/") ||
    path === "/+not-found" || path === "/robots.txt" && environment !== "production"
  )
    headers.set("X-Robots-Tag", "noindex, nofollow");
  return new Response(request.method === "HEAD" ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    let response;
    if (path === "/api/portal" || path.startsWith("/api/portal/")) {
      response = Response.json({ error: "This service has been removed. Use the clinic's existing patient portal." }, { status: 410 });
    } else if ((path === "/portal" || path.startsWith("/portal/")) && ["GET", "HEAD"].includes(request.method)) {
      response = Response.redirect(clinic.portalUrl, 308);
    } else if (path === "/api/contact" || path.startsWith("/api/contact/")) {
      response = await handleContact(request, env);
    } else if (!["GET", "HEAD"].includes(request.method)) {
      response = new Response("Method not allowed", {
        status: 405,
        headers: {
          Allow: "GET, HEAD",
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    } else if (
      env.ENVIRONMENT === "production" &&
      new URL(request.url).hostname === "www.smcurgentcareindy.com"
    ) {
      const target = new URL(request.url);
      target.hostname = "smcurgentcareindy.com";
      response = Response.redirect(target.href, 308);
    } else if (path === "/api/health") {
      response = Response.json({
        ok: true,
        service: "smc-urgentcare",
        environment: env.ENVIRONMENT || "sandbox",
      });
    } else if (path.startsWith("/api/")) {
      response = Response.json({ error: "Not found" }, { status: 404 });
    } else if (path === "/robots.txt" && env.ENVIRONMENT !== "production") {
      response = new Response("User-agent: *\nDisallow: /\n", {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    } else {
      try {
        response = await env.ASSETS.fetch(request);
      } catch {
        response = new Response(
          "The website is temporarily unavailable. Please try again shortly.",
          {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "no-store",
            },
          },
        );
      }
    }
    return secureResponse(response, request, env.ENVIRONMENT);
  },
};
