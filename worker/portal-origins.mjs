/**
 * Authorize the exact HTTPS host used for patient sessions and OAuth redirects.
 * Don't trust Host/Origin headers as additional allowed origins.
 */
function validOrigin(raw) {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.origin !== raw || url.username || url.password)
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function allowedAuthOrigins(env) {
  const candidates = [
    env.AUTH_ORIGIN,
    ...(env.AUTH_ALLOWED_ORIGINS || "").split(","),
  ];
  return new Set(candidates.map((value) => validOrigin(String(value || "").trim())).filter(Boolean));
}

export function requestAuthOrigin(request, env) {
  const origin = new URL(request.url).origin;
  return allowedAuthOrigins(env).has(origin) ? origin : null;
}

/** A Google OAuth code must be exchanged using the same redirect_uri it received at authorization. */
export function googleRedirectUri(origin) {
  return origin + "/api/portal/auth/google/callback";
}
