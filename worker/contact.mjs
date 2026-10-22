const MAX_BODY = 16_384;
const TOPICS = new Set(['General question', 'Hours and location', 'Website feedback']);
const EMAIL = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,63}$/;
const mailbox = value => typeof value === 'string' && value.length <= 254 && EMAIL.test(value);
const unavailable = 'Online contact is not available yet. Please call the clinic at 317-852-3505.';
const fail = (error, status, headers = {}) => Response.json({ ok: false, error }, { status, headers });

export function turnstileReady(env) {
  return !!env.TURNSTILE_SITE_KEY && !!env.TURNSTILE_SECRET_KEY;
}

export function contactReady(env) {
  return mailbox(env.CONTACT_TO) && mailbox(env.CONTACT_FROM) && turnstileReady(env) && typeof env.CONTACT_EMAIL?.send === 'function' && typeof env.CONTACT_RATE_LIMITER?.limit === 'function';
}
async function readBody(request) {
  if (!request.body) throw Object.assign(new Error('Empty request.'), { status: 400 });
  if (Number(request.headers.get('Content-Length')) > MAX_BODY) throw Object.assign(new Error('Message is too large.'), { status: 413 });
  const reader = request.body.getReader();
  let bytes = 0; const chunks = [];
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY) { await reader.cancel(); throw Object.assign(new Error('Message is too large.'), { status: 413 }); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(bytes); let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body)); }
  catch { throw Object.assign(new Error('Invalid request.'), { status: 400 }); }
}
function fields(body) {
  const allowed = new Set(['name', 'email', 'topic', 'message', 'privacyAccepted', 'website', 'turnstileToken']);
  if (!body || Array.isArray(body) || typeof body !== 'object' || Object.keys(body).some(key => !allowed.has(key))) return null;
  if (typeof body.name !== 'string' || typeof body.email !== 'string' || typeof body.message !== 'string' || typeof body.topic !== 'string') return null;
  const name = body.name.trim(), email = body.email.trim(), message = body.message.trim();
  if (name.length < 2 || name.length > 100 || /[\u0000-\u001f\u007f]/.test(name) || !mailbox(email) || !TOPICS.has(body.topic) || message.length < 10 || message.length > 2000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(message)) return null;
  if (body.privacyAccepted !== true || (body.website !== undefined && body.website !== '') || typeof body.turnstileToken !== 'string' || !body.turnstileToken || body.turnstileToken.length > 2048) return null;
  return { name, email, message, topic: body.topic, token: body.turnstileToken };
}
export async function handleContact(request, env) {
  const url = new URL(request.url);
  if (url.pathname === '/api/contact/config' && ['GET', 'HEAD'].includes(request.method)) {
    const ready = contactReady(env);
    return Response.json({ ready, turnstileReady: turnstileReady(env), siteKey: turnstileReady(env) ? env.TURNSTILE_SITE_KEY : '' });
  }
  if (url.pathname !== '/api/contact') return fail('Not found.', 404);
  if (request.method !== 'POST') return fail('Method not allowed.', 405, { Allow: 'POST' });
  const origins = new Set((env.CONTACT_ALLOWED_ORIGINS || env.SITE_ORIGIN || '').split(',').map(value => value.trim()).filter(Boolean));
  if (!origins.has(url.origin) || request.headers.get('Origin') !== url.origin || request.headers.get('Sec-Fetch-Site') === 'cross-site') return fail('Invalid origin.', 403);
  if (!contactReady(env)) return fail(unavailable, 503);
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || '')) return fail('Use a JSON request.', 415);
  let input;
  try { input = fields(await readBody(request)); }
  catch (error) { return fail(error.status === 413 ? 'Message is too large.' : 'Invalid request.', error.status === 413 ? 413 : 400); }
  if (!input) return fail('Check the form fields, confirmation, and security check.', 400);
  try {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input.email.toLowerCase()));
    const key = 'contact:' + [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
    const limit = await env.CONTACT_RATE_LIMITER.limit({ key });
    if (!limit.success) return fail('Too many messages. Please wait a minute or call the clinic.', 429, { 'Retry-After': '60' });
    let verification;
    try {
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(8000),
        body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: input.token, remoteip: request.headers.get('CF-Connecting-IP') || undefined }),
      });
      if (!response.ok) throw new Error('Verification unavailable');
      verification = await response.json();
    } catch { return fail('Security verification is unavailable. Please try again or call the clinic.', 503); }
    if (verification.success !== true || verification.hostname !== url.hostname || verification.action !== 'contact_form') return fail('Security check expired or failed. Please complete it again.', 403);
    await env.CONTACT_EMAIL.send({
      from: env.CONTACT_FROM, to: env.CONTACT_TO, replyTo: input.email,
      subject: 'SMC website contact: ' + input.topic,
      text: `General website inquiry\n\nName: ${input.name}\nEmail: ${input.email}\nTopic: ${input.topic}\n\n${input.message}\n\nSubmitted through the public website. This form is not for medical records, medical advice, or emergencies.`,
    });
    return Response.json({ ok: true, message: 'Your message has been submitted to the clinic. For time-sensitive questions, please call 317-852-3505.' });
  } catch {
    // Never log contact contents, email addresses, tokens, or provider exceptions.
    return fail('We could not confirm your message was sent. Please call the clinic or try again later.', 503);
  }
}
