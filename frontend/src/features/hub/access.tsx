import { platformApi } from "./platform-api";
import { CodeInput, useCountdown } from "./code-input";
import { demoSchools } from "./school-data";
import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  LockKeyhole,
  Eye,
  EyeOff,
} from "lucide-react";
import { categories, type HubRole } from "./data";
import { today, uid, useHub, type Profile } from "./store";
import {
  Empty,
  Field,
  Heading,
  Panel,
  Tag,
  TextLink,
} from "./ui";

async function authRequest(path: string, body: object) {
  const response = await fetch("/api/auth/" + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data;
  try { data = await response.json(); }
  catch { throw Error("Account services are unavailable. Please try again later."); }
  if (!response.ok) throw Error(data.error || "Please try again.");
  return data;
}

export function MemberGuard({ allowed }: { allowed?: HubRole[] }) {
  const { session, isMember, signOut } = useHub();
  const location = useLocation();
  const [checked,setChecked] = useState(false);
  const [accessError,setAccessError] = useState("");
  const [serverRole,setServerRole] = useState<HubRole|null>(null);
  useEffect(()=>{
    let active=true;setChecked(false);setAccessError("");
    platformApi<{role:string}>("/me").then(account=>{
      if(active)setServerRole(account.role==='admin'?'Administrator':account.role==='trainer'?'Trainer':account.role==='mentor'?'Mentor':account.role==='leader'?'Club leader':'Community member');
    }).catch(e=>{if(active){setServerRole(null);setAccessError(e.message);if(e.status===401)signOut();}}).finally(()=>{if(active)setChecked(true);});
    return()=>{active=false;};
  },[session?.profileId,location.pathname]);
  if (!session)
    return (
      <Navigate
        to={`/auth/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  if (!checked) return <div className="hub-content"><p role="status">Checking account access…</p></div>;
  if (!serverRole) return <div className="hub-access-shell"><Panel><Heading title="Sign in required" description={accessError || "Your account access could not be confirmed."}/><Link className="hub-button" to="/auth/login">Sign in again</Link></Panel></div>;
  if (!isMember) return <Navigate to="/application-status" replace />;
  if (allowed && !allowed.includes(serverRole))
    return (
      <div className="hub-content">
        <Empty>
          <LockKeyhole size={30} />
          <h1>This workspace isn’t part of your role.</h1>
          <p>Your member pages are still available.</p>
          <TextLink to="/hub">Return to my journey</TextLink>
        </Empty>
      </div>
    );
  return <Outlet />;
}
function returnDestination(value: string | null) {
  // Only known local member routes may be used as a post-sign-in destination.
  // Backslashes and double slashes are refused outright: browsers can read them as another site.
  return value && !/[\\]|\/\//.test(value) &&
    /^\/(meetings|hub|academy|alx|opportunities|mentorship|community|clubs|passport|profile|certificates|credits|studio|hub-analytics|memberships|verify|school-members|certificate-centre)(\/[^?#]*)?(\?[^#]*)?$/.test(
      value,
    )
    ? value
    : "/hub";
}
function PasswordField({ label, name, creating = false }: { label: string; name: string; creating?: boolean }) {
  const [visible, setVisible] = useState(false);
  const id = `hub-${name}`;
  return <div className="hub-field">
    <label htmlFor={id}>{label}</label>
    <div style={{ position: 'relative' }}>
      <input id={id} name={name} required type={visible ? 'text' : 'password'} autoComplete={creating ? 'new-password' : 'current-password'} minLength={creating ? 12 : undefined} maxLength={creating ? 128 : undefined} placeholder={name === 'confirmPassword' ? 'Re-enter your password' : creating ? 'At least 12 characters' : 'Enter your password'} style={{ width: '100%', paddingRight: 48 }} />
      <button type="button" aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`} aria-controls={id} aria-pressed={visible} onClick={() => setVisible(!visible)} style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, display: 'grid', placeItems: 'center', color: '#52677d', borderRadius: 6 }}>
        {visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
      </button>
    </div>
  </div>;
}
export function SignInPage() {
  const { state, profile, session, isMember, openSession, update } = useHub();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (isMember)
    return <Navigate to={returnDestination(params.get("returnTo") || sessionStorage.getItem("plp-meeting-return"))} replace />;
  return (
    <div className="hub-access-shell">
      <Panel>
        <img src="/favicon.svg" alt="" className="mx-auto mb-4 h-14 w-14" />
        <Heading
          title="Log in to your account"
          description="Enter your credentials to access your PLP Hub."
        />
        <form
          className="hub-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setBusy(true);
            const form = new FormData(e.currentTarget);
            try {
              const email = String(form.get("email")).trim().toLowerCase();
              const account = await authRequest("login", { email, password: String(form.get("password")), remember: form.get("remember") === "on" });
              if (account.pendingApproval) { navigate('/auth/pending', {replace:true}); return; }
              const member = { ...(state.profiles.find((p) => p.email.toLowerCase() === email) || {
                id: account.id, name: account.name, email,
                role: "Community member" as const, bio: "", skills: [], leadership: [],
                clubIds: [], managedClubIds: [], joined: today(), membership: "Approved" as const,
              }) };
              member.membership = "Approved";
              member.role = account.role === "admin" ? "Administrator" : account.role === "trainer" ? "Trainer" : account.role === "leader" ? "Club leader" : account.role === "mentor" ? "Mentor" : "Community member";
              update((s) => {
                const existing = s.profiles.find(p => p.id === member.id);
                if (existing) { existing.membership = "Approved"; existing.role = member.role; existing.requestedRole = undefined; }
                else s.profiles.push(member);
                s.currentId = member.id;
              });
              if (
                openSession(
                  member.id,
                  member.membership === "Approved" ? "member" : "applicant",
                )
              )
                navigate(
                  member.membership === "Approved"
                    ? returnDestination(params.get("returnTo") || sessionStorage.getItem("plp-meeting-return"))
                    : "/application-status",
                  { replace: true },
                );
            } catch (error) {
              setError((error as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Email address">
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              defaultValue={session ? profile.email : ""}
            />
          </Field>
          <PasswordField label="Password" name="password" />
          <div className="hub-forgot-row">
            <label className="hub-remember"><input type="checkbox" name="remember" defaultChecked /> Keep me signed in for 30 days</label>
            <Link to="/auth/forgot-password" className="hub-text-link">
              Forgot password?
            </Link>
          </div>
          {params.get("reset") === "1" && !error && (
            <p role="status" className="hub-access-success">
              Password updated. Sign in with your new password.
            </p>
          )}
          {error && (
            <p role="alert" className="hub-access-error">
              {error}
            </p>
          )}
          <button className="hub-button hub-access-submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
            <ArrowRight size={16} />
          </button>
        </form>
        <p className="hub-access-footnote">
          Don’t have an account yet?{" "}
          <Link to="/auth/signup" className="hub-text-link">
            Sign up here
          </Link>
        </p>
      </Panel>
    </div>
  );
}
export function ForgotPasswordPage() {
  const navigate = useNavigate();
  // A reset link from an email (/auth/reset#<token>) goes straight to choosing a new password.
  const [linkToken] = useState(() => { const t = window.location.hash.slice(1); return /^[A-Za-z0-9_-]{40,100}$/.test(t) ? t : ""; });
  const [step, setStep] = useState<"email" | "code" | "password">(linkToken ? "password" : "email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState(linkToken);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const countdown = useCountdown();
  async function send(address: string) {
    setBusy(true); setError("");
    try {
      await authRequest("forgot", { email: address });
      setEmail(address); setCode(""); setStep("code"); countdown.start();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return <div className="hub-access-shell"><Panel>
    <img src="/favicon.svg" alt="" className="mx-auto mb-4 h-14 w-14" />
    <Heading title={step === "password" ? "Choose a new password" : step === "code" ? "Check your email" : "Forgot your password?"}
      description={step === "email" ? "Enter your email and we’ll send you a code to reset your password." : step === "code" ? `If an eligible account uses ${email}, a 6-digit code will arrive shortly. Check your spam folder too.` : "Enter and confirm your new password."} />
    <form key={step} className="hub-form" onSubmit={async e => {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      if (step === "email") { await send(String(form.get("email")).trim().toLowerCase()); return; }
      setError("");
      if (step === "password" && form.get("password") !== form.get("confirmPassword")) { setError("The two passwords do not match."); return; }
      setBusy(true);
      try {
        if (step === "code") {
          const result = await authRequest("forgot/verify", { email, code });
          setToken(result.token); setStep("password");
        } else {
          await authRequest("reset", { token, password: form.get("password") });
          navigate("/auth/login?reset=1", { replace: true });
        }
      } catch (e) { setError((e as Error).message); }
      finally { setBusy(false); }
    }}>
      {step === "email" && <Field label="Email address"><input type="email" name="email" autoComplete="email" required maxLength={254} defaultValue={email} /></Field>}
      {step === "code" && <>
        <CodeInput value={code} onChange={setCode} disabled={busy} />
        <p className="hub-code-resend"><button type="button" disabled={busy || countdown.seconds > 0} onClick={() => void send(email)}>{countdown.seconds > 0 ? `Resend in ${countdown.label}` : "Resend code"}</button></p>
        <button type="button" className="hub-text-link" disabled={busy} onClick={() => { setStep("email"); setError(""); }}>Use a different email</button>
      </>}
      {step === "password" && <><PasswordField label="New password" name="password" creating /><PasswordField label="Confirm new password" name="confirmPassword" creating /></>}
      {error && <p role="alert" className="hub-access-error">{error}</p>}
      <button className="hub-button hub-access-submit" disabled={busy || (step === "code" && code.length !== 6)}>{busy ? "Please wait…" : step === "password" ? "Update password" : "Continue"}<ArrowRight size={16} /></button>
    </form>
    <p className="hub-access-footnote"><Link to="/auth/login" className="hub-text-link">Back to sign in</Link></p>
  </Panel></div>;
}
export function JoinPage() {
  const { state, isMember, update } = useHub();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [accountRole, setAccountRole] = useState("Member");
  const token = params.get("invite");
  const invitation = state.invitations.find(
    (i) => i.code === token && !i.usedBy && !i.revoked,
  );
  const inviter = state.profiles.find((p) => p.id === invitation?.createdBy);
  const validInvitation =
    !!invitation &&
    inviter?.membership === "Approved" &&
    (inviter.role === "Administrator" ||
      (inviter.role === "Club leader" &&
        inviter.managedClubIds.includes(invitation.clubId)));
  if (isMember)
    return (
      <div className="hub-section hub-narrow">
        <Panel>
          <h1>You’re already a PLP member.</h1>
          <TextLink to="/hub">Continue to my journey</TextLink>
        </Panel>
      </div>
    );
  return (
    <div className="hub-section hub-narrow">
      <Heading
        title="Join PLP"
      />
      {token && (
        <p className={validInvitation ? "hub-feedback" : "hub-access-error"}>
          {validInvitation
            ? `You’ve been invited by ${inviter?.name}. Use the invited email address to join their club.`
            : "This invitation is invalid, already used, or no longer active. You can still create an account."}
        </p>
      )}
      <Panel>
        <form
          className="hub-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            const f = new FormData(e.currentTarget);
            const email = String(f.get("email")).trim().toLowerCase();
            const name = String(f.get("name")).trim();
            const password = String(f.get("password"));
            if (!name || password.length < 12) {
              setError(
                "Enter your name and a password of at least 12 characters.",
              );
              return;
            }
            if (password !== String(f.get("confirmPassword"))) {
              setError("Passwords do not match. Please confirm your password.");
              return;
            }
            if (state.profiles.some((p) => p.email.toLowerCase() === email)) {
              setError(
                "An account already uses this email. Sign in with your password.",
              );
              return;
            }
            if (validInvitation && invitation.email.toLowerCase() !== email) {
              setError(
                "Use the email address on the invitation, or join without the invitation link.",
              );
              return;
            }
            setBusy(true);
            try {
              await authRequest("register", { email, name, password, ...(accountRole !== "Member" ? {requested_role: accountRole === "Trainer" ? "trainer" : accountRole === "Mentor" ? "mentor" : "leader"} : {}) });
              const id = uid();
              const next: Profile = {
                id,
                name,
                email,
                role: f.get("category") === "High school" ? "Student member" : f.get("category") === "University" ? "University member" : "Community member",
                memberCategory: String(f.get("category") || "Community"),
                requestedRole: f.get("accountRole") === "Member" ? undefined : String(f.get("accountRole")),
                schoolName: String(f.get("school") || "").trim().toUpperCase() || undefined,
                schoolId: demoSchools.find(s => s.name.toUpperCase() === String(f.get("school") || "").trim().toUpperCase())?.id,
                bio: "",
                skills: [],
                leadership: [],
                clubIds: validInvitation ? [invitation.clubId] : [],
                managedClubIds: [],
                joined: today(),
                membership: "Pending",
              };
              const ok = update((s) => {
                s.profiles.push(next);
                if (validInvitation)
                  s.invitations.find((i) => i.id === invitation.id)!.usedBy =
                    id;
                s.currentId = id;
              });
              if (ok) {
                sessionStorage.setItem("plp-verification-email", email);
                navigate("/auth/verify-email");
              }
            } catch (error) {
              setError((error as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Full name">
            <input
              name="name"
              required
              maxLength={80}
              pattern=".*\S.*"
              autoComplete="name"
            />
          </Field>
          <Field label="Email address">
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={validInvitation ? invitation.email : ""}
            />
          </Field>
          <Field label="Account type">
            <select name="accountRole" value={accountRole} onChange={e => setAccountRole(e.target.value)}><option>Member</option><option>Club leader</option><option>Trainer</option><option>Mentor</option></select>
          </Field>
          {accountRole === "Member" && <Field label="Member category"><select name="category"><option>Community</option><option>High school</option><option>University</option></select></Field>}
          <Field label="School (if applicable)"><input name="school" list="school-suggestions" maxLength={160} autoCapitalize="characters" placeholder="TYPE YOUR SCHOOL NAME" onChange={e => { e.currentTarget.value = e.currentTarget.value.toUpperCase(); }}/><datalist id="school-suggestions">{demoSchools.map(s=><option key={s.id} value={s.name.toUpperCase()}/>)}</datalist></Field>
          <PasswordField label="Password" name="password" creating />
          <PasswordField label="Confirm password" name="confirmPassword" creating />
          {error && (
            <p role="alert" className="hub-access-error">
              {error}
            </p>
          )}
          <button className="hub-button" disabled={busy}>
            {busy ? "Creating account…" : "Create account"}
            <ArrowRight size={17} />
          </button>
        </form>
        <TextLink to="/auth/login">Already a member? Sign in</TextLink>
      </Panel>
    </div>
  );
}
export function ApplicationStatusPage() {
  const { session, isMember, profile } = useHub();
  if (!session) return <Navigate to="/auth/login" replace />;
  if (isMember) return <Navigate to="/hub" replace />;
  return <div className="hub-section hub-narrow"><Panel>
    <Heading title="Your membership is paused" description="Contact PLP for help restoring access to your account." />
    {profile.reviewNote && <p>{profile.reviewNote}</p>}
    <a className="hub-text-link" href="mailto:info@peaceloveproclaimers.org">Contact PLP</a>
  </Panel></div>;
}
export function CoursePreviewPage() {
  const { state } = useHub();
  const [params] = useSearchParams();
  const initialCategory = params.get("category");
  const [category, setCategory] = useState(
    initialCategory && categories.some((c) => c === initialCategory)
      ? initialCategory
      : "All pathways",
  );
  return (
    <div className="hub-section">
      <Heading
        eyebrow="EXPLORE WHAT YOU COULD LEARN"
        title="Learning with PLP"
        description="Discover the five pathways. Full lessons, assessments, and your learning record are available inside the members-only Hub."
      />
      <div className="hub-chips">
        {["All pathways", ...categories].map((c) => (
          <button
            key={c}
            className={category === c ? "active" : ""}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="hub-grid three">
        {state.courses
          .filter(
            (c) =>
              c.published &&
              (category === "All pathways" || c.category === category),
          )
          .map((c) => (
            <Panel key={c.id}>
              <Tag>{c.category}</Tag>
              <h2>{c.title}</h2>
              <p>{c.summary}</p>
              <p className="hub-caption">
                {c.level} · {c.duration}
              </p>
              <TextLink
                to={`/auth/login?returnTo=${encodeURIComponent("/academy/" + c.id)}`}
              >
                Member sign-in to learn
              </TextLink>
            </Panel>
          ))}
      </div>
      <Panel className="hub-space">
        <h2>Your next chapter starts here.</h2>
        <p>
          Join PLP to access learning, guidance, and your own growth record.
        </p>
        <TextLink to="/auth/signup">Join PLP</TextLink>
      </Panel>
    </div>
  );
}

export function StaffPendingPage() {
 return <div className="hub-access-shell"><Panel><Heading title="Application under review" description="Your email is verified. An administrator must approve your staff application before you can access your workspace."/><p>Once approved, sign in again to open your dashboard.</p><Link className="hub-button" to="/auth/login">Back to sign in</Link></Panel></div>;
}
