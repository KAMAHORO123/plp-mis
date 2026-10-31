import { DueBadge } from "./session-calendar";
import { RecordTable } from "./management-ui";
import { translateUi, useSiteLanguage } from '../../i18n/language';
import { confirmAction } from '@/components/shared/confirm-dialog';
import { useLiveTick } from './live';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, MapPin, Coins, Plus, Users, DoorOpen, ClipboardList, ExternalLink, FilePenLine, Megaphone, KeyRound, Ban, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { StatCard } from '@/components/shared/stat-card';
import { platformApi, refreshVerifiedCredits } from './platform-api';
import { Heading, Panel, Field, Empty, downloadCSV } from './ui';
import './workspaces.css';
type Meeting = {
    id: string;
    title: string;
    location: string;
    join_url: string;
    opens_at: string;
    closes_at: string;
    credits: number;
    closed: boolean;
    latitude: number;
    longitude: number;
    radius_m: number;
    attendees?: number;
};
type Account = {
    id: string;
    role: string;
};
const formatDate = (value: string) => new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Kigali' });
const maps = (m: Meeting) => `https://www.google.com/maps/dir/?api=1&destination=${m.latitude},${m.longitude}`;
const getPosition = () => new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation)
        return reject(Error('Location is unavailable on this device. Please use a phone with location enabled.'));
    navigator.geolocation.getCurrentPosition(resolve, e => reject(Error(e.code === 1 ? 'Allow location access to confirm you are at the venue.' : 'Could not get an accurate location. Enable precise location and try again.')), { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
});
export function MeetingsPage() {
    useSiteLanguage();
    const { id } = useParams();
    const [meeting, setMeeting] = useState<Meeting | null>(null), [list, setList] = useState<Meeting[]>([]), [account, setAccount] = useState<Account | null>(null);
    const [loaded, setLoaded] = useState(false), [error, setError] = useState(''), [busy, setBusy] = useState(false), [checked, setChecked] = useState(false), [code, setCode] = useState('');
    const [now, setNow] = useState(Date.now());
    useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
    useEffect(() => {
        let active = true;
        setLoaded(false);
        setMeeting(null);
        setError('');
        setChecked(false);
        setCode('');
        Promise.all([platformApi<Meeting | Meeting[]>(id ? `/public/meetings/${id}` : '/public/meetings'), platformApi<Account>('/me').catch(() => null)])
            .then(async ([data, user]) => { if (!active)
            return; setAccount(user); if (id) {
            setMeeting(data as Meeting);
            if (user) {
                const result = await platformApi<{
                    checkedIn: boolean;
                }>(`/meetings/${id}/check-in`);
                if (active)
                    setChecked(result.checkedIn);
            }
        }
        else
            setList(data as Meeting[]); })
            .catch(e => { if (active)
            setError(e.message); }).finally(() => { if (active)
            setLoaded(true); });
        return () => { active = false; };
    }, [id]);
    if (!loaded)
        return <div className="hub-meeting-layout"><Panel><p role="status">{translateUi("Loading meeting\u2026")}</p></Panel></div>;
    if (error && !meeting && !list.length)
        return <div className="hub-meeting-layout"><Panel><p role="alert">{translateUi(error)}</p><Link to="/meetings">{translateUi("Back to meetings")}</Link></Panel></div>;
    if (!id)
        return <div className="hub-meeting-layout hub-editorial-page"><Heading title={translateUi("PLP meetings")} description={translateUi("Show up, connect, and earn verified credits.")}/>{translateUi(account?.role === 'admin' && <Link className="hub-button" to="/meetings/manage">{translateUi("Manage meetings")}</Link>)}<Panel><RecordTable title="meetings" rows={list} searchText={m=>`${m.title} ${m.location}`} filters={[{label:'Time',options:[{label:'This week',test:(m:Meeting)=>Date.parse(m.opens_at)>Date.now()&&Date.parse(m.opens_at)<Date.now()+7*86400000}]}]} columns={[{label:'Meeting',render:m=><strong>{m.title}</strong>},{label:'When',render:m=><>{formatDate(m.opens_at)}<DueBadge date={m.opens_at}/></>},{label:'Location',render:m=>m.location},{label:'Action',render:m=><Link className="hub-text-link" to={`/meetings/${m.id}`}>{translateUi('View meeting')}</Link>}]}/></Panel></div>;
    if (!meeting)
        return null;
    const open = !meeting.closed && now >= new Date(meeting.opens_at).getTime() && now <= new Date(meeting.closes_at).getTime();
    const ended = meeting.closed || now > new Date(meeting.closes_at).getTime();
    return <div className="hub-meeting-layout hub-editorial-page"><Link className="hub-text-link" to="/meetings">{translateUi("\u2190 All meetings")}</Link><Heading title={translateUi(meeting.title)}/><Panel>
  <dl className="hub-meeting-facts"><div><dt><CalendarDays size={18}/>{translateUi(" Attendance window \u00B7 Kigali time")}</dt><dd>{translateUi(formatDate(meeting.opens_at))}<br />{translateUi("to ")}{translateUi(formatDate(meeting.closes_at))}</dd></div><div><dt><MapPin size={18}/>{translateUi(" Venue")}</dt><dd>{translateUi(meeting.location)}<br /><a className="hub-text-link" href={maps(meeting)} target="_blank" rel="noreferrer">{translateUi("Directions in Google Maps \u2197")}</a></dd></div><div><dt><Coins size={18}/>{translateUi(" Attendance reward")}</dt><dd>{translateUi(meeting.credits)}{translateUi(" verified credits")}</dd></div></dl>
  {translateUi(meeting.join_url && <a className="hub-text-link" href={meeting.join_url} target="_blank" rel="noreferrer">{translateUi("Meeting information \u2197")}</a>)}
  {translateUi(checked ? <div role="status" className="hub-feedback"><CheckCircle2 /><h2>{translateUi("Attendance confirmed")}</h2><p>{translateUi(meeting.credits)}{translateUi(" credits have been added to your account.")}</p><Link className="hub-button" to="/credits">{translateUi("View my credits")}</Link></div> : ended ? <p role="status">{translateUi("Attendance is closed for this meeting.")}</p> : !account ? <><p>{translateUi("Sign in with your verified PLP account to mark attendance.")}</p><Link className="hub-button" to={`/auth/login?returnTo=${encodeURIComponent('/meetings/' + id)}`} onClick={() => sessionStorage.setItem('plp-meeting-return', '/meetings/' + id)}>{translateUi("Sign in to attend")}</Link></> : !open ? <p role="status">{translateUi("Attendance opens at ")}{translateUi(formatDate(meeting.opens_at))}{translateUi(".")}</p> : <form className="hub-form" onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError('');
                try {
                    const position = await getPosition();
                    await platformApi(`/meetings/${id}/check-in`, 'POST', { code: code.replace(/\s/g, ''), position: { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy, timestamp: position.timestamp } });
                    setChecked(true);
                    refreshVerifiedCredits();
                }
                catch (e) {
                    setError((e as Error).message);
                }
                finally {
                    setBusy(false);
                }
            }}><h2>{translateUi("Mark your attendance")}</h2><p>{translateUi("At the venue, enter the code shared by your host. We\u2019ll check your current location once; your exact coordinates are not saved.")}</p><Field label={translateUi("Attendance code")}><input required value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={16} autoComplete="off" placeholder={translateUi("Code from your host")}/></Field><button className="hub-button" disabled={busy || code.replace(/\s/g, '').length !== 12}>{translateUi(busy ? 'Checking your attendance…' : 'Verify location & mark attendance')}</button></form>)}
  {translateUi(error && <p role="alert" className="hub-access-error">{translateUi(error)}</p>)}
 </Panel></div>;
}
const localInput = (iso: string) => { const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
type Attendee = {
    name: string;
    email: string;
    role: string;
    checked_in_at: string;
    distance_m: number;
    accuracy_m: number;
};
const meetingStatus = (m: Meeting) => m.closed || Date.parse(m.closes_at) <= Date.now() ? 'Closed' : Date.parse(m.opens_at) <= Date.now() ? 'Open now' : 'Scheduled';
/** Administrator workspace page: schedule meetings, run check-in, and review who attended. */
export function MeetingManager() {
    useSiteLanguage();
    const [list, setList] = useState<Meeting[]>([]), [loaded, setLoaded] = useState(false), [busy, setBusy] = useState(false);
    const [editing, setEditing] = useState<Meeting | 'new' | null>(null), [hostCode, setHostCode] = useState<{
        title: string;
        code: string;
    } | null>(null);
    const [register, setRegister] = useState<{
        meeting: Meeting;
        rows: Attendee[];
    } | null>(null);
    const reload = () => platformApi<Meeting[]>('/meetings').then(setList);
    const live = useLiveTick();
    useEffect(() => { reload().catch(e => toast.error(translateUi(e.message))).finally(() => setLoaded(true)); }, [live]);
    const removeMeetings = async (rows: Meeting[]) => {
        const empty = rows.filter(m => !m.attendees);
        if (!empty.length)
            return toast.error(translateUi('Those meetings have check-ins, so they are kept for the attendance record.'));
        if (!await confirmAction({ title: `Delete ${empty.length} meeting${empty.length === 1 ? '' : 's'}?`, description: rows.length > empty.length ? `${rows.length - empty.length} selected have check-ins and will be kept.` : 'They are removed from the hub and the website.', confirmLabel: `Delete ${empty.length}`, destructive: true }))
            return;
        let done = 0;
        for (const m of empty) { try { await platformApi(`/meetings/${m.id}`, 'DELETE'); done++; } catch { /* Counted below. */ } }
        await reload();
        if (done) toast.success(translateUi('{p0} deleted', { p0: done === 1 ? '1 meeting' : `${done} meetings` }));
        if (done < empty.length) toast.error(translateUi('{p0} could not be deleted.', { p0: empty.length - done }));
    };
    const openRegister = async (m: Meeting) => { try {
        setRegister({ meeting: m, rows: await platformApi<Attendee[]>(`/meetings/${m.id}/attendance`) });
    }
    catch (e) {
        toast.error(translateUi((e as Error).message));
    } };
    async function manage(m: Meeting, action: 'publish' | 'rotate' | 'close') {
        setBusy(true);
        try {
            const result = await platformApi<Meeting & {
                code?: string;
            }>(`/meetings/${m.id}/manage`, 'POST', { action });
            if (result.code)
                setHostCode({ title: m.title, code: result.code });
            await reload();
            window.dispatchEvent(new Event('plp:announcement-updated'));
            toast.success(translateUi(action === 'publish' ? 'Meeting shown in the website banner' : action === 'rotate' ? 'New attendance code generated' : 'Attendance closed'));
        }
        catch (e) {
            toast.error(translateUi((e as Error).message));
        }
        finally {
            setBusy(false);
        }
    }
    const current = editing && editing !== 'new' ? editing : null;
    const totalCheckins = list.reduce((n, m) => n + (m.attendees || 0), 0);
    const rows = register?.rows ?? [];
    return <div className="ws-page">
  <header className="ws-page-header"><div><p className="ws-kicker">{translateUi("ADMINISTRATION")}</p><h1>{translateUi("Meetings & attendance")}</h1><p>{translateUi("Schedule PLP meetings, share the host code at the venue, and see who checked in.")}</p></div><button className="hub-button" onClick={() => { setEditing('new'); setHostCode(null); }}><Plus size={16}/>{translateUi(" Create meeting")}</button></header>
  {translateUi(hostCode && <Panel className="ms-callout"><div><h2>{translateUi(hostCode.title)}{translateUi(" \u00B7 Host code")}</h2><p className="hub-meeting-code">{translateUi(hostCode.code)}</p><p>{translateUi("Display this code at the venue. It is shown only once; generate a new one if needed.")}</p></div><button className="hub-button secondary" onClick={() => setHostCode(null)}>{translateUi("Hide code")}</button></Panel>)}
  <div className="ws-stats">
   <StatCard label={translateUi("Meetings")} value={String(list.length)} icon={CalendarDays}/>
   <StatCard label={translateUi("Open for check-in")} value={String(list.filter(m => meetingStatus(m) === 'Open now').length)} icon={DoorOpen}/>
   <StatCard label={translateUi("Total check-ins")} value={String(totalCheckins)} icon={Users}/>
   <StatCard label={translateUi("Credits awarded")} value={String(list.reduce((n, m) => n + (m.attendees || 0) * m.credits, 0))} icon={Coins}/>
  </div>
  <Panel>
   <div className="ws-panel-title"><h2>{translateUi("Scheduled meetings ")}<span className="ws-count">{translateUi(list.length)}</span></h2></div>
   {translateUi(!loaded ? <p>{translateUi("Loading meetings\u2026")}</p> : !list.length ? <Empty>{translateUi("No meetings yet. Use \u201CCreate meeting\u201D to schedule the first one.")}</Empty> : <div className="ws-table-wrap"><RecordTable title="meetings" rows={list} bulkActions={[{ label: "Delete", tone: "danger", run: removeMeetings }]} searchText={m=>`${m.title} ${m.location} ${meetingStatus(m)}`} filters={[{label:'Status',options:['Scheduled','Open now','Closed'].map(status=>({label:status,test:(m:Meeting)=>meetingStatus(m)===status}))}]} columns={[{label:translateUi("Meeting"),render:(m)=>{return <><strong>{translateUi(m.title)}</strong><small><MapPin size={11}/> {translateUi(m.location)}</small></>;}},
{label:translateUi("Attendance window"),render:(m)=>{return <>{translateUi(formatDate(m.opens_at))}<small>{translateUi("until ")}{translateUi(formatDate(m.closes_at))}{translateUi(" \u00B7 Kigali time")}</small></>;}},
{label:translateUi("Status"),render:(m)=>{const status = meetingStatus(m);return <><span className={`ws-status ${status === 'Open now' ? 'ws-status-issued' : status === 'Closed' ? 'ws-status-returned' : ''}`}>{translateUi(status)}</span></>;}},
{label:translateUi("Checked in"),render:(m)=>{return <><button className="hub-text-button" onClick={() => void openRegister(m)}>{translateUi(m.attendees || 0)}{translateUi(" people")}</button><small>{translateUi(m.credits)}{translateUi(" credits each")}</small></>;}},
{label:translateUi("Actions"),render:(m)=>{const status = meetingStatus(m);return <><div className="mb-actions">
      <button className="hub-record-icon hub-record-edit" title={translateUi("View attendance register")} aria-label={translateUi("Attendance for {p0}", { p0: translateUi(m.title) })} onClick={() => void openRegister(m)}><ClipboardList size={17}/></button>
      <Link className="hub-record-icon hub-record-edit" title={translateUi("Open check-in page")} aria-label={translateUi("Open check-in page for {p0}", { p0: translateUi(m.title) })} to={`/meetings/${m.id}`} target="_blank"><ExternalLink size={17}/></Link>
      {translateUi(status !== 'Closed' && <>
       <button className="hub-record-icon hub-record-edit" disabled={busy} title={translateUi("Edit date & details")} aria-label={translateUi("Edit {p0}", { p0: translateUi(m.title) })} onClick={() => { setEditing(m); setHostCode(null); }}><FilePenLine size={17}/></button>
       <button className="hub-record-icon hub-record-edit" disabled={busy} title={translateUi("Show in website banner")} aria-label={translateUi("Show {p0} in banner", { p0: translateUi(m.title) })} onClick={() => void manage(m, 'publish')}><Megaphone size={17}/></button>
       <button className="hub-record-icon hub-record-edit" disabled={busy} title={translateUi("New attendance code")} aria-label={translateUi("New code for {p0}", { p0: translateUi(m.title) })} onClick={() => void manage(m, 'rotate')}><KeyRound size={17}/></button>
       <button className="hub-record-icon hub-record-delete" disabled={busy} title={translateUi("Close attendance")} aria-label={translateUi("Close attendance for {p0}", { p0: translateUi(m.title) })} onClick={async () => { if (await confirmAction({ title: 'Close attendance for this meeting?', description: 'Members will no longer be able to check in with the attendance code.', confirmLabel: 'Close attendance', destructive: true }))
                        void manage(m, 'close'); }}><Ban size={17}/></button>
      </>)}
     </div></>;}}]}/></div>)}
  </Panel>
  {translateUi(register && <Panel>
   <div className="ws-panel-title"><h2>{translateUi("Attendance register \u00B7 ")}{translateUi(register.meeting.title)} <span className="ws-count">{translateUi(register.rows.length)}</span></h2><div className="hub-actions"><button className="hub-button secondary" disabled={!register.rows.length} onClick={() => downloadCSV(`attendance-${register.meeting.title.replace(/\W+/g, '-').toLowerCase()}.csv`, [['Name', 'Email', 'Role', 'Checked in (Kigali)', 'Distance from venue (m)', 'Location accuracy (m)'], ...register.rows.map(r => [r.name, r.email, r.role, formatDate(r.checked_in_at), r.distance_m, r.accuracy_m])])}><Download size={15}/>{translateUi(" Export CSV")}</button><button className="hub-button secondary" onClick={() => setRegister(null)}>{translateUi("Close")}</button></div></div>
   <p className="hub-caption">{translateUi(formatDate(register.meeting.opens_at))}{translateUi(" \u2013 ")}{translateUi(formatDate(register.meeting.closes_at))}{translateUi(" \u00B7 ")}{translateUi(register.meeting.location)}{translateUi(" \u00B7 ")}{translateUi(register.rows.length * register.meeting.credits)}{translateUi(" credits awarded")}</p>
   {translateUi(register.rows.length ? <>

    <div className="ws-table-wrap"><RecordTable title="attendees" rows={(rows).map((r, i) => ({...r, id: String(r.email), i,}))} searchText={r=>`${r.name} ${r.email} ${r.role}`}  columns={[{label:translateUi("#"),render:(r)=>{return <>{translateUi(r.i + 1)}</>;}},
{label:translateUi("Name"),render:(r)=>{return <><strong>{translateUi(r.name)}</strong><small>{translateUi(r.email)}</small></>;}},
{label:translateUi("Role"),render:(r)=>{return <>{translateUi(({ member: 'Member', leader: 'Club leader', trainer: 'Trainer', mentor: 'Mentor', admin: 'Administrator' } as Record<string, string>)[r.role] ?? r.role)}</>;}},
{label:translateUi("Checked in"),render:(r)=>{return <>{translateUi(formatDate(r.checked_in_at))}</>;}},
{label:translateUi("Distance from venue"),render:(r)=>{return <>{translateUi(r.distance_m)}{translateUi(" m")}<small>{translateUi("\u00B1")}{translateUi(r.accuracy_m)}{translateUi(" m accuracy")}</small></>;}}]}/></div>
   </> : <Empty>{translateUi("No one has checked in yet. Members check in on the meeting page with the host code while at the venue.")}</Empty>)}
  </Panel>)}
  {translateUi(editing && <Dialog open onOpenChange={o => { if (!o && !busy)
            setEditing(null); }}><DialogContent className="hub-app hub-dialog max-h-[90vh] overflow-y-auto">
   <DialogTitle>{translateUi(current ? 'Edit meeting' : 'Create a meeting')}</DialogTitle>
   <DialogDescription>{translateUi("Times use your device\u2019s timezone (")}{translateUi(Intl.DateTimeFormat().resolvedOptions().timeZone)}{translateUi("). Members see Kigali time.")}</DialogDescription>
   <form className="hub-form hub-space" onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                setBusy(true);
                try {
                    const input = { title: String(f.get('title')), location: String(f.get('location')), join_url: '', opens_at: new Date(String(f.get('opens'))).toISOString(), closes_at: new Date(String(f.get('closes'))).toISOString(), credits: Number(f.get('credits')), latitude: Number(f.get('latitude')), longitude: Number(f.get('longitude')), radius_m: Number(f.get('radius')), publish: f.get('publish') === 'on' };
                    const result = await platformApi<Meeting & {
                        code?: string;
                    }>(current ? `/meetings/${current.id}` : '/meetings', current ? 'PUT' : 'POST', input);
                    if (result.code)
                        setHostCode({ title: result.title, code: result.code });
                    setEditing(null);
                    await reload();
                    window.dispatchEvent(new Event('plp:announcement-updated'));
                    toast.success(translateUi(current ? 'Meeting updated' : 'Meeting created'));
                }
                catch (err) {
                    toast.error(translateUi((err as Error).message));
                }
                finally {
                    setBusy(false);
                }
            }}>
    <Field label={translateUi("Meeting name")}><input name="title" required maxLength={100} defaultValue={current?.title || 'PLP monthly meeting'}/></Field>
    <Field label={translateUi("Venue")}><input name="location" required maxLength={200} defaultValue={current?.location || 'ALX Hub · Deco Center, KG 9 Avenue, Kigali'}/></Field>
    <div className="ws-form-grid"><Field label={translateUi("Attendance opens")}><input name="opens" type="datetime-local" required defaultValue={current ? localInput(current.opens_at) : ''}/></Field><Field label={translateUi("Attendance closes")}><input name="closes" type="datetime-local" required defaultValue={current ? localInput(current.closes_at) : ''}/></Field></div>
    <div className="ws-form-grid"><Field label={translateUi("Credits per member")}><input name="credits" type="number" min={1} max={500} required defaultValue={current?.credits || 10}/></Field><Field label={translateUi("Attendance radius (metres)")}><input name="radius" type="number" min={30} max={300} required defaultValue={current?.radius_m || 150}/></Field></div>
    <details><summary>{translateUi("Venue map pin")}</summary><p className="hub-caption">{translateUi("Default pin from the ")}<a href="https://onboarding.alxafrica.com/pathway/hubs/" target="_blank" rel="noreferrer">{translateUi("ALX hub directory")}</a>{translateUi(". Confirm the entrance location before publishing.")}</p><div className="ws-form-grid"><Field label={translateUi("Latitude")}><input name="latitude" type="number" step="any" min={-90} max={90} required defaultValue={current?.latitude ?? -1.9270514}/></Field><Field label={translateUi("Longitude")}><input name="longitude" type="number" step="any" min={-180} max={180} required defaultValue={current?.longitude ?? 30.0986973}/></Field></div></details>
    {translateUi(!current && <label className="hub-check"><input name="publish" type="checkbox"/>{translateUi("Show this meeting in the website banner")}</label>)}
    <div className="hub-actions hub-dialog-actions"><button type="button" className="hub-button secondary" disabled={busy} onClick={() => setEditing(null)}>{translateUi("Cancel")}</button><button className="hub-button" disabled={busy}>{translateUi(busy ? 'Saving…' : current ? 'Save changes' : 'Create meeting')}</button></div>
   </form>
  </DialogContent></Dialog>)}
 </div>;
}
