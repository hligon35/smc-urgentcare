/** Public failures carry a safe code and reference; never log tokens, bodies, or SQL values. */
export class AuthRequestError extends Error {}

export function describeAuthFailure(error) {
  if (error instanceof AuthRequestError)
    return { code: "AUTH_REQUEST_INVALID", status: 400, error: error.message };
  const message = String(error?.message || "");
  if (/no such (table|column)|has no column named/i.test(message))
    return { code: "AUTH_SCHEMA_MISSING", status: 503, error: "Authentication database setup is incomplete. Contact the site administrator." };
  if (/D1_ERROR|D1_EXEC_ERROR|D1 database/i.test(message))
    return { code: "AUTH_DATABASE_ERROR", status: 503, error: "Authentication database is unavailable. Please try again later." };
  return { code: "AUTH_INTERNAL_ERROR", status: 500, error: "Authentication request failed. Contact the site administrator." };
}

export function logAuthFailure(failure, request) {
  const requestId = crypto.randomUUID();
  console.error(JSON.stringify({
    event: "portal_auth_failure", code: failure.code, requestId,
    path: new URL(request.url).pathname, method: request.method,
  }));
  return requestId;
}

export function authFailureResponse(error, request) {
  const failure = describeAuthFailure(error);
  const requestId = failure.status >= 500 ? logAuthFailure(failure, request) : undefined;
  return Response.json({ error: failure.error, code: failure.code, ...(requestId ? { requestId } : {}) }, {
    status: failure.status, headers: { "Cache-Control": "no-store" },
  });
}
