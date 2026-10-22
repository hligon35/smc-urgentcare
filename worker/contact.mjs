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
  return mailbox(env.CONTACT_TO) && mailbox(env.CONTACT_FROM) && mailbox(env.CONTACT_NOTIFICATION_FROM) && turnstileReady(env) && typeof env.CONTACT_EMAIL?.send === 'function' && typeof env.CONTACT_RATE_LIMITER?.limit === 'function';
}

const escapeHtml = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export function confirmationEmail(name) {
  const firstName = name.trim().split(/\s+/)[0].slice(0, 50);
  const greeting = escapeHtml(firstName);
  const text = `Hello ${firstName},

Thank you for contacting SMC Urgent Care. Your message has been received, and our team will review it.

For time-sensitive questions, call 317-852-3505. Do not reply with medical or sensitive information.

SMC Urgent Care
7411 Heathrow Way, Indianapolis, IN 46241
https://smcurgentcareindy.com

This is an automatic confirmation. For emergencies, call 911.`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body style="margin:0;padding:32px 12px;background:#f2f5f9;font-family:Arial,Helvetica,sans-serif;color:#10244a"><div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #dce3ec;border-radius:10px;overflow:hidden"><div style="padding:24px 28px;border-top:5px solid #c31831"><img src="https://smcurgentcareindy.com/images/smc-logo-v1.png" alt="SMC Urgent Care" width="64" height="64" style="display:inline-block;vertical-align:middle;object-fit:contain"><span style="display:inline-block;vertical-align:middle;margin-left:12px;font-size:20px;font-weight:bold">SMC Urgent Care</span></div><div style="padding:0 28px 24px"><h1 style="font-size:24px;font-weight:normal;margin:12px 0 18px">Thanks for reaching out.</h1><p style="font-size:15px;line-height:1.6">Hello ${greeting},</p><p style="font-size:15px;line-height:1.6">We've received your message. Our team will review it and respond as appropriate.</p><p style="font-size:14px;line-height:1.6">For time-sensitive questions, please call <a href="tel:+13178523505" style="color:#102c67">317-852-3505</a>. Do not reply with medical or sensitive information.</p></div><div style="background:#f3f6fa;padding:18px 28px;font-size:12px;line-height:1.6;color:#52617a">7411 Heathrow Way, Indianapolis, IN 46241<br><a href="https://smcurgentcareindy.com" style="color:#102c67">smcurgentcareindy.com</a><br>Automated confirmation. In an emergency, call 911.</div></div></body></html>`;
  return { subject: 'We received your message | SMC Urgent Care', text, html };
}


export function notificationEmail({ name, email, topic, message }) {
  const safe = value => escapeHtml(value);
  const subject = 'SMC website contact: ' + topic;
  const text = `New SMC Urgent Care website inquiry

Name: ${name}
Email: ${email}
Topic: ${topic}

Message:
${message}

Reply to this email to respond to the visitor.

This form is for general, nonmedical questions only.
https://smcurgentcareindy.com`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head><body style="margin:0;padding:30px 12px;background:#f2f5f9;font-family:Arial,Helvetica,sans-serif;color:#10244a"><div style="max-width:600px;margin:auto;background:#ffffff;border:1px solid #dce3ec;border-radius:10px;overflow:hidden"><div style="border-top:5px solid #c31831;padding:23px 26px 18px"><img src="https://smcurgentcareindy.com/images/smc-logo-v1.png" width="58" height="58" alt="SMC Urgent Care" style="vertical-align:middle;object-fit:contain"><span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:20px;font-weight:700">SMC Urgent Care</span><div style="font-size:12px;letter-spacing:1px;color:#52617a;margin-top:14px;text-transform:uppercase">Website inquiry</div><h1 style="margin:8px 0 0;font-size:23px;line-height:1.3">New contact submission</h1></div><div style="padding:4px 26px 26px"><table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;line-height:1.6;border-collapse:collapse"><tr><td style="padding:10px 0;color:#52617a;width:92px;vertical-align:top">Name</td><td style="padding:10px 0;font-weight:600;overflow-wrap:anywhere">${safe(name)}</td></tr><tr><td style="padding:10px 0;color:#52617a;vertical-align:top;border-top:1px solid #e6ebf0">Email</td><td style="padding:10px 0;border-top:1px solid #e6ebf0;overflow-wrap:anywhere"><a style="color:#173e7b" href="mailto:${safe(email)}">${safe(email)}</a></td></tr><tr><td style="padding:10px 0;color:#52617a;vertical-align:top;border-top:1px solid #e6ebf0">Topic</td><td style="padding:10px 0;border-top:1px solid #e6ebf0">${safe(topic)}</td></tr></table><div style="background:#f4f7fa;border-left:3px solid #c31831;padding:15px 17px;margin:14px 0 24px"><div style="font-size:12px;font-weight:700;color:#52617a;margin-bottom:9px">MESSAGE</div><div style="white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;line-height:1.65">${safe(message)}</div></div><a href="mailto:${safe(email)}" style="display:inline-block;background:#173e7b;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 20px;border-radius:5px">Reply to visitor</a></div><div style="background:#f4f7fa;padding:18px 26px;color:#52617a;font-size:12px;line-height:1.55">Submitted through the SMC Urgent Care website. For general, nonmedical inquiries only.<br><a href="https://smcurgentcareindy.com" style="color:#173e7b">smcurgentcareindy.com</a></div></div></body></html>`;
  return { subject, text, html };
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
    try {
      await env.CONTACT_EMAIL.send({
        from: env.CONTACT_NOTIFICATION_FROM, to: env.CONTACT_TO, replyTo: input.email,
        ...notificationEmail(input),
      });
    } catch {
      return fail('The contact notification could not be accepted by the email provider. Please call the clinic or try again later.', 503);
    }
    // A visitor confirmation is secondary: never turn a successful clinic delivery into
    // a client-visible failure (which might prompt a duplicate submission).
    // Cloudflare Email Service may restrict unverified visitor destinations.
    try {
      await env.CONTACT_EMAIL.send({
        from: env.CONTACT_FROM, to: input.email, replyTo: env.CONTACT_FROM,
        ...confirmationEmail(input.name),
      });
    } catch {
      // Do not expose a visitor email address, recipient policy or message contents.
    }
    return Response.json({ ok: true, message: 'Your message has been submitted to the clinic. For time-sensitive questions, please call 317-852-3505.' });
  } catch {
    // Never log contact contents, email addresses, tokens, or provider exceptions.
    return fail('We could not confirm your message was sent. Please call the clinic or try again later.', 503);
  }
}
