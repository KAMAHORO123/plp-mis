import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarPlus, FilePenLine, MapPin, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useHub } from './store';
import { Empty, Field, Heading, Panel, Spinner } from './ui';
import { FormModal } from './modal';
import { confirmAction } from '@/components/shared/confirm-dialog';
import { SessionCalendar, CALENDAR_KINDS, type CalendarItem } from './session-calendar';
import { platformApi } from './platform-api';
import { useLiveTick } from './live';
import { translateUi, useSiteLanguage } from '../../i18n/language';
const dayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const dayOf = (date: string) => date.length === 10 ? date : dayKey(new Date(date));
/** Everything with a date that matters to the signed-in person: sessions, activities, meetings and deadlines. */
/** An event the person added to their own calendar. Only they can see it. */
type Personal = { id: string; version: number; data: { title: string; date: string; start_time?: string; location?: string; description?: string } };
const personalDate = (p: Personal) => p.data.start_time ? `${p.data.date}T${p.data.start_time}` : p.data.date;
// Pages re-read personal events after the person adds, edits or deletes one.
const PERSONAL_CHANGED = 'plp:personal-events';
function usePersonalEvents() {
  const { profile } = useHub();
  const [events, setEvents] = useState<Personal[] | null>(null);
  useEffect(() => {
    let active = true;
    const load = () => platformApi<Personal[]>('/records/agenda').then(r => { if (active) setEvents(r); }).catch(() => { if (active) setEvents([]); });
    void load();
    window.addEventListener(PERSONAL_CHANGED, load);
    return () => { active = false; window.removeEventListener(PERSONAL_CHANGED, load); };
  }, [profile.id]);
  return events;
}
function useCalendarItems() {
  const { state, profile } = useHub();
  const [remote, setRemote] = useState<CalendarItem[]>([]);
  const personal = usePersonalEvents();
  const tick = useLiveTick();
  useEffect(() => {
    let active = true;
    Promise.all([
      platformApi<{id:string;data:{title:string;deadline?:string;published?:boolean}}[]>('/records/opportunities').catch(()=>[]),
      platformApi<{id:string;title:string;opens_at:string}[]>('/public/meetings').catch(()=>[]),
    ]).then(([opportunities, meetings])=>{
      if(!active) return;
      setRemote([
        ...opportunities.filter(r=>r.data.published&&r.data.deadline).map(r=>({id:r.id,date:r.data.deadline!,title:r.data.title,kind:'Deadline',category:'deadline' as const,href:'/opportunities'})),
        ...(Array.isArray(meetings)?meetings:[]).map(m=>({id:m.id,date:m.opens_at,title:m.title,kind:'Meeting',category:'meeting' as const,href:`/meetings/${m.id}`})),
      ]);
    });
    return ()=>{active=false;};
  },[profile.id,tick]);
  return [
    ...state.sessions.filter(s=>(s.memberId===profile.id||s.mentorId===profile.id)&&['Requested','Confirmed'].includes(s.status)).map(s=>({id:s.id,date:s.date,title:s.topic||'Mentorship',kind:s.status,category:'session' as const,href:profile.role==='Mentor'?'/mentor-sessions':'/mentorship'})),
    ...state.operations.activities.map(a=>({id:a.id,date:a.date,title:a.title,kind:'Activity',category:'activity' as const,href:`/clubs?activity=${a.id}`})),
    ...remote,
    ...(personal ?? []).map(p=>({id:p.id,date:personalDate(p),title:p.data.title,kind:p.data.location?`My event · ${p.data.location}`:'My event',category:'personal' as const,href:'/calendar'})),
  ];
}
/** A slim week strip for the dashboard; the full month lives on the Calendar page. */
export function DashboardCalendar() {
  const language = useSiteLanguage();
  const items = useCalendarItems();
  const locale = language === 'fr' ? 'fr' : language === 'rw' ? 'rw' : 'en-GB';
  const today = new Date(); today.setHours(0,0,0,0);
  const week = Array.from({length:7},(_,i)=>new Date(today.getFullYear(),today.getMonth(),today.getDate()+i));
  const horizon = dayKey(new Date(today.getFullYear(),today.getMonth(),today.getDate()+14));
  const next = items.filter(i=>dayOf(i.date)>=dayKey(today)&&dayOf(i.date)<=horizon).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4);
  return <Panel className="week-glance">
    <div className="week-glance-head"><h2>{translateUi('This week')}</h2><Link className="hub-text-link" to="/calendar">{translateUi('Open calendar')}<ArrowUpRight size={14}/></Link></div>
    <div className="week-strip"><ol className="week-days">{week.map((d,i)=>{ const key=dayKey(d), kinds=[...new Set(items.filter(e=>dayOf(e.date)===key).map(e=>e.category||'activity'))]; return <li key={key} className={[i===0&&'is-today',kinds.length&&'has-events'].filter(Boolean).join(' ')||undefined}><small>{d.toLocaleDateString(locale,{weekday:'short'})}</small><strong>{d.getDate()}</strong><span className="calendar-dots" aria-label={translateUi('{p0} events',{p0:kinds.length})}>{kinds.map(k=><i key={k} className={`calendar-dot ${k}`}/>)}</span></li>; })}</ol>
    <p className="week-legend">{CALENDAR_KINDS.map(([kind,label])=><span key={kind}><i className={`calendar-dot ${kind}`} aria-hidden="true"/>{translateUi(label)}</span>)}</p></div>
    <ul className="week-next">{next.length ? next.map(i=>{ const d=new Date(i.date.length===10?`${i.date}T12:00:00`:i.date); return <li key={`${i.category}${i.id}`}><time dateTime={dayOf(i.date)}><b>{d.getDate()}</b><small>{d.toLocaleDateString(locale,{month:'short'})}</small></time><div><Link to={i.href||'/calendar'}>{i.title}</Link><span><i className={`calendar-dot ${i.category||'activity'}`} aria-hidden="true"/>{translateUi(i.kind)} · {d.toLocaleDateString(locale,{weekday:'long'})}</span></div></li>; }) : <li className="hub-caption">{translateUi('Nothing in the next two weeks.')}</li>}</ul>
  </Panel>;
}
export function CalendarPage() {
  const language = useSiteLanguage();
  const items = useCalendarItems();
  const personal = usePersonalEvents();
  const [editing, setEditing] = useState<Personal | 'new' | null>(null), [busy, setBusy] = useState(false);
  const current = editing && editing !== 'new' ? editing : null;
  const locale = language === 'fr' ? 'fr' : language === 'rw' ? 'rw' : 'en-GB';
  const todayKey = dayKey(new Date());
  const upcoming = (personal ?? []).filter(p => p.data.date >= todayKey).sort((a, b) => personalDate(a).localeCompare(personalDate(b)));
  const changed = () => window.dispatchEvent(new Event(PERSONAL_CHANGED));
  const save = async (f: FormData) => {
    const str = (k: string) => String(f.get(k) ?? '').trim();
    const data = { title: str('title'), date: str('date'), description: str('description'), ...(str('start_time') ? { start_time: str('start_time') } : {}), ...(str('location') ? { location: str('location') } : {}) };
    setBusy(true);
    try {
      if (current) await platformApi(`/records/agenda/${current.id}`, 'PUT', { data, version: current.version });
      else await platformApi('/records/agenda', 'POST', data);
      toast.success(translateUi(current ? 'Event updated' : 'Event added to your calendar'));
      setEditing(null); changed();
    } catch (e) { toast.error(translateUi((e as Error).message)); }
    finally { setBusy(false); }
  };
  const remove = async (p: Personal) => {
    if (!await confirmAction({ title: `Delete “${p.data.title}”?`, description: 'It is removed from your calendar.', confirmLabel: 'Delete', destructive: true })) return;
    try { await platformApi(`/records/agenda/${p.id}`, 'DELETE'); toast.success(translateUi('Event deleted')); changed(); }
    catch (e) { toast.error(translateUi((e as Error).message)); }
  };
  return <div className="ws-page"><Heading title={translateUi('Calendar')} description={translateUi(CALENDAR_KINDS.map(([,label])=>label).join(' · '))} action={<button type="button" className="hub-button" onClick={() => setEditing('new')}><CalendarPlus size={16}/>{translateUi('Add event')}</button>}/>
    <Panel className="calendar-page"><SessionCalendar items={items}/></Panel>
    <Panel>
      <div className="ws-panel-title"><h2>{translateUi('My events')} <span className="ws-count">{upcoming.length}</span></h2></div>
      {personal === null ? <Spinner label="Loading your events…"/> : upcoming.length ? <ul className="my-events">{upcoming.map(p => { const d = new Date(`${p.data.date}T12:00:00`); return <li key={p.id}>
        <time dateTime={p.data.date}><b>{d.getDate()}</b><small>{d.toLocaleDateString(locale, { month: 'short' })}</small></time>
        <div><strong>{p.data.title}</strong><small>{[p.data.start_time, p.data.location].filter(Boolean).join(' · ') || translateUi('All day')}</small>{p.data.description && <p>{p.data.description}</p>}</div>
        <div className="hub-actions">
          <button type="button" className="hub-record-icon hub-record-edit" aria-label={translateUi('Edit {p0}', { p0: p.data.title })} title={translateUi('Edit')} onClick={() => setEditing(p)}><FilePenLine size={17}/></button>
          <button type="button" className="hub-record-icon hub-record-delete" aria-label={translateUi('Delete {p0}', { p0: p.data.title })} title={translateUi('Delete')} onClick={() => void remove(p)}><Trash2 size={17}/></button>
        </div>
      </li>; })}</ul> : <Empty>{translateUi('Nothing added yet. Use “Add event” to put your own plans on the calendar. Only you can see them.')}</Empty>}
    </Panel>
    {editing && <FormModal title={translateUi(current ? 'Edit event' : 'Add an event')} description={translateUi('Only you can see events you add.')} onClose={() => { if (!busy) setEditing(null); }}>
      <form className="hub-form" onSubmit={(e) => { e.preventDefault(); void save(new FormData(e.currentTarget)); }}>
        <Field label={translateUi('What')}><input name="title" required minLength={2} maxLength={120} defaultValue={current?.data.title} placeholder={translateUi('e.g. Study group')} autoFocus/></Field>
        <div className="ws-form-grid">
          <Field label={translateUi('Date')}><input name="date" type="date" required defaultValue={current?.data.date ?? todayKey}/></Field>
          <Field label={translateUi('Time (optional)')}><input name="start_time" type="time" defaultValue={current?.data.start_time}/></Field>
        </div>
        <Field label={translateUi('Where (optional)')}><span className="my-events-where"><MapPin size={15} aria-hidden="true"/><input name="location" maxLength={100} defaultValue={current?.data.location}/></span></Field>
        <Field label={translateUi('Notes (optional)')}><textarea name="description" rows={3} maxLength={1000} defaultValue={current?.data.description}/></Field>
        <div className="hub-actions hub-dialog-actions"><button type="button" className="hub-button secondary" disabled={busy} onClick={() => setEditing(null)}>{translateUi('Cancel')}</button><button className="hub-button" disabled={busy}>{translateUi(busy ? 'Saving…' : current ? 'Save changes' : 'Add event')}</button></div>
      </form>
    </FormModal>}
  </div>;
}
