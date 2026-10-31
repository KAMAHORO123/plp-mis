import { translateUi, useSiteLanguage, formatDate } from './i18n/language';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CalendarDays, MapPin, X, ArrowRight } from 'lucide-react';
import { daysUntil, defaultWelcomePopup, flyerUrl, type Announcement, type WelcomePopup } from './site-content';
import './event-flyer.css';
/** "Today", "Tomorrow" or "In 5 days", translated. */
export function countdown(date: string) {
    const days = daysUntil(date);
    return days <= 0 ? translateUi('Today') : days === 1 ? translateUi('Tomorrow') : translateUi('In {p0} days', { p0: days });
}
/** Live days/hours/minutes/seconds until an event day starts in Kigali (UTC+2). */
function useTicker(date: string | undefined) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => { if (!date) return; const t = window.setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [date]);
    if (!date) return null;
    const left = Math.max(0, Date.parse(`${date}T00:00:00+02:00`) - now);
    const s = Math.floor(left / 1000);
    return { started: left === 0, parts: [[Math.floor(s / 86400), 'Days'], [Math.floor(s / 3600) % 24, 'Hours'], [Math.floor(s / 60) % 60, 'Min'], [s % 60, 'Sec']] as [number, string][] };
}
/**
 * The welcome popup opens shortly after each page load: an upcoming event when one is live, otherwise an
 * invitation to join PLP. Once closed it stays closed while the visitor moves around the site.
 * Esc, the backdrop, the close button and "Maybe later" all close it.
 */
