import { AccessSessionError, fetchPortalAuth } from "./auth-fetch";
import Turnstile from "./Turnstile.web";
import { useEffect, useState } from "react";
import { portalSections } from "./config";
import { portalSamples } from "./mock";
import "../../styles/portal.css";

type Session = { email: string; displayName?: string | null };
type Mode = "login" | "register" | "forgot" | "verify" | "reset" | "activate" | "activate-request";
const title = "SMC CareConnect";
async function request(action: string, body: Record<string,string> = {}) {
  const response = await fetchPortalAuth("/api/portal/auth/" + action, {
    method: "POST", headers: { "Content-Type": "application/json" },
    credentials: "same-origin", body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reference = data.requestId ? ` Reference: ${data.code || "AUTH_ERROR"} / ${data.requestId}.` : "";
    throw Error((data.error || "Unable to complete your request.") + reference);
  }
  return data;
}
function Entrance() {
  const params = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const start = params.get("mode");
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [googleProfile,setGoogleProfile]=useState<{email:string;displayName?:string;action:"register"|"link";verifiedEmail:boolean}|null>(null);
  const [googleLoading,setGoogleLoading]=useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [authConfig, setAuthConfig] = useState<{turnstileSiteKey:string;emailPasswordReady:boolean;recoveryReady:boolean;googleReady:boolean;databaseReady?:boolean;configurationCode?:string;requestId?:string}|null>(null);
  const [configError, setConfigError] = useState("");
  const [accessRequired, setAccessRequired] = useState(false);
  useEffect(()=>{let active=true;fetchPortalAuth("/api/portal/auth/config",{cache:"no-store"}).then(async response=>{const data=await response.json();if(!response.ok)throw Error(typeof data.error === "string" ? data.error : "Authentication service unavailable");return data;}).then(data=>{if(active)setAuthConfig(data);}).catch(err=>{if(active){setAccessRequired(err instanceof AccessSessionError);setConfigError(err instanceof Error ? err.message : "Patient login configuration is unavailable. Please contact the site administrator.");}});return()=>{active=false;};},[]);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [notice, setNotice] = useState("");
  useEffect(()=>{
    if (params.get("provider")!=="google") return;
    setGoogleLoading(true);
    let active=true;
    fetchPortalAuth("/api/portal/auth/google/registration").then(async response=>{
      const data=await response.json();
      if(!response.ok)throw Error(data.error || "Google registration is unavailable.");
      if(active){setGoogleProfile(data);setEmail(data.email);setMode(data.action==="link"?"login":"register");}
    }).catch(err=>{if(active){setAccessRequired(err instanceof AccessSessionError);setError(err instanceof Error?err.message:"Google registration unavailable.");}})
      .finally(()=>{if(active)setGoogleLoading(false);});
    return()=>{active=false;};
  },[]);
  const [error, setError] = useState("");
  const [activationToken,setActivationToken] = useState("");
  const token = activationToken;
  useEffect(()=>{
    // Query-driven auth screens are applied after hydration of Expo's static HTML.
    if (["register","forgot","verify","reset","activate"].includes(start || "")) setMode(start as Mode);
    if (params.has("error")) setError("Google sign-in was not completed. Verify your account email or contact the clinic if the problem continues.");
    const value=params.get("token") || "";
    setActivationToken(value);
    if (value && ["verify","reset","activate"].includes(start || "")) window.history.replaceState(null,"","/portal?mode="+start);
  },[]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();if (mode !== "verify" && mode !== "activate" && !turnstileToken) {setError("Complete the security check first.");return;}setBusy(true);setError("");setNotice("");
    try {
      const result = await request(mode === "register" ? "register" : mode === "forgot" ? "forgot" : mode === "reset" ? "reset" : mode === "verify" ? "verify" : mode === "activate" ? "activate/complete" : mode === "activate-request" ? "activate/request" : "login",
        mode === "verify" ? { token } : mode === "activate" ? { token, password } : mode === "activate-request" ? { email, turnstileToken } : mode === "reset" ? { token, password, turnstileToken } : mode === "forgot" ? { email, turnstileToken } : { email, password, turnstileToken, ...(googleProfile ? {googleRegistration:"1"} : {}) });
      if (mode === "login" || result.signedIn) window.location.assign("/portal/dashboard");
      else {
        setNotice(mode === "register" ? "If registration is eligible, check your email to verify your account." : mode === "forgot" ? "If that email is registered, you will receive a reset link." : mode === "activate-request" ? "If the account is eligible, an activation link will be emailed." : "Request completed. You can now sign in.");
        setPassword("");
        if (mode === "register" || mode === "verify" || mode === "reset" || mode === "activate") {setMode("login");setGoogleProfile(null);}
      }
    } catch (err) { setAccessRequired(err instanceof AccessSessionError);setError(err instanceof Error ? err.message : "Something went wrong."); }
    finally { setBusy(false);setTurnstileToken("");setTurnstileReset(k=>k+1); }
  }
  const label = mode === "register" ? "Create account" : mode === "forgot" ? "Reset your password" : mode === "reset" ? "Choose a new password" : mode === "verify" ? "Confirm your email" : mode === "activate" ? "Activate your account" : mode === "activate-request" ? "Request activation link" : "Welcome back";
  return <div className="portal-entry">
    <div className="portal-entry-aside">
      <a href="/" className="portal-logo"><img src="/images/smc-logo-v1.png" alt="" width="72" height="72"/><span><strong>SMC</strong><small>CareConnect</small></span></a>
      <div><div className="portal-kicker">Your health. Your connection.</div><h1>Care that stays with you.</h1><p>A more connected way to manage your health, stay organized, and reach the team you trust.</p></div>
      <p className="portal-entry-foot">For a life-threatening emergency, call 911. This portal is not monitored for emergencies.</p>
    </div>
    <main className="portal-entry-main"><div className="portal-auth">
      <a href="/" className="portal-back">← Return to SMC Urgent Care</a>
      <span className="portal-eyebrow">Patient access</span>
      <h2>{label}</h2>
      <p className="portal-muted">{mode === "login" ? "Use your email and password to sign in, or continue with Google." : mode === "register" ? "Create an account for the CareConnect interface. Clinical records are not connected yet." : "Follow the instructions below."}</p>
      {googleLoading && <p role="status">Loading your verified Google email…</p>}
      {googleProfile && <div className="portal-success" role="status">{googleProfile.action === "register" ? "Finish creating your account by choosing a password. You can then sign in with email/password or Google." : "Sign in with your existing password once to securely connect this Google account."}</div>}
      {mode === "register" && !googleProfile?.verifiedEmail && authConfig && !authConfig.recoveryReady && <div className="portal-error" role="alert">Account creation requires email verification, which is currently unavailable. Please contact the site administrator.</div>}
      {(error || configError) && <div className="portal-error" role="alert">{error || configError}{accessRequired && <> <a href="/portal">Renew preview access</a></>}</div>}
      {authConfig && !authConfig.turnstileSiteKey && <div className="portal-error" role="alert">Bot verification has not been configured for this domain. Sign-in is unavailable.</div>}
      {authConfig?.databaseReady === false && <div className="portal-error" role="alert">Patient sign-in is temporarily unavailable. Contact the site administrator with reference {authConfig.configurationCode}{authConfig.requestId ? ` / ${authConfig.requestId}` : ""}.</div>}
      {notice && <div className="portal-success" role="status">{notice}</div>}
      <form onSubmit={submit} className="portal-form">
        {["login","register","forgot","activate-request"].includes(mode) && <label>Email address<input type="email" name="email" autoComplete="email" required readOnly={!!googleProfile} value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>}
        {["login","register","reset","activate"].includes(mode) && <label>Password
          <span className="portal-password"><input type={showPassword ? "text" : "password"} autoComplete={mode==="login"?"current-password":"new-password"} minLength={mode==="login"?undefined:12} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode==="register" ? "Choose a password (12+ characters)" : "Enter your password"}/><button type="button" onClick={()=>setShowPassword(!showPassword)}>{showPassword?"Hide":"Show"}</button></span>
        </label>}
        {mode !== "verify" && mode !== "activate" && <Turnstile onToken={setTurnstileToken} resetKey={turnstileReset} siteKey={authConfig?.turnstileSiteKey || ""} />}
        <button type="submit" disabled={busy || googleLoading || !!configError || (mode==="register" && !googleProfile?.verifiedEmail && !authConfig?.recoveryReady) || (mode !== "verify" && mode !== "activate" && (!turnstileToken || !authConfig?.emailPasswordReady))} className="portal-primary">{busy?"Processing…":mode==="login"?"Sign in with email":mode==="register"?"Create account":mode==="forgot"?"Send reset link":mode==="reset"?"Update password":mode==="activate"?"Set password":mode==="activate-request"?"Email activation link":"Verify email"}</button>
      </form>
      {mode==="login" && !googleProfile && <><div className="portal-or">or continue with</div><button type="button" className="portal-google" disabled={!turnstileToken || busy || googleLoading || !authConfig?.googleReady} onClick={async()=>{if(!turnstileToken)return;setBusy(true);setError("");try{const result=await request("google/start",{turnstileToken});if(typeof result.redirect !== "string")throw Error("Google login unavailable.");window.location.assign(result.redirect);}catch(err){setAccessRequired(err instanceof AccessSessionError);setError(err instanceof Error?err.message:"Google login unavailable.");setTurnstileToken("");setTurnstileReset(k=>k+1);setBusy(false);}}}><span className="portal-g">G</span> Google</button></>}
      <div className="portal-login-links">
        {mode==="login" ? <><button onClick={()=>{setMode("forgot");setError("");setNotice("");setTurnstileToken("");setTurnstileReset(k=>k+1);}}>Forgot password?</button><button onClick={()=>{setMode("register");setError("");setNotice("");setTurnstileToken("");setTurnstileReset(k=>k+1);}}>Create an account</button><button onClick={()=>{setMode("activate-request");setError("");setNotice("");setTurnstileToken("");setTurnstileReset(k=>k+1);}}>Activate invited account</button></> : <button onClick={()=>{setMode("login");setGoogleProfile(null);setError("");setTurnstileToken("");setTurnstileReset(k=>k+1);}}>Back to sign in</button>}
      </div>
      {googleProfile?.action==="link" && <button type="button" className="portal-text-link" onClick={()=>{setGoogleProfile(null);setError("");setPassword("");setTurnstileToken("");setTurnstileReset(k=>k+1);}}>Use email and password without connecting Google</button>}
      <p className="portal-disclaimer">Your account is for this new interface only. Clinical results, messages, billing and insurance are demonstration screens until approved integrations are available. <a href="https://sarepta.prognocis.com/prognocis/sareptaClinicIndex.html" target="_blank" rel="noopener noreferrer">Open existing clinical portal ↗</a></p>
    </div></main>
  </div>;
}
export default function Portal({ screen = "login" }: { screen?: string }) {
  const [user, setUser] = useState<Session | null>(null);
  const [loading, setLoading] = useState(screen !== "login");
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState("All");
  const [draft, setDraft] = useState("");
  const [drafts, setDrafts] = useState<string[]>([]);
  useEffect(()=>{
    if (screen === "login") return;
    let alive=true;
    fetchPortalAuth("/api/portal/auth/session",{credentials:"same-origin",cache:"no-store"}).then(async r=>{
      if (!r.ok) { window.location.replace("/portal");return; }
      const data=await r.json();if(alive){setUser(data.user);setLoading(false);}
    }).catch(()=>window.location.replace("/portal"));
    return ()=>{alive=false;};
  },[screen]);
  if (screen === "login") return <Entrance/>;
  if (loading) return <div className="portal-loading" role="status">Verifying your CareConnect session…</div>;
  const current = portalSections.find(item=>item.id===screen) || portalSections[0];
  const items = screen === "dashboard" ? [] : (portalSamples as Record<string,readonly (readonly string[])[]>)[screen] || [];
  const visible = items.filter(item=>item.some(text=>text.toLowerCase().includes(filter.toLowerCase())) && (tab==="All" || item[2]===tab));
  const tabs = ["All",...new Set(items.map(item=>item[2]))];
  async function logout(){try {await request("logout");window.location.replace("/portal");}catch{window.location.replace("/portal");}}
  return <div className="portal-app">
    <aside className="portal-side"><a href="/" className="portal-logo"><img src="/images/smc-logo-v1.png" width="52" height="52" alt=""/><span><strong>SMC</strong><small>CareConnect</small></span></a>
      <nav aria-label="Patient portal" className="portal-nav">{portalSections.map(item=><a key={item.id} href={"/portal/"+item.id} aria-current={current.id===item.id?"page":undefined}><span aria-hidden="true">{item.icon}</span>{item.label}</a>)}</nav>
      <div className="portal-side-bottom"><p>Need help? <a href="tel:+13178523505">Call the clinic</a></p><button onClick={logout}>Sign out ↗</button></div>
    </aside>
    <div className="portal-shell">
      <header className="portal-top"><div><span className="portal-top-title">{current.label}</span><span className="portal-demo-tag">Clinical demo only</span></div><div className="portal-top-user"><span>{user?.email}</span><span className="portal-avatar" aria-hidden="true">{(user?.email||"P").charAt(0).toUpperCase()}</span></div></header>
      <nav className="portal-mobile-nav" aria-label="Portal sections">{portalSections.map(item=><a key={item.id} href={"/portal/"+item.id} aria-current={item.id===current.id?"page":undefined}>{item.label}</a>)}</nav>
      <main className="portal-content">
        <div className="portal-eyebrow">{screen==="dashboard"?"PATIENT DASHBOARD":"YOUR CARE"}</div>
        <h1>{screen==="dashboard"?"Welcome to CareConnect.":current.label}</h1><p className="portal-muted">{screen==="dashboard"?"Your care, organized in one place.":current.description}</p>
        <div className="portal-warning" role="note"><strong>Sample-data preview.</strong> Clinical records, staff messaging, insurance and payments are not connected. Do not enter real health information.</div>
        {screen==="dashboard" ? <>
          <div className="portal-cards">{portalSections.slice(1,5).map(item=><a key={item.id} href={"/portal/"+item.id} className="portal-action"><span className="portal-action-icon" aria-hidden="true">{item.icon}</span><strong>{item.label}</strong><small>{item.description}</small><span className="portal-action-arrow" aria-hidden="true">→</span></a>)}</div>
          <div className="portal-columns"><section className="portal-panel"><h2>Your care at a glance</h2>{[["Recent visit","Visits","visits"],["Care team","Physicians and staff","care-team"],["Insurance","Plan information","insurance"],["Documents","Your care records","documents"]].map(([name,desc,id])=><a key={id} href={"/portal/"+id} className="portal-row"><span><strong>{name}</strong><small>{desc}</small></span><span>→</span></a>)}</section><section className="portal-panel"><h2>Helpful actions</h2><p className="portal-muted">View your account settings or contact SMC for actual care questions.</p><a className="portal-primary portal-link" href="/portal/settings">Account settings →</a><a className="portal-text-link" href="tel:+13178523505">Call SMC Urgent Care</a></section></div>
        </> : <>
          <div className="portal-toolbar"><label className="portal-search">Search this section<input type="search" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search examples"/></label><div className="portal-filters" aria-label="Filter examples">{tabs.map(option=><button key={option} className={tab===option?"active":""} onClick={()=>setTab(option)} aria-pressed={tab===option}>{option}</button>)}</div></div>
          <div className="portal-columns"><section className="portal-panel"><h2>Overview</h2>{visible.length ? visible.map((item,i)=><button type="button" className="portal-row portal-row-button" key={i} onClick={()=>setSelected(item[0])}><span><strong>{item[0]}</strong><small>{item[1]}</small></span><span className="portal-status">{item[2]}</span></button>):<p className="portal-muted">No matching sample records.</p>}</section><section className="portal-panel"><h2>{selected || "Details & actions"}</h2><p className="portal-muted">{selected?"This is a demonstration item. No patient records or care systems were accessed.":"Select an example row to inspect its details."}</p>{screen==="messages" && <div className="portal-form"><label>Sample message draft<textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Use fictional content only" maxLength={1000}/></label><button className="portal-primary" onClick={()=>{if(draft.trim()){setDrafts([...drafts,draft.trim()]);setDraft("");}}}>Save local demo draft</button>{drafts.map((text,i)=><div className="portal-draft" key={i}>{text}</div>)}</div>}{screen==="billing" && <p className="portal-muted">Online payment will only be available after secure provider checkout integration.</p>}{screen==="medications" && <p className="portal-muted">Refill requests are not sent to a prescribing clinician or pharmacy.</p>}<a href="https://sarepta.prognocis.com/prognocis/sareptaClinicIndex.html" target="_blank" rel="noopener noreferrer" className="portal-primary portal-link">Open existing clinical portal ↗</a></section></div>
        </>}
        <footer className="portal-footer"><span>© {new Date().getFullYear()} SMC Urgent Care · CareConnect</span><span>Not monitored for emergencies. Call 911 when needed.</span></footer>
      </main>
    </div>
  </div>;
}

