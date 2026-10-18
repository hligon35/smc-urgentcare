import { useState } from "react";
import { CareImage } from "./CareImage.web";
import { clinic } from "../config/site";
import { faqs, services, values, visitSteps } from "../content/care";
import { Icon } from "./Icon";
import { DirectionsLink, PhoneLink, PortalLink } from "./Links";

export function PageIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="page-intro wrap">
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      <div className="page-lead">{children}</div>
    </section>
  );
}
export function EmergencyNote() {
  return (
    <p className="care-note">
      Not sure whether we can help?{" "}
      <PhoneLink>
        <u>Call {clinic.phone}</u>
      </PhoneLink>{" "}
      before your visit. {clinic.emergencyNote}
    </p>
  );
}
export function ServiceCards({ detailed = false }: { detailed?: boolean }) {
  const [filter, setFilter] = useState("all");
  return (
    <>
      <div className="tabs" role="group" aria-label="Filter services">
        <button
          className="tab"
          aria-pressed={filter === "all"}
          onClick={() => setFilter("all")}
        >
          All services
        </button>
        {services.map((service) => (
          <button
            key={service.id}
            className="tab"
            aria-pressed={filter === service.id}
            onClick={() => setFilter(service.id)}
          >
            {service.label}
          </button>
        ))}
      </div>
      <div className="service-grid" aria-label="Care services">
        {services
          .filter((service) => filter === "all" || filter === service.id)
          .map((service) => (
            <article
              className="service-card"
              key={service.id}
              id={detailed ? service.id : undefined}
            >
              <CareImage name={service.id} className="service-photo" />
              <Icon name={service.icon} />
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              {detailed && (
                <>
                  <ul className="service-list">
                    {service.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p>{service.note}</p>
                </>
              )}
              {detailed ? (
                <PhoneLink>
                  Ask about this care <Icon name="arrow" />
                </PhoneLink>
              ) : (
                <a href={`/services#${service.id}`}>
                  Explore {service.label.toLowerCase()} <Icon name="arrow" />
                </a>
              )}
            </article>
          ))}
      </div>
      <div className="sr-only" role="status" aria-live="polite">
        {filter === "all"
          ? "Showing all service categories"
          : `Showing ${services.find((service) => service.id === filter)?.label}`}
      </div>
      <EmergencyNote />
    </>
  );
}
export function Approach({ full = false }: { full?: boolean }) {
  return (
    <section className="approach" id="approach">
      <div className="wrap approach-grid">
        <div>
          <div className="eyebrow">People first. Always.</div>
          <h2>
            You deserve to feel
            <br />
            heard, not hurried.
          </h2>
          <p className="intro">
            Getting care can feel overwhelming. Our approach is simple: put you
            at the center, listen to what matters, and help you understand the
            next step.
          </p>
          <a className="btn btn-outline" href={full ? "/visit" : "/about"}>
            {full
              ? "Plan a more comfortable visit"
              : "Get to know our approach"}
            <Icon name="arrow" />
          </a>
        </div>
        <div className="values">
          {values.map((value, index) => (
            <div className="value" key={value.title}>
              <span>0{index + 1}</span>
              <div>
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
export function VisitSteps() {
  return (
    <ol className="steps">
      {visitSteps.map((step, index) => (
        <li key={step.title}>
          <span className="step-number">{index + 1}</span>
          <div>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
export function PaymentCard() {
  return (
    <aside className="visit-card" id="payment">
      <div className="eyebrow">One less thing to worry about</div>
      <h3>
        Questions about cost?
        <br />
        Let’s talk.
      </h3>
      <p>
        {clinic.paymentNote} Insurance participation and benefits vary by plan
        and service.
      </p>
      <PhoneLink className="text-link">
        Talk with our team · {clinic.phone} ↗
      </PhoneLink>
    </aside>
  );
}
export function FAQs() {
  return (
    <section className="faq wrap" id="questions">
      <div className="faq-grid">
        <div>
          <div className="eyebrow">Before you stop by</div>
          <h2>
            A few answers.
            <br />A little reassurance.
          </h2>
        </div>
        <div>
          {faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
              {faq.link === "portal" && (
                <p>
                  <PortalLink>
                    <u>Open patient portal ↗</u>
                  </PortalLink>
                </p>
              )}
              {faq.link === "facebook" && (
                <p>
                  <a
                    href={clinic.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <u>SMC on Facebook ↗</u>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </p>
              )}
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
export function LocationCTA() {
  return (
    <section className="location" id="location">
      <div className="wrap location-grid">
        <div>
          <div className="eyebrow">Your neighborhood urgent care</div>
          <h2>Find your way to feeling better.</h2>
          <p>A caring welcome is closer than you think.</p>
        </div>
        <address className="address">
          {clinic.address.street}
          <br />
          {clinic.address.city}, {clinic.address.region}{" "}
          {clinic.address.postalCode}
          <small>
            {clinic.address.landmark}
            <br />
            {clinic.hoursNote}.
          </small>
        </address>
        <div className="location-actions">
          <DirectionsLink className="btn">
            <Icon name="pin" />
            Get directions
            <Icon name="external" />
          </DirectionsLink>
          <PhoneLink>Call {clinic.phone}</PhoneLink>
        </div>
        <div className="location-map">
          <iframe
            src={clinic.mapEmbedUrl}
            title={`${clinic.name} location at ${clinic.address.street}, ${clinic.address.city}`}
            width={400}
            height={300}
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </section>
  );
}
