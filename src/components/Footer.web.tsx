import { clinic, routes } from "../config/site";
import { Brand, PhoneLink, PortalLink } from "./Links.web";
import { Icon } from "./Icon";
import SocialLinks from "./SocialLinks.web";
export default function Footer() {
  return (
    <>
      <footer className="wrap">
        <div className="footer-top">
          <Brand />
          <p>
            Thoughtful care for the unexpected.
            <br />
            Here in Indianapolis.
          </p>
          <nav className="footer-links" aria-label="Footer navigation">
            {routes.slice(0, 5).map((route) => (
              <a href={route.path} key={route.id}>
                <Icon name={route.icon} /> {route.label}
              </a>
            ))}
            <PortalLink><Icon name="account" /> Patient portal</PortalLink>
          </nav>
          <SocialLinks />
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {clinic.name}. All rights reserved.
          </span>
          <nav className="footer-links" aria-label="Website information">
            {routes.slice(5).map((route) => (
              <a key={route.id} href={route.path}>
                <Icon name={route.icon} /> {route.label}
              </a>
            ))}
          </nav>
          <span>
            For a life-threatening emergency, call <a href="tel:911">911</a>.
          </span>
        </div>
        <div className="footer-credit">Website designed by <a href="https://alphazonelabs.com" target="_blank" rel="noopener noreferrer">Alpha Zone Labs LLC</a></div>
      </footer>
      <aside className="privacy-notice" data-privacy-notice hidden aria-label="Website privacy notice">
        <p><strong>Privacy on this website.</strong> We do not use advertising or analytics cookies. Google Maps and Cloudflare security checks may use cookies or similar technologies when loaded. <a href="/privacy">Read our privacy information</a>.</p>
        <button type="button" className="privacy-notice-dismiss" data-privacy-dismiss>Got it</button>
      </aside>
      <div className="mobile-bar">
        <PhoneLink className="btn">
          <Icon name="phone" />
          Call the clinic
        </PhoneLink>
        <a className="btn btn-outline" href="/contact">
          <Icon name="pin" />
          Find us
        </a>
      </div>
    </>
  );
}
