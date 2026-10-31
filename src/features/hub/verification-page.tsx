import { translateUi, useSiteLanguage } from '../../i18n/language';
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { CodeInput, useCountdown } from "./code-input";
import { Field, Heading, Panel } from "./ui";
async function request(path: string, body: object) {
    const response = await fetch("/api/auth/verification/" + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    let data;
    try {
        data = await response.json();
    }
    catch {
        throw Error("Email verification is currently unavailable. Please try again later.");
    }
    if (!response.ok)
        throw Error(data.error || "Please try again.");
    return data;
}
export function EmailVerificationPage() {
    useSiteLanguage();
    const [email, setEmail] = useState(() => sessionStorage.getItem("plp-verification-email") || ""), [sent, setSent] = useState(false), [code, setCode] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState(""), [done, setDone] = useState(false), [awaitingApproval, setAwaitingApproval] = useState(false);
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
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
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
    return (<div className="hub-access-shell">
      <Panel>
        {translateUi(done ? (<>
            <Heading title={translateUi("Email confirmed")} description={translateUi(awaitingApproval ? "Your email is verified. An administrator will review your staff application before dashboard access is enabled." : "Your email is verified. You can now sign in and get started.")}/>
            <div className="flex justify-center">
              <Link to="/auth/login" className="hub-button hub-access-submit">{translateUi(" Continue to sign in ")}<ArrowRight size={16}/>
              </Link>
            </div>
          </>) : !sent ? (<>
            <Heading title={translateUi("Verify your email")} description={translateUi("Enter your signup email and we\u2019ll send you a 6-digit code.")}/>
            <form className="hub-form" onSubmit={(e) => {
                e.preventDefault();
                void send(String(new FormData(e.currentTarget).get("email")).trim());
            }}>
              <Field label={translateUi("Email address")}>
                <input type="email" name="email" autoComplete="email" maxLength={254} required defaultValue={email}/>
              </Field>
              {translateUi(error && <p role="alert" className="hub-access-error">{translateUi(error)}</p>)}
              <button className="hub-button hub-access-submit" disabled={busy}>
                {translateUi(busy ? "Sending…" : "Send code")} <ArrowRight size={16}/>
              </button>
            </form>
          </>) : (<>
            <Heading title={translateUi("Verify your email")} description={translateUi("Enter the 6-digit code we sent to your email.")}/>
            <p className="hub-code-email">{translateUi(email)}</p>
            <form className="hub-form" onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError("");
                try {
                    const result = await request("confirm", { email, code });
                    setAwaitingApproval(Boolean(result.awaitingApproval));
                    sessionStorage.removeItem("plp-verification-email");
                    setDone(true);
                }
                catch (e) {
                    setError((e as Error).message);
                }
                finally {
                    setBusy(false);
                }
            }}>
              <CodeInput value={code} onChange={setCode} disabled={busy}/>
              <p className="hub-code-resend">{translateUi(" Didn\u2019t receive a code? ")}<button type="button" disabled={busy || countdown.seconds > 0} onClick={() => void send(email)}>
                  {translateUi(countdown.seconds > 0 ? `Resend in ${countdown.label}` : "Resend code")}
                </button>
              </p>
              {translateUi(error && <p role="alert" className="hub-access-error">{translateUi(error)}</p>)}
              <button className="hub-button hub-access-submit" disabled={busy || code.length !== 6}>
                {translateUi(busy ? "Checking…" : "Continue")} <ArrowRight size={16}/>
              </button>
            </form>
          </>))}
        <p className="hub-access-footnote">{translateUi(" Don\u2019t have an account yet?")}{translateUi(" ")}
          <Link to="/auth/signup" className="hub-text-link">{translateUi(" Sign up here ")}</Link>
        </p>
      </Panel>
    </div>);
}
