import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import "./auth.css";
const siteUrl = import.meta.env.VITE_SITE_URL?.replace(/\/$/, "");
const collage = [
  ["march", "PLP community march"],
  ["speaker", "PLP youth speaker"],
  ["basketball", "PLP sports activity"],
  ["icyeza", "PLP Icyeza students"],
  ["selfie", "PLP celebration"],
];
export function AuthShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="auth-page">
      <div className="auth-panel">
        <header className="auth-panel-top">
          <img src="/logo.svg" alt="Peace and Love Proclaimers" />
          {siteUrl && (
            <a href={siteUrl} className="auth-back">
              <ArrowLeft size={15} /> Website
            </a>
          )}
        </header>
        <main className="auth-body">
          <img className="auth-mark" src="/favicon.svg" alt="" />
          <h1>{title}</h1>
          {intro && <p className="auth-intro">{intro}</p>}
          {children}
        </main>
        <p className="auth-legal">© PLP Rwanda {new Date().getFullYear()}</p>
      </div>
      <div className="auth-collage" aria-hidden="true">
        <div>
          {collage.slice(0, 2).map(([name]) => (
            <img key={name} src={`/auth/${name}.jpg`} alt="" />
          ))}
        </div>
        <div>
          {collage.slice(2).map(([name]) => (
            <img key={name} src={`/auth/${name}.jpg`} alt="" />
          ))}
        </div>
      </div>
    </div>
  );
}
export function PasswordField({
  label,
  name,
  autoComplete,
  hint,
}: {
  label: string;
  name: string;
  autoComplete: string;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label>
      {label}
      <span className="password-field">
        <input
          name={name}
          type={visible ? "text" : "password"}
          minLength={12}
          maxLength={128}
          required
          autoComplete={autoComplete}
          placeholder={
            autoComplete === "current-password"
              ? "Enter your password"
              : "At least 12 characters"
          }
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function CodeInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}) {
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const focus = (i: number) =>
    boxes.current[Math.max(0, Math.min(5, i))]?.focus();
  return (
    <div className="code-input" role="group" aria-label="6-digit code">
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            boxes.current[i] = el;
          }}
          aria-label={`Digit ${i + 1}`}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={6}
          disabled={disabled}
          value={value[i] || ""}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            if (!digits) return;
            const next = (
              value.slice(0, i) +
              digits +
              value.slice(i + digits.length)
            ).slice(0, 6);
            onChange(next);
            focus(i + digits.length);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace") {
              e.preventDefault();
              if (value[i]) onChange(value.slice(0, i) + value.slice(i + 1));
              else if (i > 0) {
                onChange(value.slice(0, i - 1) + value.slice(i));
                focus(i - 1);
              }
            } else if (e.key === "ArrowLeft") focus(i - 1);
            else if (e.key === "ArrowRight") focus(i + 1);
          }}
          onPaste={(e) => {
            e.preventDefault();
            const digits = e.clipboardData
              .getData("text")
              .replace(/\D/g, "")
              .slice(0, 6);
            if (digits) {
              onChange(digits);
              focus(digits.length);
            }
          }}
        />
      ))}
    </div>
  );
}
export function useCountdown() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!seconds) return;
    const timer = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);
  const label = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return { seconds, label, start: () => setSeconds(60) };
}
