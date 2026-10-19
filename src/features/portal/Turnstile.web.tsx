import { useEffect, useRef, useState } from "react";

const SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY || "";
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
type WidgetOptions = {
  sitekey: string;
  action: string;
  theme: "light";
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
}: {
  onToken: (token: string) => void;
  resetKey: number;
}) {
  const node = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const callback = useRef(onToken);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    SITE_KEY ? "loading" : "error",
  );

  useEffect(() => {
    callback.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!SITE_KEY || !node.current) return;
    let active = true;
    let script = document.querySelector<HTMLScriptElement>("script[data-smc-turnstile]");
    const render = () => {
      if (!active || !node.current || !window.turnstile || widget.current) return;
      try {
        widget.current = window.turnstile.render(node.current, {
          sitekey: SITE_KEY,
          action: "patient_auth",
          theme: "light",
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
  }, []);

  useEffect(() => {
    if (!resetKey || !widget.current || !window.turnstile) return;
    callback.current("");
    window.turnstile.reset(widget.current);
    setStatus("ready");
  }, [resetKey]);

  return (
    <div className="portal-turnstile" aria-label="Bot verification">
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
