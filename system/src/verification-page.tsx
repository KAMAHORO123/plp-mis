import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AuthShell, CodeInput, useCountdown } from "./auth-shell";
async function request(path: string, body: object) {
  const response = await fetch("/api/auth/verification/" + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw Error(
      "Email verification is currently unavailable. Please try again later.",
    );
  }
  if (!response.ok) throw Error(data.error || "Please try again.");
  return data;
}
export function EmailVerificationPage() {
  const [email, setEmail] = useState(
      () => sessionStorage.getItem("plp-verification-email") || "",
    ),
    [sent, setSent] = useState(false),
    [code, setCode] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(false),
    [awaitingApproval, setAwaitingApproval] = useState(false);
  const countdown = useCountdown();
  const requested = useRef(false);
  async function send(address: string) {
    setBusy(true);
    setError("");
    try {
      await request("request", { email: address });
      sessionStorage.setItem("plp-verification-email", address);
      setEmail(address);
      setSent(true);
      setCode("");
      countdown.start();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  // Arriving from signup: send the first code automatically.
  useEffect(() => {
    if (email && !requested.current) {
      requested.current = true;
      void send(email);
    }
  }, []);
  if (done)
    return (
      <AuthShell
        title="Email confirmed"
        intro={awaitingApproval ? "Your email is verified. Your staff application is awaiting administrator approval." : "Your email is verified. You can now log in and get started."}
      >
        <Link className="auth-primary" to="/sign-in">
          Continue to log in
        </Link>
      </AuthShell>
    );
  if (!sent)
    return (
      <AuthShell
        title="Verify your email"
        intro="Enter your signup email and we’ll send you a 6-digit code."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(
              String(new FormData(e.currentTarget).get("email")).trim(),
            );
          }}
        >
          <label>
            Email address
            <input
              type="email"
              name="email"
              autoComplete="email"
              maxLength={254}
              required
              defaultValue={email}
              placeholder="Enter your email"
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <button type="submit" disabled={busy}>
            {busy ? "Sending…" : "Send code"}
          </button>
        </form>
        <p className="auth-footnote">
          Already verified? <Link to="/sign-in">Log in here</Link>
        </p>
      </AuthShell>
    );
  return (
    <AuthShell
      title="Verify your email"
      intro={
        <>
          Enter the 6-digit code we sent to your email.
          <strong>{email}</strong>
        </>
      }
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const result = await request("confirm", { email, code });
                  setAwaitingApproval(Boolean(result.awaitingApproval));
            sessionStorage.removeItem("plp-verification-email");
            setDone(true);
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <CodeInput value={code} onChange={setCode} disabled={busy} />
        <p className="auth-resend">
          Didn’t receive a code?
          <button
            type="button"
            disabled={busy || countdown.seconds > 0}
            onClick={() => void send(email)}
          >
            {countdown.seconds > 0
              ? `Resend in ${countdown.label}`
              : "Resend code"}
          </button>
        </p>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={busy || code.length !== 6}>
          {busy ? "Checking…" : "Continue"}
        </button>
      </form>
      <p className="auth-footnote">
        Wrong email?{" "}
        <a
          href="/verify-email"
          onClick={(e) => {
            e.preventDefault();
            setError("");
            setSent(false);
          }}
        >
          Use a different email
        </a>
      </p>
    </AuthShell>
  );
}
