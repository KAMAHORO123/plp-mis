import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "./api";
import {
  AuthShell,
  CodeInput,
  PasswordField,
  useCountdown,
} from "./auth-shell";
// Recovery: email -> 6-digit code from the inbox -> one-time token -> new password.
export function ForgotPassword() {
  const [step, setStep] = useState<"email" | "code" | "password">("email"),
    [email, setEmail] = useState(""),
    [code, setCode] = useState(""),
    [token, setToken] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const countdown = useCountdown();
  async function send(address: string) {
    setBusy(true);
    setError("");
    try {
      await api("/auth/forgot", "POST", { email: address });
      setEmail(address);
      setCode("");
      setStep("code");
      countdown.start();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const footnote = (
    <p className="auth-footnote">
      Remembered it? <Link to="/sign-in">Back to log in</Link>
    </p>
  );
  if (step === "email")
    return (
      <AuthShell
        title="Forgot your password?"
        intro="Enter your email and we’ll send you a code to reset it."
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
            {busy ? "Sending…" : "Continue"}
          </button>
        </form>
        {footnote}
      </AuthShell>
    );
  if (step === "code")
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
              const result = await api<{ token: string }>(
                "/auth/forgot/verify",
                "POST",
                { email, code },
              );
              setToken(result.token);
              setStep("password");
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
            href="/forgot-password"
            onClick={(e) => {
              e.preventDefault();
              setError("");
              setStep("email");
            }}
          >
            Use a different email
          </a>
        </p>
      </AuthShell>
    );
  return (
    <AuthShell
      title="Choose a new password"
      intro="Your new password signs you out of every other device."
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          setError("");
          if (form.get("password") !== form.get("confirm"))
            return setError("The two passwords do not match.");
          setBusy(true);
          try {
            await api("/auth/reset", "POST", {
              token,
              password: form.get("password"),
            });
            window.location.assign("/sign-in?reset=1");
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
          }
        }}
      >
        <PasswordField
          label="New password"
          name="password"
          autoComplete="new-password"
        />
        <PasswordField
          label="Confirm new password"
          name="confirm"
          autoComplete="new-password"
        />
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Update password"}
        </button>
      </form>
      <p className="auth-footnote">
        <Link to="/sign-in">Cancel</Link>
      </p>
    </AuthShell>
  );
}
