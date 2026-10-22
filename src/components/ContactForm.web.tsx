import { clinic } from '../config/site';
import { PhoneLink, PortalLink } from './Links.web';

export default function ContactForm() {
  return (
    <section className="wrap page-section" aria-labelledby="contact-form-title">
      <div className="contact-form-panel">
        <div className="eyebrow">General questions</div>
        <h2 id="contact-form-title">Send the clinic a message.</h2>
        <p id="contact-form-note">For general, nonmedical questions only. Do not include symptoms, medical records, dates of birth, insurance information, or other sensitive health details. For care questions, use the <PortalLink>patient portal</PortalLink> or <PhoneLink>call {clinic.phone}</PhoneLink>. For emergencies, call 911.</p>
        <p data-contact-status tabIndex={-1} role="status" aria-live="polite">Online contact is being prepared. Please call {clinic.phone} for help.</p>
        <form data-contact-form action="/api/contact" method="post" aria-describedby="contact-form-note">
          <fieldset disabled data-contact-fields>
            <legend className="sr-only">General contact message</legend>
            <div className="contact-form-grid">
              <label>Your name<input name="name" autoComplete="name" required minLength={2} maxLength={100} /></label>
              <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
            </div>
            <label>What can we help with?<select name="topic" defaultValue="General question" required><option>General question</option><option>Hours and location</option><option>Website feedback</option></select></label>
            <label>Your message<textarea name="message" rows={6} required minLength={10} maxLength={2000} aria-describedby="contact-message-help" /></label>
            <p id="contact-message-help" className="contact-form-help">10–2,000 characters. Please keep medical and patient information out of this form.</p>
            <div className="contact-honeypot" aria-hidden="true"><label>Leave this field blank<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
            <label className="contact-confirm"><input name="privacyAccepted" type="checkbox" required /><span>I understand this form is for general questions and will not include sensitive health information. I have read the <a href="/privacy">website privacy information</a>.</span></label>
          </fieldset>
          <div className="contact-security-preview"><p className="contact-form-help">Protected by Cloudflare Turnstile</p><div data-contact-challenge aria-label="Cloudflare Turnstile security check" /></div>
          <button className="btn" type="submit" data-contact-submit disabled>Send message</button>
        </form>
        <noscript><p>Please enable JavaScript for the security check, or call {clinic.phone}.</p></noscript>
      </div>
    </section>
  );
}
