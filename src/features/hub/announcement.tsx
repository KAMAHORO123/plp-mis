import { translateUi, useSiteLanguage, formatDate } from '../../i18n/language';
import { platformApi, uploadFile } from "./platform-api";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ArrowUpRight, Pause, Play, PencilLine } from 'lucide-react';
import { FormModal } from './modal';
import { toast } from 'sonner';
import { useHub, today } from './store';
import { Panel, Field } from './ui';
import { defaultAnnouncement, defaultWelcomePopup, isUpcoming, type WelcomePopup, safeAnnouncementLink, standingAnnouncement, type Announcement } from './site-content';
import { EventFlyer, PromoCard, countdown } from './event-flyer';
import './community-sections.css';
export function AnnouncementBanner({ preview }: {
    preview?: Announcement;
}) {
    useSiteLanguage();
    const [published, setPublished] = useState<Announcement | null>(null);
    const [paused, setPaused] = useState(false);
    const { session } = useHub();
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
    const candidate = preview ?? published;
    const live = !!candidate && !(!import.meta.env.DEV && candidate.sample && !preview) && isUpcoming(candidate, today());
    // The admin preview shows only the event being edited; visitors see the standing banner when no event is on.
    if (!live && preview)
        return null;
    const item = live ? candidate : standingAnnouncement;
    return <><aside className={`plp-announcement plp-imigongo-banner plp-banner-bold${paused ? ' is-paused' : ''}`} aria-label={translateUi(live ? "Upcoming event" : "Peace and Love Proclaimers")}>
  {translateUi(live && <span className="plp-announcement-countdown">{countdown(item.date)}</span>)}
  <div className="plp-announcement-window"><div className="plp-announcement-track">{translateUi([0, 1].map(copy => <div className="plp-announcement-message" key={copy} aria-hidden={copy === 1 ? true : undefined}><span className="plp-announcement-diamond" aria-hidden="true">{translateUi("\u25C7")}</span><strong>{translateUi(item.title)}</strong><span className="plp-announcement-diamond" aria-hidden="true">{translateUi("\u25C7")}</span><span>{translateUi("PEACE \u00B7 LOVE \u00B7 COMMUNITY")}</span></div>))}</div></div>
  {live && <span className="plp-announcement-date"><CalendarDays size={16}/><time dateTime={item.date}>{formatDate(item.date)}</time>{translateUi(item.location && <span className="plp-announcement-location">{translateUi(" \u00B7 ")}{translateUi(item.location)}</span>)}</span>}
  {translateUi(safeAnnouncementLink(item.href) && (item.href.startsWith('/') ? <Link className="plp-announcement-cta" to={item.href}>{translateUi(item.linkLabel || 'Explore event')} <ArrowUpRight size={15}/></Link> : <a className="plp-announcement-cta" href={item.href} target="_blank" rel="noopener noreferrer">{translateUi(item.linkLabel || 'Explore event')} <ArrowUpRight size={15}/></a>))}
  <button type="button" className="plp-announcement-pause" aria-label={translateUi(paused ? 'Play announcement' : 'Pause announcement')} aria-pressed={paused} onClick={() => setPaused(!paused)}>{translateUi(paused ? <Play size={15}/> : <Pause size={15}/>)}</button>
 </aside>
 {translateUi(!preview && (live || !session) && <EventFlyer item={live && safeAnnouncementLink(item.href) ? item : null} link={(className, children, onClick, to) => to.startsWith('/') ? <Link className={className} to={to} onClick={onClick}>{children}</Link> : <a className={className} href={to} target="_blank" rel="noopener noreferrer" onClick={onClick}>{children}</a>}/>)}
 </>;
}
export function AnnouncementEditor() {
    useSiteLanguage();
    const { state, profile, update } = useHub();
    // A saved banner is live for everyone; the "test event" option must be chosen deliberately, never by default.
    const [saved, setSaved] = useState<Announcement>(() => ({ ...defaultAnnouncement, ...state.announcement, sample: false }));
    const [draft, setDraft] = useState<Announcement | null>(null), [busy, setBusy] = useState(false);
    useEffect(() => { let active = true; platformApi<Announcement>('/public/announcement').then(value => { if (active && value.enabled)
        setSaved({ ...defaultAnnouncement, ...value, sample: false }); }).catch(() => { }); return () => { active = false; }; }, []);
    if (profile.role !== 'Administrator')
        return null;
    const change = (key: keyof Announcement, value: string | boolean) => setDraft(d => d && ({ ...d, [key]: value }));
    const live = saved.enabled && !saved.sample && saved.date >= today();
    return <Panel>
 <div className="ws-panel-title"><div><h2>{translateUi("Website announcement")} <span className={`ws-status ${live ? 'ws-status-issued' : 'ws-status-returned'}`}>{translateUi(live ? 'Live' : 'Not shown')}</span></h2><p className="hub-caption">{translateUi("The event shown above the public navigation. When no event is coming up, the website shows a standing “Join PLP” banner instead.")}</p></div>
 <div className="hub-actions"><Link className="hub-button secondary" to="/meetings/manage">{translateUi("Meetings")}</Link><button type="button" className="hub-button" onClick={() => setDraft(saved)}><PencilLine size={16}/>{translateUi("Edit announcement")}</button></div></div>
 <dl className="an-facts"><div><dt>{translateUi("Event")}</dt><dd>{saved.title || '—'}</dd></div><div><dt>{translateUi("Date")}</dt><dd>{saved.date ? formatDate(saved.date) : '—'}</dd></div><div><dt>{translateUi("Location")}</dt><dd>{saved.location || '—'}</dd></div><div><dt>{translateUi("Link")}</dt><dd>{saved.linkLabel || '—'}</dd></div></dl>
 <h3 className="hub-space">{translateUi("Banner preview")}</h3><AnnouncementBanner preview={saved}/>{translateUi(!live && <p className="hub-caption">{translateUi("This event is not shown; visitors see the standing “Join PLP” banner.")}</p>)}
 {draft && <FormModal wide title={translateUi("Edit website announcement")} description={translateUi("Saving publishes the banner and event popup on the public website.")} onClose={() => { if (!busy) setDraft(null); }}><form className="hub-form" onSubmit={async (e) => {
            e.preventDefault();
            if (!draft.title.trim() || !draft.linkLabel.trim() || !safeAnnouncementLink(draft.href))
                return toast.error(translateUi('Enter a title, link label, and a local path or HTTPS link.'));
            if (draft.enabled && draft.date < today())
                return toast.error(translateUi('Choose today or a future date for an active banner.'));
            setBusy(true);
            try {
                const { sample, endsAt, ...input } = draft;
                await platformApi('/announcement', 'PUT', { ...input, enabled: input.enabled && !sample, title: input.title.trim(), location: input.location.trim(), linkLabel: input.linkLabel.trim(), description: (input.description ?? '').trim(), flyer: input.flyer ?? '' });
                update(s => { s.announcement = draft; });
                setSaved(draft);
                setDraft(null);
                window.dispatchEvent(new Event('plp:announcement-updated'));
                toast.success(translateUi('Website announcement saved'));
            }
            catch (e) {
                toast.error(translateUi((e as Error).message));
            }
            finally {
                setBusy(false);
            }
        }}>
 <label className="hub-check"><input type="checkbox" checked={draft.enabled} onChange={e => change('enabled', e.target.checked)}/>{translateUi("Show announcement")}</label>
 <Field label={translateUi("Event title")}><input required maxLength={100} value={draft.title} onChange={e => change('title', e.target.value)}/></Field>
 <div className="ws-form-grid"><Field label={translateUi("Event date")}><input required type="date" value={draft.date} onChange={e => change('date', e.target.value)}/></Field><Field label={translateUi("Event location")}><input maxLength={60} value={draft.location} onChange={e => change('location', e.target.value)}/></Field></div>
 <div className="ws-form-grid"><Field label={translateUi("Event link")}><input required maxLength={500} value={draft.href} onChange={e => change('href', e.target.value)}/></Field><Field label={translateUi("Link label")}><input required maxLength={40} value={draft.linkLabel} onChange={e => change('linkLabel', e.target.value)}/></Field></div>
 <Field label={translateUi("Short description (shown in the popup flyer)")}><textarea maxLength={240} rows={2} value={draft.description ?? ''} onChange={e => change('description', e.target.value)}/></Field>
 <Field label={translateUi("Flyer image (PNG or JPEG, portrait works best)")}><input type="file" accept="image/png,image/jpeg" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; try { setBusy(true); change('flyer', await uploadFile(file)); toast.success(translateUi('Flyer uploaded. Save the announcement to publish it.')); } catch (err) { toast.error(translateUi((err as Error).message)); } finally { setBusy(false); } }}/></Field>
 {translateUi(draft.flyer && <button type="button" className="hub-text-button" onClick={() => change('flyer', '')}>{translateUi("Remove flyer")}</button>)}
 <label className="hub-check"><input type="checkbox" checked={draft.sample} onChange={e => change('sample', e.target.checked)}/>{translateUi("Test only — keep this hidden from members and visitors")}</label>
 <p className={`hub-feedback ${draft.enabled && !draft.sample && draft.date >= today() ? '' : 'hub-access-error'}`}>{translateUi(draft.enabled && !draft.sample && draft.date >= today() ? 'When saved, this banner is shown to everyone on the public website.' : 'When saved, visitors see the standing “Join PLP” banner instead of this event.')}</p>
 <h3>{translateUi("Preview")}</h3><AnnouncementBanner preview={draft}/>
 <div className="hub-actions hub-dialog-actions"><button type="button" className="hub-button secondary" disabled={busy} onClick={() => setDraft(null)}>{translateUi("Cancel")}</button><button className="hub-button" disabled={busy}>{translateUi(busy ? 'Saving…' : 'Save announcement')}</button></div></form></FormModal>}
 </Panel>;
}
/** Lets administrators edit the popup visitors see when no event is live. */
export function WelcomePopupEditor() {
    useSiteLanguage();
    const { profile } = useHub();
    const [saved, setSaved] = useState<WelcomePopup>(defaultWelcomePopup);
    const [draft, setDraft] = useState<WelcomePopup | null>(null), [busy, setBusy] = useState(false);
    useEffect(() => { let active = true; platformApi<WelcomePopup | null>('/public/welcome-popup').then(value => { if (active && value) setSaved({ ...defaultWelcomePopup, ...value }); }).catch(() => { }); return () => { active = false; }; }, []);
    if (profile.role !== 'Administrator')
        return null;
    const change = (key: keyof WelcomePopup, value: string | boolean) => setDraft(d => d && ({ ...d, [key]: value }));
    const preview = (item: WelcomePopup) => <div className="plp-promo-preview"><PromoCard inline item={null} welcome={item} imageUrl={item.image ? `/api/files/${item.image}` : undefined} onClose={() => { }} link={(className, children, _onClick, to) => <a className={className} href={to} onClick={e => e.preventDefault()}>{children}</a>}/></div>;
    return <Panel>
 <div className="ws-panel-title"><div><h2>{translateUi("Welcome popup")} <span className={`ws-status ${saved.enabled ? 'ws-status-issued' : 'ws-status-returned'}`}>{translateUi(saved.enabled ? 'On' : 'Off')}</span></h2><p className="hub-caption">{translateUi("Visitors see this popup when they open the website and no event is live. During an event, the event popup is shown instead.")}</p></div>
 <button type="button" className="hub-button" onClick={() => setDraft(saved)}><PencilLine size={16}/>{translateUi("Edit popup")}</button></div>
 <dl className="an-facts"><div><dt>{translateUi("Style")}</dt><dd>{translateUi(saved.imageOnly ? 'Flyer only' : 'Headline and button')}</dd></div>{!saved.imageOnly && <><div><dt>{translateUi("Headline")}</dt><dd>{saved.title || '—'}</dd></div><div><dt>{translateUi("Button")}</dt><dd>{saved.cta || '—'}</dd></div></>}<div><dt>{translateUi("Image")}</dt><dd>{translateUi(saved.image ? 'Custom flyer' : 'Default photo')}</dd></div></dl>
 <h3 className="hub-space">{translateUi("Popup preview")}</h3>{preview(saved)}
 {draft && <FormModal wide title={translateUi("Edit welcome popup")} description={translateUi("Saving updates the popup on the public website straight away.")} onClose={() => { if (!busy) setDraft(null); }}><form className="hub-form" onSubmit={async (e) => {
            e.preventDefault();
            if (!draft.imageOnly && !safeAnnouncementLink(draft.href))
                return toast.error(translateUi('Enter a local path or HTTPS link.'));
            setBusy(true);
            try {
                await platformApi('/welcome-popup', 'PUT', { ...draft, title: draft.title.trim(), text: draft.text.trim(), cta: draft.cta.trim() });
                setSaved(draft);
                setDraft(null);
                toast.success(translateUi('Welcome popup saved'));
            }
            catch (err) {
                toast.error(translateUi((err as Error).message));
            }
            finally {
                setBusy(false);
            }
        }}>
 <label className="hub-check"><input type="checkbox" checked={draft.enabled} onChange={e => change('enabled', e.target.checked)}/>{translateUi("Show the welcome popup")}</label>
 <label className="hub-check"><input type="checkbox" checked={!!draft.imageOnly} onChange={e=>change('imageOnly',e.target.checked)}/>{translateUi('Flyer only — no headline or button')}</label>
 {!draft.imageOnly && <><Field label={translateUi("Headline")}><input required minLength={2} maxLength={80} value={draft.title} onChange={e => change('title', e.target.value)}/></Field>
 <Field label={translateUi("Message")}><textarea maxLength={240} rows={2} value={draft.text} onChange={e => change('text', e.target.value)}/></Field>
 <div className="ws-form-grid"><Field label={translateUi("Button label")}><input required minLength={2} maxLength={30} value={draft.cta} onChange={e => change('cta', e.target.value)}/></Field><Field label={translateUi("Button link")}><input required maxLength={500} value={draft.href} onChange={e => change('href', e.target.value)}/></Field></div>
 </>}
 <Field label={translateUi("Flyer image (PNG or JPEG)")}><input type="file" accept="image/png,image/jpeg" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; try { setBusy(true); change('image', await uploadFile(file)); toast.success(translateUi('Image uploaded. Save to publish it.')); } catch (err) { toast.error(translateUi((err as Error).message)); } finally { setBusy(false); } }}/></Field>
 {translateUi(draft.image && <button type="button" className="hub-text-button" onClick={() => change('image', '')}>{translateUi("Use the default photo")}</button>)}
 <h3>{translateUi("Preview")}</h3>{preview(draft)}
 <div className="hub-actions hub-dialog-actions"><button type="button" className="hub-button secondary" disabled={busy} onClick={() => setDraft(null)}>{translateUi("Cancel")}</button><button className="hub-button" disabled={busy}>{translateUi(busy ? 'Saving…' : 'Save welcome popup')}</button></div></form></FormModal>}
 </Panel>;
}
