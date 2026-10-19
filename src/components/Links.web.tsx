import type { AnchorHTMLAttributes, ReactNode } from "react";
import { clinic } from "../config/site";
import { Icon } from "./Icon";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { children?: ReactNode };
export function PhoneLink({ children, ...props }: Props) {
  return (
    <a {...props} href={clinic.phoneHref}>
      {children || clinic.phone}
    </a>
  );
}
export function PortalLink({ children, ...props }: Props) {
  return (
    <a
      {...props}
      href="/portal"
    >
      {children || "Patient portal"}
    </a>
  );
}
export function DirectionsLink({ children, ...props }: Props) {
  return (
    <a
      {...props}
      href={clinic.directionsUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children || "Get directions"}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
export function Brand() {
  return (
    <a className="brand" href="/" aria-label={`${clinic.name} home`}>
      <img
        className="brand-logo"
        src="/images/smc-logo-v1.png"
        width={80}
        height={80}
        alt=""
      />
      <span>
        <b>SMC</b>
        <small>Urgent Care</small>
      </span>
    </a>
  );
}
export function CallButton() {
  return (
    <PhoneLink className="btn">
      <Icon name="phone" />
      {clinic.phone}
    </PhoneLink>
  );
}
