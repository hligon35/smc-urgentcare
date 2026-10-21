/* Contact-only progressive enhancement; no storage, analytics or medical intake. */
(async () => {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  const fields = form.querySelector('[data-contact-fields]');
  const button = form.querySelector('[data-contact-submit]');
  const status = document.querySelector('[data-contact-status]');
  const challenge = form.querySelector('[data-contact-challenge]');
  const say = (message, error = false) => { status.textContent = message; status.setAttribute('role', error ? 'alert' : 'status'); };
  let token = '', widget = null, busy = false, sent = false, observer = null, feedback = false;
  const enable = () => { button.disabled = busy || !token; };
  const reset = () => { token = ''; if (widget !== null && window.turnstile) window.turnstile.reset(widget); enable(); };
  form.addEventListener('input', () => { if (feedback && !sent) { feedback = false; say(token ? 'Ready to send your general question.' : 'Please complete the security check.'); } });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !token || !form.reportValidity()) return;
    busy = true; feedback = false; enable(); fields.disabled = true; say('Sending your message…');
    const value = name => form.elements.namedItem(name).value;
    const payload = { name: value('name'), email: value('email'), topic: value('topic'), message: value('message'), website: value('website'), privacyAccepted: form.elements.namedItem('privacyAccepted').checked, turnstileToken: token };
    try {
      const response = await fetch('/api/contact', { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(15000) });
      const result = await response.json();
      if (!response.ok || result.ok !== true) throw new Error(result.error || 'We could not confirm your message was sent. Please call the clinic.');
      form.reset(); sent = true; say(result.message); status.focus();
    } catch (error) {
      feedback = true;
      say(['TimeoutError', 'TypeError'].includes(error.name) ? 'We could not confirm your message was sent. Please call 317-852-3505 before sending it again.' : error.message || 'Unable to send your message. Please call the clinic.', true);
    } finally { busy = false; if (sent) { fields.hidden = true; observer?.disconnect(); if (widget !== null) { window.turnstile.remove(widget); widget = null; } } else { fields.disabled = false; reset(); } }
  });
  try {
    const response = await fetch('/api/contact/config', { cache: 'no-store', credentials: 'omit' });
    const config = await response.json();
    if (!response.ok || config.ready !== true || !config.siteKey) return;
    fields.disabled = false;
    say('Loading the security check…');
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true; script.onload = resolve; script.onerror = reject;
      document.head.appendChild(script);
    });
    const render = () => {
      const size = challenge.getBoundingClientRect().width < 300 ? 'compact' : 'flexible';
      if (challenge.dataset.size === size && widget !== null) return;
      if (widget !== null) window.turnstile.remove(widget);
      token = ''; enable(); challenge.dataset.size = size;
      widget = window.turnstile.render(challenge, {
        sitekey: config.siteKey, action: 'contact_form', theme: 'light', size,
        callback: value => { token = value; enable(); if (!busy && !feedback) say('Ready to send your general question.'); },
        'expired-callback': () => { token = ''; enable(); if (!busy && !feedback) say('Please complete the security check again.'); },
        'error-callback': () => { token = ''; enable(); if (!busy && !feedback) say('The security check is unavailable. Please reload or call the clinic.', true); },
      });
    };
    render();
    observer = new ResizeObserver(render); observer.observe(challenge);
  } catch { fields.disabled = true; say('Online contact is unavailable. Please call 317-852-3505.', true); }
})();
