import { translateUi, useSiteLanguage } from '../../i18n/language';
import { useState } from "react";
import "./cookie-notice.css";
import { Cookie } from "lucide-react";
const KEY = "plp-essential-cookies-v2";
const seen = () => { try {
    return localStorage.getItem(KEY) === "accepted";
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
        localStorage.setItem(KEY, "accepted");
    }
    catch { /* private mode: show again next visit */ } setHidden(true); window.dispatchEvent(new Event("plp:cookies-accepted")); };
    return (<div className="ck-notice" role="region" aria-label={translateUi("Cookie notice")}>
      <Cookie size={20} aria-hidden="true"/>
      <p><strong>{translateUi("Essential cookies only.")}</strong>{translateUi(" We use a cookie to keep you signed in. No ads or tracking.")}</p>
      <button className="hub-button" onClick={dismiss}>{translateUi("Accept essential cookies")}</button>
    </div>);
}
