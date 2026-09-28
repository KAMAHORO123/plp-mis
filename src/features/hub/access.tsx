import { demoAccounts, demoSchools } from "./school-data";
import { useState } from "react";
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
} from "lucide-react";
import { categories, type HubRole } from "./data";
import { createPasswordHash, verifyPassword, today, uid, useHub, type Profile } from "./store";
import {
  Empty,
  Field,
  Heading,
  Panel,
  Tag,
  TextLink,
} from "./ui";

export function MemberGuard({ allowed }: { allowed?: HubRole[] }) {
  const { session, profile, isMember } = useHub();
  const location = useLocation();
  if (!session)
    return (
      <Navigate
        to={`/sign-in?returnTo=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  if (!isMember) return <Navigate to="/application-status" replace />;
  if (allowed && !allowed.includes(profile.role))
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
  return value &&
    /^\/(hub|academy|alx|opportunities|mentorship|community|clubs|passport|profile|certificates|credits|studio|hub-analytics|memberships|verify|school-members|certificate-centre)(\/[^?#]*)?(\?[^#]*)?$/.test(
      value,
    )
    ? value
    : "/hub";
}
export function SignInPage() {
  const { state, profile, session, isMember, openSession, update } = useHub();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (isMember)
    return <Navigate to={returnDestination(params.get("returnTo"))} replace />;
  return (
    <div className="hub-access-shell">
      <Panel>
        <img src="/favicon.svg" alt="" className="mx-auto mb-4 h-14 w-14" />
        <Heading
          title="Welcome back"
          description="Sign in with your email and password to continue your PLP journey."
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
              const member = state.profiles.find((p) => p.email.toLowerCase() === email);
              if (!member || !await verifyPassword(String(form.get("password")), member.credentialHash)) {
                setError(
                  "The email or password is incorrect.",
                );
                return;
              }
              update((s) => {
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
                    ? returnDestination(params.get("returnTo"))
                    : "/application-status",
                  { replace: true },
                );
            } catch {
              setError("Sign-in could not be completed. Try again.");
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
          <Field label="Password">
            <input
              name="password"
              required
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
            />
          </Field>
          {error && (
            <p role="alert" className="hub-access-error">
              {error}
            </p>
          )}
          <button className="hub-button" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
            <ArrowRight size={16} />
          </button>
        </form>
        <p className="hub-caption hub-space">
          Preview accounts are saved in this browser only.
        </p>
        <p>
          New to PLP?{" "}
          <Link to="/join" className="hub-text-link">
            Join PLP
          </Link>
        </p>
        <details className="hub-dev-note" open>
          <summary>Explore demo dashboards</summary>
          <p className="hub-caption">Shared demo password: <strong>PlpDemo2026!</strong>. These accounts use local sample data only.</p>
          <div className="ws-demo-grid">{demoAccounts.map(account=><button key={account.id} onClick={()=>{if(openSession(account.id,"member"))navigate("/hub");}}>{account.role === "Community member" ? "Member" : account.role}<small>{account.email}</small></button>)}</div>
        </details>
      </Panel>
    </div>
  );
}
export function JoinPage() {
  const { state, isMember, update, openSession } = useHub();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
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
        eyebrow="BELONG. LEARN. CONTRIBUTE."
        title="Join PLP"
        description="Create your account and start learning, connecting, and contributing right away."
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
            if (!name || password.length < 8) {
              setError(
                "Enter your name and a password of at least 8 characters.",
              );
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
              const id = uid();
              const credentialHash = await createPasswordHash(password);
              const next: Profile = {
                id,
                name,
                email,
                role: f.get("category") === "High school" ? "Student member" : f.get("category") === "University" ? "University member" : "Community member",
                memberCategory: String(f.get("category") || "Community"),
                requestedRole: f.get("accountRole") === "Member" ? undefined : String(f.get("accountRole")),
                schoolId: f.get("school") ? String(f.get("school")) : undefined,
                bio: "",
                skills: [],
                leadership: [],
                clubIds: validInvitation ? [invitation.clubId] : [],
                managedClubIds: [],
                joined: today(),
                membership: "Approved",
                credentialHash,
              };
              const ok = update((s) => {
                s.profiles.push(next);
                if (validInvitation)
                  s.invitations.find((i) => i.id === invitation.id)!.usedBy =
                    id;
                s.currentId = id;
              });
              if (ok) {
                if (openSession(id, "member")) navigate("/hub");
              }
            } catch {
              setError(
                "Your account could not be created. Try again or sign in if it was already saved.",
              );
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
            <select name="accountRole"><option>Member</option><option>Club leader</option><option>School coordinator</option><option>Trainer</option></select>
          </Field>
          <p className="hub-caption">Members start immediately. Club leader, coordinator, and trainer access is activated by PLP after verifying your assignment. To explore staff dashboards now, use a demo account on Sign in.</p>
          <Field label="Member category"><select name="category"><option>Community</option><option>High school</option><option>University</option></select></Field>
          <Field label="School (if applicable)"><select name="school"><option value="">Not affiliated with a school</option>{demoSchools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          <Field label="Password">
            <input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} placeholder="At least 8 characters" />
          </Field>
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
        <p className="hub-caption">
          Preview accounts are saved in this browser only.
        </p>
        <TextLink to="/sign-in">Already a member? Sign in</TextLink>
      </Panel>
    </div>
  );
}
export function ApplicationStatusPage() {
  const { session, isMember, profile } = useHub();
  if (!session) return <Navigate to="/sign-in" replace />;
  if (isMember) return <Navigate to="/hub" replace />;
  return <div className="hub-section hub-narrow"><Panel>
    <Heading title="Your membership is paused" description="Contact PLP for help restoring access to your account." />
    {profile.reviewNote && <p>{profile.reviewNote}</p>}
    <a className="hub-text-link" href="mailto:info@peaceloveproclaimers.org">Contact PLP</a>
  </Panel></div>;
}
export function DevelopmentAccessPage() {
  const { state, openSession, update } = useHub();
  const navigate = useNavigate();
  if (!import.meta.env.DEV) return <Navigate to="/sign-in" replace />;
  return (
    <div className="hub-section hub-narrow">
      <Heading
        title="Development accounts"
        description="Only available on the development server. These sample sessions are for testing the interface, not production authentication."
      />
      <div className="hub-stack">
        {state.profiles
          .filter((p) => p.id.startsWith("demo-"))
          .map((p) => (
            <Panel key={p.id}>
              <h2>{p.name}</h2>
              <p>{p.role}</p>
              <button
                className="hub-button secondary"
                onClick={() => {
                  update((s) => {
                    s.currentId = p.id;
                  });
                  if (openSession(p.id, "member")) navigate("/hub");
                }}
              >
                Continue as {p.role}
              </button>
            </Panel>
          ))}
      </div>
    </div>
  );
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
                to={`/sign-in?returnTo=${encodeURIComponent("/academy/" + c.id)}`}
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
        <TextLink to="/join">Join PLP</TextLink>
      </Panel>
    </div>
  );
}
