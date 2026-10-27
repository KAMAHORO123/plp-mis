import { translateUi, useSiteLanguage } from '../../i18n/language';
import { platformApi } from "./platform-api";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ArrowUpRight, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';
import { useHub, today } from './store';
import { Panel, Field } from './ui';
import { defaultAnnouncement, safeAnnouncementLink, type Announcement } from './site-content';
import './community-sections.css';
export function AnnouncementBanner({ preview }: {
    preview?: Announcement;
}) {
    useSiteLanguage();
    const [published, setPublished] = useState<Announcement | null>(null);
    useEffect(() => {
        let active = true;
        const load = () => platformApi<Announcement>('/public/announcement').then(value => { if (active)
            setPublished(value); }).catch(() => { if (active)
            setPublished(null); });
        void load();
        window.addEventListener('plp:announcement-updated', load);
        const timer = window.setInterval(load, 60000);
        return () => { active = false; clearInterval(timer); window.removeEventListener('plp:announcement-updated', load); };
    }, []);
    const [paused, setPaused] = useState(false);
    const item = preview ?? published;
    if (!item)
        return null;
    if ((!import.meta.env.DEV && item.sample && !preview) || !item.enabled || !item.date || (item.endsAt ? new Date(item.endsAt).getTime() <= Date.now() : item.date < today()))
        return null;
    return <aside className={`plp-announcement plp-imigongo-banner${paused ? ' is-paused' : ''}`} aria-label={translateUi("Upcoming event")}>
  
  <div className="plp-announcement-window"><div className="plp-announcement-track">{translateUi([0, 1].map(copy => <div className="plp-announcement-message" key={copy} aria-hidden={copy === 1 ? true : undefined}><span className="plp-announcement-diamond" aria-hidden="true">{translateUi("\u25C7")}</span><strong>{translateUi(item.title)}</strong><span className="plp-announcement-diamond" aria-hidden="true">{translateUi("\u25C7")}</span><span>{translateUi("PEACE \u00B7 LOVE \u00B7 COMMUNITY")}</span></div>))}</div></div>
  <span className="plp-announcement-date"><CalendarDays size={16}/><time dateTime={item.date}>{translateUi(new Date(`${item.date}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }))}</time>{translateUi(item.location && <span className="plp-announcement-location">{translateUi(" \u00B7 ")}{translateUi(item.location)}</span>)}</span>
  {translateUi(safeAnnouncementLink(item.href) && (item.href.startsWith('/') ? <Link className="plp-announcement-cta" to={item.href}>{translateUi(item.linkLabel || 'Explore event')} <ArrowUpRight size={15}/></Link> : <a className="plp-announcement-cta" href={item.href} target="_blank" rel="noopener noreferrer">{translateUi(item.linkLabel || 'Explore event')} <ArrowUpRight size={15}/></a>))}
  <button type="button" className="plp-announcement-pause" aria-label={translateUi(paused ? 'Play announcement' : 'Pause announcement')} aria-pressed={paused} onClick={() => setPaused(!paused)}>{translateUi(paused ? <Play size={15}/> : <Pause size={15}/>)}</button>
 </aside>;
}
export function AnnouncementEditor() {
    useSiteLanguage();
    const { state, profile, update } = useHub();
    // A saved banner is live for everyone; the "test event" option must be chosen deliberately, never by default.
    const [draft, setDraft] = useState<Announcement>(() => ({ ...defaultAnnouncement, ...state.announcement, sample: false }));
    useEffect(() => { let active = true; platformApi<Announcement>('/public/announcement').then(value => { if (active && value.enabled)
        setDraft({ ...defaultAnnouncement, ...value, sample: false }); }).catch(() => { }); return () => { active = false; }; }, []);
    if (profile.role !== 'Administrator')
        return null;
    const change = (key: keyof Announcement, value: string | boolean) => setDraft(d => ({ ...d, [key]: value }));
    return <Panel><h2>{translateUi("Website announcement")}</h2><Link className="hub-text-link" to="/meetings/manage">{translateUi("Manage meetings & attendance \u2192")}</Link><p>{translateUi("Choose the event shown above the public navigation. Past events are hidden automatically.")}</p><form className="hub-form" onSubmit={async (e) => {
            e.preventDefault();
            if (!draft.title.trim() || !draft.linkLabel.trim() || !safeAnnouncementLink(draft.href))
                return toast.error(translateUi('Enter a title, link label, and a local path or HTTPS link.'));
            if (draft.enabled && draft.date < today())
                return toast.error(translateUi('Choose today or a future date for an active banner.'));
            try {
                const { sample, endsAt, ...input } = draft;
                await platformApi('/announcement', 'PUT', { ...input, enabled: input.enabled && !sample, title: input.title.trim(), location: input.location.trim(), linkLabel: input.linkLabel.trim() });
                update(s => { s.announcement = draft; });
                window.dispatchEvent(new Event('plp:announcement-updated'));
                toast.success(translateUi('Website announcement saved'));
            }
            catch (e) {
                toast.error(translateUi((e as Error).message));
            }
        }}>
 <label className="hub-check"><input type="checkbox" checked={draft.enabled} onChange={e => change('enabled', e.target.checked)}/>{translateUi("Show announcement")}</label>
 <Field label={translateUi("Event title")}><input required maxLength={100} value={draft.title} onChange={e => change('title', e.target.value)}/></Field>
 <div className="ws-form-grid"><Field label={translateUi("Event date")}><input required type="date" value={draft.date} onChange={e => change('date', e.target.value)}/></Field><Field label={translateUi("Event location")}><input maxLength={60} value={draft.location} onChange={e => change('location', e.target.value)}/></Field></div>
 <Field label={translateUi("Event link")}><input required maxLength={500} value={draft.href} onChange={e => change('href', e.target.value)}/></Field><Field label={translateUi("Link label")}><input required maxLength={40} value={draft.linkLabel} onChange={e => change('linkLabel', e.target.value)}/></Field>
 <label className="hub-check"><input type="checkbox" checked={draft.sample} onChange={e => change('sample', e.target.checked)}/>{translateUi("Test only \u2014 keep this hidden from members and visitors")}</label>
 <p className={`hub-feedback ${draft.enabled && !draft.sample && draft.date >= today() ? '' : 'hub-access-error'}`}>{translateUi(draft.enabled && !draft.sample && draft.date >= today() ? 'When saved, this banner is shown to everyone: on the public website and at the top of every member dashboard.' : 'When saved, this banner is hidden from everyone.')}</p>
 <button className="hub-button">{translateUi("Save announcement")}</button></form><h3 className="hub-space">{translateUi("Banner preview")}</h3><AnnouncementBanner preview={draft}/>{translateUi((!draft.enabled || draft.date < today()) && <p>{translateUi("The banner is hidden.")}</p>)}</Panel>;
}
