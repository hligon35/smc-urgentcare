import type { CSSProperties } from "react";
const shapes: Record<string, React.ReactNode> = {
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  pin: (
    <>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  phone: (
    <path d="m8 3 3 5-3 3c1 3 2 4 5 5l3-3 5 3c0 3-2 5-5 5C9 20 4 15 3 8c0-3 2-5 5-5Z" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  heart: (
    <>
      <path d="M20 5c4 5-2 10-8 15C6 15 0 10 4 5c3-3 6-1 8 1 2-2 5-4 8-1Z" />
      <path d="M5 12h4l2-4 3 7 2-3h4" />
    </>
  ),
  shield: (
    <>
      <path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  bag: (
    <>
      <rect x="3" y="7" width="18" height="14" rx="3" />
      <path d="M8 7V4h8v3m-4 5v5m-3-2.5h6" />
    </>
  ),
  cross: <path d="M8 3h8v5h5v8h-5v5H8v-5H3V8h5Z" />,
  external: <path d="M14 3h7v7m0-7L10 14m0-11H4v17h17v-6" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m5 5 14 14M5 19 19 5" />,
};
export function Icon({ name, style }: { name: string; style?: CSSProperties }) {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={style}
    >
      {shapes[name] || shapes.arrow}
    </svg>
  );
}
