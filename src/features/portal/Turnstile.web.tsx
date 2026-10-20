import { useEffect, useRef, useState } from "react";


const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
type WidgetOptions = {
  sitekey: string;
  action: string;
  theme: "light";
  size: "compact" | "flexible";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};
type TurnstileAPI = {
  render: (node: HTMLElement, options: WidgetOptions) => string;
  remove: (id: string) => void;
  reset: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileAPI;
  }
}

export default function Turnstile({
  onToken,
  resetKey,
  siteKey,
}: {
  onToken: (token: string) => void;
  resetKey: number;
  siteKey: string;
}) {
  const node = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const callback = useRef(onToken);
  const [size, setSize] = useState<"compact" | "flexible" | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    siteKey ? "loading" : "error",
  );

  useEffect(() => {
    callback.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!node.current) return;
    // Flexible widgets require 300px; compact keeps security checks usable at zoomed widths.
    const measure = () => setSize(node.current!.getBoundingClientRect().width < 300 ? "compact" : "flexible");
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!siteKey || !node.current || !size) return;
    let active = true;
    let script = document.querySelector<HTMLScriptElement>("script[data-smc-turnstile]");
    const render = () => {
      if (!active || !node.current || !window.turnstile || widget.current) return;
      try {
        widget.current = window.turnstile.render(node.current, {
          sitekey: siteKey,
          action: "patient_auth",
          theme: "light",
          size,
          callback: (token) => callback.current(token),
          "expired-callback": () => callback.current(""),
          "error-callback": () => {
            callback.current("");
            setStatus("error");
          },
        });
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    };
    if (window.turnstile) render();
    else {
      if (!script) {
        script = document.createElement("script");
        script.src = SCRIPT_URL;
        script.async = true;
        script.dataset.smcTurnstile = "1";
        document.head.appendChild(script);
      }
      script.addEventListener("load", render);
      script.addEventListener("error", () => {
        if (active) setStatus("error");
      });
    }
    // While a script is already loading, its load event is shared by all mounts.
    return () => {
      active = false;
      script?.removeEventListener("load", render);
      if (widget.current && window.turnstile) {
        window.turnstile.remove(widget.current);
        widget.current = null;
      }
      callback.current("");
    };
  }, [siteKey, size]);

  useEffect(() => {
    if (!resetKey || !widget.current || !window.turnstile) return;
    callback.current("");
    window.turnstile.reset(widget.current);
    setStatus("ready");
  }, [resetKey]);

  return (
    <div className="portal-turnstile" data-size={size || undefined} aria-label="Bot verification">
      <div ref={node} />
      {status === "loading" && <p role="status">Loading security check…</p>}
      {status === "error" && (
        <p role="alert">
          Verification is unavailable. Check the Turnstile site key, allowed
          hostname, and your connection, then reload this page.
        </p>
      )}
    </div>
  );
}
