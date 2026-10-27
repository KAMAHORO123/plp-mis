import { translateUi, useSiteLanguage, formatDate } from './i18n/language';
import { useEffect, useState } from 'react';
import { CalendarDays, ArrowUpRight, Pause, Play } from 'lucide-react';
import { defaultAnnouncement, isUpcoming, safeAnnouncementLink, standingAnnouncement, type Announcement } from './site-content';
import { SiteLink } from './site-link';
import './community-sections.css';
export function AnnouncementBanner() {
    useSiteLanguage();
    const [loaded, setItem] = useState<Announcement>({ ...defaultAnnouncement, enabled: false });
    useEffect(() => {
        const controller = new AbortController();
        const base = import.meta.env.VITE_CONTENT_API_URL?.replace(/\/$/, '');
        async function load() {
            for (const url of ['/api/public/announcement', base ? `${base}/v1/announcement` : '/announcement.json']) {
                try {
                    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
                    if (!response.ok)
                        continue;
                    const value = await response.json();
                    if (typeof value.title === 'string' && typeof value.date === 'string' && typeof value.href === 'string' && typeof value.location === 'string' && typeof value.linkLabel === 'string' && typeof value.enabled === 'boolean') {
                        setItem(value);
                        return;
                    }
                }
                catch {
                    if (controller.signal.aborted)
                        return;
                }
            }
            setItem({ ...defaultAnnouncement, enabled: false });
        }
        void load();
        const timer = setInterval(load, 60000);
        window.addEventListener('focus', load);
        return () => { controller.abort(); clearInterval(timer); window.removeEventListener('focus', load); };
    }, []);
    const [paused, setPaused] = useState(false);
    // Visitors see the standing banner whenever no event is scheduled.
    const live = !loaded.sample && isUpcoming(loaded, new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Kigali' }));
    const item = live ? loaded : standingAnnouncement;
    const hub = import.meta.env.VITE_HUB_URL?.replace(/\/$/, '') || '';
    const href = item.href.startsWith('/meetings') && hub ? hub + item.href : item.href;
    return <aside className={`plp-announcement plp-imigongo-banner${paused ? ' is-paused' : ''}`} aria-label={translateUi(live ? "Upcoming event" : "Peace and Love Proclaimers")}>
  
  <div className="plp-announcement-window"><div className="plp-announcement-track">{translateUi([0, 1].map(copy => <div className="plp-announcement-message" key={copy} aria-hidden={copy === 1 ? true : undefined}><span className="plp-announcement-diamond" aria-hidden="true">{translateUi("\u25C7")}</span><strong>{translateUi(item.title)}</strong><span className="plp-announcement-diamond" aria-hidden="true">{translateUi("\u25C7")}</span><span>{translateUi("PEACE \u00B7 LOVE \u00B7 COMMUNITY")}</span></div>))}</div></div>
  {live && <span className="plp-announcement-date"><CalendarDays size={16}/><time dateTime={item.date}>{formatDate(item.date)}</time>{translateUi(item.location && <span className="plp-announcement-location">{translateUi(" \u00B7 ")}{translateUi(item.location)}</span>)}</span>}
  {translateUi(safeAnnouncementLink(href) && (href.startsWith('/') ? <SiteLink className="plp-announcement-cta" to={href}>{translateUi(item.linkLabel || 'Explore event')} <ArrowUpRight size={15}/></SiteLink> : <a className="plp-announcement-cta" href={href} target="_blank" rel="noopener noreferrer">{translateUi(item.linkLabel || 'Explore event')} <ArrowUpRight size={15}/></a>))}
  <button type="button" className="plp-announcement-pause" aria-label={translateUi(paused ? 'Play announcement' : 'Pause announcement')} aria-pressed={paused} onClick={() => setPaused(!paused)}>{translateUi(paused ? <Play size={15}/> : <Pause size={15}/>)}</button>
 </aside>;
}
