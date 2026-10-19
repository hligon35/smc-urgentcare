/** The verification runs on the Worker. Client-side rendering alone is not protection. */
export const TURNSTILE_ACTION = "patient_auth";

export async function validatePortalTurnstile(request, env, token, fetcher = fetch) {
  if (!env.TURNSTILE_SECRET_KEY ||
      typeof token !== "string" || token.length < 1 || token.length > 2048)
    return false;

  const form = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
  });
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) form.set("remoteip", ip);

  try {
    const response = await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return false;
    const result = await response.json();
    return result?.success === true &&
      result.hostname === new URL(request.url).hostname &&
      result.action === TURNSTILE_ACTION;
  } catch {
    // Network errors, malformed replies, and timeouts must never bypass protection.
    return false;
  }
}
