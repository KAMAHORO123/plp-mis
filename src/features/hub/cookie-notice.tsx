import { translateUi, useSiteLanguage } from '../../i18n/language';
import { useState } from "react";
import { Cookie } from "lucide-react";
const KEY = "plp-cookie-notice";
const seen = () => { try {
    return localStorage.getItem(KEY) === "1";
}
catch {
    return false;
} };
/** The Hub only sets essential cookies (the sign-in session), so this is a notice rather than a consent form. */
export function CookieNotice() {
    useSiteLanguage();
    const [hidden, setHidden] = useState(seen);
    if (hidden)
        return null;
    const dismiss = () => { try {
        localStorage.setItem(KEY, "1");
    }
    catch { /* private mode: show again next visit */ } setHidden(true); };
    return (<div className="ck-notice" role="region" aria-label={translateUi("Cookie notice")}>
      <Cookie size={20} aria-hidden="true"/>
      <p><strong>{translateUi("We use essential cookies.")}</strong>{translateUi(" One secure cookie keeps you signed in. We don't use advertising or tracking cookies. If your browser blocks cookies, sign-in won't work.")}</p>
      <button className="hub-button" onClick={dismiss}>{translateUi("Got it")}</button>
    </div>);
}
