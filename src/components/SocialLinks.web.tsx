import { clinic } from "../config/site";

// Supplied icons resized to twice their display size for sharp, inexpensive rendering.
const profiles = [
  {
    enabled: true,
    name: "Facebook",
    href: clinic.facebookUrl,
    icon: "/images/facebook-v1.png",
  },
  {
    enabled: clinic.linkedinEnabled,
    name: "LinkedIn",
    href: clinic.linkedinUrl,
    icon: "/images/linkedin-v1.png",
  },
].filter(profile => profile.enabled);

export default function SocialLinks() {
  return (
    <nav className="social-links" aria-label="SMC social media profiles">
      {profiles.map(({ name, href, icon }) => (
        <a
          className="social-link"
          href={href}
          key={name}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${clinic.name} on ${name} (opens in a new tab)`}
        >
          <img src={icon} width={24} height={24} alt="" loading="lazy" decoding="async" />
          <span>{name}</span>
        </a>
      ))}
    </nav>
  );
}
