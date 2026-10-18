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
      href={clinic.portalUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children || "Patient portal"}
      <span className="sr-only"> (opens in a new tab)</span>
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
      <span className="brand-mark" aria-hidden="true" />
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
