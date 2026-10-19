import type { CSSProperties } from "react";
import { materialPaths } from "./material-icons";

/** Locally bundled Material Icons Rounded; adjacent text supplies the accessible label. */
export function Icon({ name, style, className = "" }: {
  name: string;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <svg
      className={`icon material-icon${className ? ` ${className}` : ""}`}
      data-icon={name}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      stroke="none"
      aria-hidden="true"
      focusable="false"
      style={style}
    >
      {(materialPaths[name] || materialPaths.arrow).map((d, index) => <path key={index} d={d} />)}
    </svg>
  );
}