let closedThisVisit = false;
type LinkRender = (className: string, children: ReactNode, onClick: () => void, href: string) => ReactNode;
export function EventFlyer({ item, link }: {
    /** The live event, or null for the welcome popup. */
    item: Announcement | null;
    link: LinkRender;
}) {
    useSiteLanguage();
    const [open, setOpen] = useState(false);
    const [welcome, setWelcome] = useState<WelcomePopup | null>(null);
    const close = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        if (item) return;
        let active = true;
        fetch('/api/public/welcome-popup', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then((v: WelcomePopup | null) => { if (active) setWelcome(v ?? defaultWelcomePopup); }).catch(() => { if (active) setWelcome(defaultWelcomePopup); });
        return () => { active = false; };
    }, [item]);
    useEffect(() => {
        if (closedThisVisit) return;
        let timer: number | undefined;
        const show = () => { timer = window.setTimeout(() => setOpen(true), 600); };
        try { if(localStorage.getItem('plp-essential-cookies-v2')==='accepted') show(); } catch { /* Wait for acknowledgement. */ }
        window.addEventListener('plp:cookies-accepted', show);
        return () => { clearTimeout(timer); window.removeEventListener('plp:cookies-accepted', show); };
    }, []);
    useEffect(() => {
        if (!open) return;
        close.current?.focus();
        const previous = document.activeElement as HTMLElement | null;
        const onKey = (e: KeyboardEvent) => {
          if (e.key === 'Escape') dismiss();
          if (e.key === 'Tab') {
            const nodes = Array.from(document.querySelectorAll<HTMLElement>('.plp-promo-layer button, .plp-promo-layer a[href]'));
            const first=nodes[0],last=nodes[nodes.length-1];
            if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
            else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
          }
        };
        window.addEventListener('keydown', onKey);
        return () => { window.removeEventListener('keydown', onKey); previous?.focus(); };
    }, [open]);
    function dismiss() {
        setOpen(false);
        closedThisVisit = true;
    }
    // Without an event, wait for the administrator's popup and respect its on/off switch.
    if (!open || (!item && (!welcome || !welcome.enabled))) return null;
    return <div className="plp-promo-layer" role="presentation" onClick={e => { if (e.target === e.currentTarget) dismiss(); }}>
    <PromoCard item={item} welcome={welcome ?? defaultWelcomePopup} link={link} onClose={dismiss} closeRef={close}/>
  </div>;
}
/** The popup card itself; the Website banner editor shows it inline as a preview. */
export function PromoCard({ item, welcome, link, onClose, closeRef, imageUrl, inline }: {
    item: Announcement | null;
    welcome: WelcomePopup;
    link: LinkRender;
    onClose: () => void;
    closeRef?: React.Ref<HTMLButtonElement>;
    /** Overrides the image, e.g. an upload the editor has not saved yet. */
    imageUrl?: string;
    /** Shown inside a page (the editor preview) rather than as a dialog. */
    inline?: boolean;
}) {
    useSiteLanguage();
    const ticker = useTicker(item?.date);
    // Uploaded flyers keep their whole design (text included); built-in photos are cropped to fill.
    const uploaded = !!(imageUrl || (item ? flyerUrl(item) : welcome.image));
    const image = imageUrl || (item ? flyerUrl(item) || '/images/plp/plp-dialogue.webp' : welcome.image ? `/api/public/welcome-popup/image?v=${encodeURIComponent(welcome.image)}` : '/images/plp/albums/camp-8.jpg');
    if (!item && welcome.imageOnly) return <div className="plp-promo is-flyer-only" {...(inline ? {} : {role:'dialog', 'aria-modal':true, 'aria-label':translateUi('PLP flyer')})}>
      <button ref={closeRef} type="button" className="plp-promo-close" aria-label={translateUi('Close')} onClick={onClose}><X size={18}/></button>
      <img className="plp-only-flyer" src={image} alt={welcome.title || translateUi('PLP flyer')}/>
    </div>;
    return <div className={`plp-promo${item ? ' is-event' : ' is-join'}`} {...(inline ? {} : { role: "dialog", "aria-modal": true, "aria-labelledby": "plp-promo-title" })}>
      <button ref={closeRef} type="button" className="plp-promo-close" aria-label={translateUi("Close")} onClick={onClose}><X size={18}/></button>
      <div className={`plp-promo-media${uploaded ? ' is-flyer' : ''}`}>{uploaded && <img className="plp-promo-backdrop" src={image} alt="" aria-hidden="true"/>}<img src={image} alt={item ? translateUi("Flyer: {p0}", { p0: translateUi(item.title) }) : ""}/></div>
      <div className="plp-promo-body">
        {item ? <>
          <p className="plp-promo-when"><CalendarDays size={15}/>{formatDate(item.date, { weekday: 'long', day: 'numeric', month: 'long' })}{translateUi(item.location && <><MapPin size={15}/>{translateUi(item.location)}</>)}</p>
          <h2 id="plp-promo-title">{translateUi(item.title)}</h2>
          {translateUi(item.description && <p className="plp-promo-text">{translateUi(item.description)}</p>)}
          {ticker && (ticker.started ? <p className="plp-promo-live"><i/>{translateUi("Happening today")}</p> : <div className="plp-promo-clock" role="timer" aria-label={countdown(item.date)}>{ticker.parts.map(([n, label]) => <div key={label}><strong>{String(n).padStart(2, '0')}</strong><span>{translateUi(label)}</span></div>)}</div>)}
          <div className="plp-promo-actions">{link('plp-promo-cta', <>{translateUi(item.linkLabel || 'Explore event')}<ArrowRight size={18}/></>, onClose, item.href)}<button type="button" className="plp-promo-later" onClick={onClose}>{translateUi("Maybe later")}</button></div>
        </> : <>
          <h2 id="plp-promo-title">{translateUi(welcome.title)}</h2>
          {translateUi(welcome.text && <p className="plp-promo-text">{translateUi(welcome.text)}</p>)}
          <dl className="plp-promo-stats">{[["40,000+", "young people"], ["141", "schools"], ["2007", "since"]].map(([n, label]) => <div key={label}><dt>{translateUi(label)}</dt><dd>{n}</dd></div>)}</dl>
          <div className="plp-promo-actions">{link('plp-promo-cta', <>{translateUi(welcome.cta)}<ArrowRight size={18}/></>, onClose, welcome.href)}<button type="button" className="plp-promo-later" onClick={onClose}>{translateUi("Maybe later")}</button></div>
        </>}
      </div>
    </div>;
}
