import { clinic, routes } from "../config/site";
import { Brand, PhoneLink, PortalLink } from "./Links";
import { Icon } from "./Icon";
import SocialLinks from "./SocialLinks";
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
                {route.label}
              </a>
            ))}
            <PortalLink>Patient portal ↗</PortalLink>
          </nav>
          <SocialLinks />
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {clinic.name}
          </span>
          <nav className="footer-links" aria-label="Website information">
            {routes.slice(5).map((route) => (
              <a key={route.id} href={route.path}>
                {route.label}
              </a>
            ))}
          </nav>
          <span>
            For a life-threatening emergency, call <a href="tel:911">911</a>.
          </span>
        </div>
      </footer>
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
