import LocationMap from "../components/LocationMap.web";
import SocialLinks from "../components/SocialLinks";
import { CareImage } from "../components/CareImage.web";
import { clinic } from "../config/site";
import { Icon } from "../components/Icon";
import {
  CallButton,
  DirectionsLink,
  PhoneLink,
  PortalLink,
} from "../components/Links";
import {
  Approach,
  EmergencyNote,
  FAQs,
  LocationCTA,
  PageIntro,
  PaymentCard,
  ServiceCards,
  VisitSteps,
} from "../components/Sections.web";

function Home() {
  return (
    <>
      <div className="hero wrap">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">Here for you. Close to home.</div>
            <h1>
              A little care.
              <br />A lot of <em>comfort.</em>
            </h1>
            <p>
              When the unexpected happens, a caring face makes all the
              difference. Walk into SMC for non-life-threatening illnesses and
              injuries.
            </p>
            <div className="hero-actions">
              <a className="btn" href="/visit">
                Plan your visit
                <Icon name="arrow" />
              </a>
              <a className="btn btn-outline" href="/services">
                Explore our care
              </a>
            </div>
            <div className="quiet-note">
              <Icon name="heart" />
              No appointment necessary. You’re welcome here.
            </div>
          </div>
          <div className="hero-visual">
            <CareImage name="hero" priority />
            <div className="image-caption">
              <span className="caption-icon">
                <Icon name="heart" />
              </span>
              <div>
                <strong>Care that starts with listening.</strong>
                <small>Your comfort. Your questions. Your care.</small>
              </div>
            </div>
          </div>
        </div>
      </div>
      <LocationCTA />
    </>
  );
}
function Services() {
  return (
    <>
      <PageIntro
        eyebrow="Everyday needs. Thoughtful care."
        title="Care for life’s unexpected moments."
      >
        <p>
          Explore our services for non-life-threatening concerns. Give us a call
          to confirm availability and whether the clinic is right for your
          needs.
        </p>
      </PageIntro>
      <section className="wrap page-section">
        <ServiceCards detailed />
      </section>
      <section className="soft-band">
        <div className="wrap two-column">
          <div>
            <div className="eyebrow">Not sure where to start?</div>
            <h2>Let’s talk about the next step.</h2>
          </div>
          <div>
            <p>
              Our team can answer questions about services and visit
              preparation. We don’t offer medical advice or symptom assessment
              through this website.
            </p>
            <CallButton />
          </div>
        </div>
      </section>
      <FAQs />
      <LocationCTA />
    </>
  );
}
function About() {
  return (
    <>
      <PageIntro
        eyebrow="Care with a human connection"
        title="You’re a person. Not just a patient."
      >
        <p>
          SMC Urgent Care’s person-centered approach puts your needs, questions,
          and preferences at the heart of your care.
        </p>
      </PageIntro>
      <section className="wrap story-grid page-section">
        <CareImage name="approach" />
        <div>
          <div className="eyebrow">Here in Indianapolis</div>
          <h2>A caring welcome for the unexpected.</h2>
          <p>
            Illnesses and injuries don’t always fit into your schedule. Our
            walk-in clinic is here for non-life-threatening concerns, with no
            appointment necessary.
          </p>
          <p>
            We want you to understand your options and feel comfortable asking
            questions. Helping you get back on your feet starts with listening.
          </p>
          <a className="btn btn-outline" href="/services">
            Explore our services
            <Icon name="arrow" />
          </a>
        </div>
      </section>
      <Approach full />
      <section className="wrap care-scenes">
        <article className="care-scene care-scene-compact">
          <CareImage name="listening" />
          <div>
            <div className="eyebrow">Make room for your questions</div>
            <h2>Bring what’s on your mind.</h2>
            <p>
              A short list of questions or concerns can help you make the most
              of your visit.
            </p>
          </div>
        </article>
        <article className="care-scene">
          <CareImage name="conversation" />
          <div>
            <div className="eyebrow">Your perspective matters</div>
            <h2>Tell us what matters to you.</h2>
            <p>
              Share your preferences and ask about the next step in your care.
            </p>
          </div>
        </article>
      </section>
      <section className="wrap two-column">
        <div>
          <div className="eyebrow">Know what to expect</div>
          <h2>A little clarity helps.</h2>
        </div>
        <div>
          <p>
            Before you visit, call to confirm current hours, ask about your
            insurance plan, or check what’s needed for a physical. Our team can
            help you prepare.
          </p>
          <a className="text-link" href="/visit">
            See how to prepare for your visit <Icon name="arrow" />
          </a>
        </div>
      </section>
      <LocationCTA />
    </>
  );
}
function Visit() {
  return (
    <>
      <PageIntro
        eyebrow="A little preparation. More peace of mind."
        title="Let’s make your visit a little easier."
      >
        <p>
          No appointment is necessary. Take a moment to check current hours,
          gather the essentials, and ask any questions before heading over.
        </p>
      </PageIntro>
      <section className="wrap page-section">
        <div className="visit-grid">
          <div>
            <CareImage name="visit" className="visit-photo" />
            <VisitSteps />
          </div>
          <PaymentCard />
        </div>
      </section>
      <section className="wrap preparation-band">
        <CareImage name="preparation" />
        <div>
          <div className="eyebrow">Coming for a physical?</div>
          <h2>A little paperwork. A smoother start.</h2>
          <p>
            Bring any required examination forms and school or employer
            instructions. Call ahead to check what your particular visit
            requires.
          </p>
        </div>
      </section>
      <section className="soft-band">
        <div className="wrap two-column">
          <div>
            <div className="eyebrow">Stay connected to your care</div>
            <h2>Your patient portal.</h2>
          </div>
          <div>
            <p>
              Sign in to SMC CareConnect to explore your new patient dashboard.
              Clinical records and communications are not connected to CareConnect yet.
            </p>
            <PortalLink className="btn">
              Open CareConnect
              <Icon name="arrow" />
            </PortalLink>
            <p className="care-note">
              For actual medical records, messages, or other clinical services,
              use the clinic’s existing secure portal.
            </p>
            <a
              className="text-link"
              href={clinic.portalUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open existing clinical portal <Icon name="external" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </div>
      </section>
      <FAQs />
      <LocationCTA />
    </>
  );
}
function Contact() {
  return (
    <>
      <PageIntro
        eyebrow="Here for you. Close to home."
        title="A caring welcome starts here."
      >
        <p>
          Have a question before you come in? Call our team to confirm hours,
          discuss visit preparation, or ask about services and payment options.
        </p>
      </PageIntro>
      <section className="wrap contact-grid page-section">
        <div className="contact-panel">
          <CareImage name="welcome" className="contact-photo" />
          <Icon name="phone" />
          <h2>Give us a call.</h2>
          <PhoneLink className="large-link" />
          <p>{clinic.hoursNote}. Please call before traveling to the clinic.</p>
          <div className="divider" />
          <h3>Already a patient?</h3>
          <p>
            Use the existing patient portal, or call us for help getting
            connected.
          </p>
          <PortalLink className="btn btn-outline">
            Patient portal
            <Icon name="external" />
          </PortalLink>
        </div>
        <div className="contact-panel location-panel">
          <Icon name="pin" />
          <h2>Come see us.</h2>
          <address>
            {clinic.address.street}
            <br />
            {clinic.address.city}, {clinic.address.region}{" "}
            {clinic.address.postalCode}
          </address>
          <p>{clinic.address.landmark}.</p>
          <LocationMap className="contact-map" />
          <DirectionsLink className="btn">
            Get directions
            <Icon name="external" />
          </DirectionsLink>
          <div className="divider" />
          <h3>Clinic updates</h3>
          <p>Follow SMC for clinic news and updates.</p>
          <SocialLinks />
        </div>
      </section>
      <section className="wrap page-section">
        <div className="notice">
          <Icon name="shield" />
          <div>
            <h3>Your health information deserves care, too.</h3>
            <p>
              This website doesn’t accept medical questions or patient records.
              Please call the clinic or use its patient portal for guidance on
              the appropriate way to share information.
            </p>
          </div>
        </div>
        <EmergencyNote />
      </section>
    </>
  );
}
function Privacy() {
  return (
    <>
      <PageIntro eyebrow="Website information" title="Your privacy matters.">
        <p>
          A clear explanation of this informational website and its external
          links.
        </p>
      </PageIntro>
      <article className="wrap prose page-section">
        <h2>About this website</h2>
        <p>
          This public website provides clinic information, services, directions,
          and links to contact SMC. It does not provide a patient registration
          form, accept medical records, or process payments.
        </p>
        <h2>Website data</h2>
        <p>
          This implementation does not use advertising trackers, analytics
          scripts or browser storage for patient information. Hosting providers
          process technical request information, such as IP addresses and
          browser details, to deliver and protect the website. The clinic’s
          hosting configuration determines log retention.
        </p>
        <h2>Interactive Google Maps</h2>
        <p>
          The location section contains an interactive map supplied by Google.
          When the map loads, your browser connects to Google and sends
          technical information such as your IP address, browser details, and
          the referring website origin. Google may use cookies or similar
          technologies under its own privacy practices. See{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            <u>Google’s Privacy Policy</u>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>{" "}
          for details.
        </p>
        <h2>Patient portal and other websites</h2>
        <p>
          The patient portal, Facebook, LinkedIn, and Google Maps are external services
          with their own privacy practices. Information you provide there is
          handled by those services. Opening an external link can share
          technical connection information with its destination.
        </p>
        <h2>Medical information</h2>
        <p>
          Please do not send sensitive health information through social media.
          Call the clinic for guidance on sharing information through an
          appropriate care channel. This website statement is not the clinic’s
          Notice of Privacy Practices; contact SMC to request that notice or
          discuss medical record questions.
        </p>
        <h2>Questions</h2>
        <p>
          For website privacy questions or to request the clinic’s privacy
          notices, call{" "}
          <PhoneLink>
            <u>{clinic.phone}</u>
          </PhoneLink>
          .
        </p>
      </article>
      <LocationCTA />
    </>
  );
}
function Accessibility() {
  return (
    <>
      <PageIntro
        eyebrow="A welcoming experience"
        title="Care should feel within reach."
      >
        <p>
          We want clinic information to be easy to find, read, and use. If
          something gets in your way, please let us know.
        </p>
      </PageIntro>
      <article className="wrap prose page-section">
        <h2>Using this website</h2>
        <p>
          The website includes keyboard navigation, visible focus indicators, a
          skip-to-content link, descriptive headings, image descriptions, and
          layouts that adapt to smaller screens. Motion is reduced when your
          device requests it.
        </p>
        <h2>Need help?</h2>
        <p>
          If you have difficulty reading a page, using a link, or finding clinic
          information, call{" "}
          <PhoneLink>
            <u>{clinic.phone}</u>
          </PhoneLink>
          . Tell the team what you need help accessing and the format or
          assistance that would be useful.
        </p>
        <h2>External services</h2>
        <p>
          The patient portal and other linked services are operated separately.
          If you need assistance accessing the portal, contact the clinic by
          phone.
        </p>
        <h2>Ongoing improvements</h2>
        <p>
          Accessibility is an ongoing effort. The features described here do not
          constitute a certification of compliance, and feedback can help
          identify areas to improve.
        </p>
      </article>
      <LocationCTA />
    </>
  );
}
function NotFound() {
  return (
    <>
      <PageIntro
        eyebrow="Let’s help you find your way"
        title="This page has moved, or isn’t here."
      >
        <p>
          You can still find the care information you need. Start with our
          services, plan a visit, or call the clinic.
        </p>
        <div className="hero-actions">
          <a className="btn" href="/">
            Back to home
            <Icon name="arrow" />
          </a>
          <a className="btn btn-outline" href="/services">
            Explore services
          </a>
        </div>
      </PageIntro>
      <section className="wrap page-section">
        <EmergencyNote />
      </section>
      <LocationCTA />
    </>
  );
}
const pages: Record<string, () => React.ReactNode> = {
  home: Home,
  services: Services,
  about: About,
  visit: Visit,
  contact: Contact,
  privacy: Privacy,
  accessibility: Accessibility,
};
export default function Page({ page }: { page: string }) {
  const Content = pages[page] || NotFound;
  return <Content />;
}

