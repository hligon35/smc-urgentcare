import { Image } from "react-native";
import { clinic } from "../config/site";

// Use the supplied brand icons so web exports bundle them as local assets.
const profiles = [
  {
    name: "Facebook",
    href: clinic.facebookUrl,
    icon: require("../../assets/facebook.png"),
  },
  {
    name: "LinkedIn",
    href: clinic.linkedinUrl,
    icon: require("../../assets/linkedIN.png"),
  },
];

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
          <Image
            source={icon}
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
            accessible={false}
          />
          <span>{name}</span>
        </a>
      ))}
    </nav>
  );
}
