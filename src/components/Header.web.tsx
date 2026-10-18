import { useEffect, useRef, useState } from "react";
import { usePathname } from "expo-router";
import { clinic, routes } from "../config/site";
import { Brand, CallButton, PortalLink } from "./Links";
import { Icon } from "./Icon";

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menu = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        menu.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (
        open &&
        !nav.current?.contains(event.target as Node) &&
        !menu.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);
  return (
    <>
      <a href="#main" className="skip">
        Skip to content
      </a>
      <div className="utility">
        <div className="wrap">
          <span>
            <i className="dot" />
            Walk-in care in Indianapolis · {clinic.hoursNote}
          </span>
          <PortalLink className="utility-portal">Patient portal ↗</PortalLink>
        </div>
      </div>
      <header>
        <div className="wrap nav">
          <Brand />
          <nav
            ref={nav}
            className={`links${open ? " open" : ""}`}
            id="navigation"
            aria-label="Main navigation"
          >
            {routes.slice(1, 5).map((route) => (
              <a
                key={route.id}
                href={route.path}
                aria-current={pathname === route.path ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {route.label}
              </a>
            ))}
          </nav>
          <div className="nav-actions">
            <PortalLink className="portal">
              Patient portal <Icon name="external" />
            </PortalLink>
            <CallButton />
            <button
              ref={menu}
              className="menu"
              aria-expanded={open}
              aria-controls="navigation"
              aria-label={open ? "Close navigation" : "Open navigation"}
              onClick={() => setOpen(!open)}
            >
              <Icon name={open ? "close" : "menu"} />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
