export class AccessSessionError extends Error {
  constructor() {
    super("Preview access is unavailable. Your session may have expired, or your account may not have permission. Reopen the preview to sign in.");
  }
}

/** Access authentication must happen as a page navigation, never inside an API fetch. */
export async function fetchPortalAuth(path: string, options: RequestInit = {}, fetcher: typeof fetch = fetch) {
  const headers = new Headers(options.headers);
  // Access returns 401 for expired AJAX sessions instead of redirecting to its cross-origin login page.
  headers.set("X-Requested-With", "XMLHttpRequest");
  const response = await fetcher(path, {
    ...options, headers, credentials: "same-origin", cache: "no-store", redirect: "manual",
  });
  const json = (response.headers.get("Content-Type") || "").includes("application/json");
  if (response.type === "opaqueredirect" ||
      (response.status >= 300 && response.status < 400) ||
      ((response.status === 401 || response.status === 403) && !json))
    throw new AccessSessionError();
  return response;
}
