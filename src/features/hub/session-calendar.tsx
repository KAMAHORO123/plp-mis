import { useState } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { translateUi, useSiteLanguage } from '../../i18n/language';
import type { Session } from './store';
import './sessions.css';
export interface CalendarItem { id: string; date: string; title: string; kind: string; href?: string; category?: "session" | "activity" | "deadline" | "meeting" }
/** Each kind of date has its own colour: red is always a deadline. */
export const CALENDAR_KINDS = [['deadline','Deadlines'],['session','Sessions'],['meeting','Meetings'],['activity','Activities']] as const;
const dayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const eventDay = (date: string) => date.length === 10 ? date : dayKey(new Date(date));
export function DueBadge({ date, ending = false }: { date: string; ending?: boolean }) {
  const diff = new Date(date.length === 10 ? `${date}T23:59:59` : date).getTime() - Date.now();
  if (diff < 0 || diff > 7 * 86400000) return null;
  return <span className={`schedule-badge ${diff <= 86400000 ? 'soon' : 'week'}`}>{translateUi(diff <= 86400000 ? (ending ? 'Ending today' : 'Within 24 hours') : ending ? 'Ending this week' : 'This week')}</span>;
}
export function SessionCalendar({ items, compact = false }: { items: CalendarItem[]; compact?: boolean }) {
  const language = useSiteLanguage();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState('');
  const first = (month.getDay()+6)%7, days = new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
  const monthKey = dayKey(month).slice(0,7);
  const thisMonth = monthKey === dayKey(new Date()).slice(0,7);
  const visible = items.filter(i => selected ? eventDay(i.date) === selected : thisMonth ? eventDay(i.date) >= dayKey(new Date()) : eventDay(i.date).slice(0,7) === monthKey).sort((a,b) => a.date.localeCompare(b.date)).slice(0, selected ? undefined : 8);
  const locale = language === 'fr' ? 'fr' : language === 'rw' ? 'rw' : 'en-GB';
  const move = (offset: number) => { setMonth(new Date(month.getFullYear(),month.getMonth()+offset,1)); setSelected(''); };
  return <section className={`schedule-calendar${compact ? " is-compact" : ""}`} aria-label={translateUi('Upcoming calendar')}>
    <div className="schedule-month"><h3>{month.toLocaleDateString(locale,{month:'long',year:'numeric'})}</h3><div className="hub-actions"><button className="hub-button secondary" aria-label={translateUi('Previous month')} onClick={() => move(-1)}><ChevronLeft size={16}/></button><button className="hub-button secondary" onClick={() => { setMonth(new Date(new Date().getFullYear(),new Date().getMonth(),1)); setSelected(''); }}>{translateUi('Today')}</button><button className="hub-button secondary" aria-label={translateUi('Next month')} onClick={() => move(1)}><ChevronRight size={16}/></button></div></div>
    <div className="schedule-grid">{Array.from({length:7},(_,i) => <small key={`weekday${i}`}>{new Date(2024,0,i+1).toLocaleDateString(locale,{weekday:'short'})}</small>)}
      {Array.from({length:first},(_,i)=><span key={`blank${i}`}/>)}
      {Array.from({length:days},(_,i)=>{ const date = dayKey(new Date(month.getFullYear(),month.getMonth(),i+1)); const events = items.filter(e=>eventDay(e.date)===date); return <button key={date} className={`${selected===date?'selected':''} ${date===dayKey(new Date())?'today':''}`} aria-pressed={selected===date} aria-label={`${date}: ${events.length} ${translateUi('events')}`} onClick={()=>setSelected(selected===date?'':date)}><span>{i+1}</span>{events.length>0&&<span className="calendar-dots" aria-hidden="true">{[...new Set(events.map(e=>e.category||'activity'))].map(kind=><i key={kind} className={`calendar-dot ${kind}`}/>)}</span>}{!compact&&events.length>0&&<span className="calendar-chips" aria-hidden="true">{events.slice(0,2).map(e=><em key={e.id} className={e.category||'activity'}>{e.title}</em>)}{events.length>2&&<small>+{events.length-2}</small>}</span>}</button>;})}
    </div>
    <div className="calendar-legend">{CALENDAR_KINDS.map(([kind,label])=><span key={kind}><i className={`calendar-dot ${kind}`}/>{translateUi(label)}</span>)}</div>
    <div className="schedule-agenda" aria-live="polite"><div className="schedule-month"><strong>{selected || translateUi('Coming up')}</strong>{selected && <button className="hub-text-button" onClick={()=>setSelected('')}>{translateUi('Show month')}</button>}</div>
      {visible.length ? visible.map(i=><div className="schedule-event" key={i.id}><i aria-hidden="true" className={`calendar-dot ${i.category||"activity"}`}/><time>{new Date(i.date.length===10?`${i.date}T12:00:00`:i.date).toLocaleDateString(locale,{day:'numeric',month:'short'})}{i.date.length>10&&<small>{new Date(i.date).toLocaleTimeString(locale,{hour:'2-digit',minute:'2-digit'})}</small>}</time><div>{i.href?<a className="hub-text-link" href={i.href}>{i.title}</a>:<strong>{i.title}</strong>}<small>{translateUi(i.kind)}</small></div><DueBadge date={i.date}/></div>) : <p className="hub-caption">{translateUi('Nothing scheduled in this view.')}</p>}
    </div>
  </section>;
}
export function CalendarDownload({ session }: { session: Session }) {
  const download = () => {
    const escape = (value: string) => value.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
    const stamp = (date: string) => new Date(date).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
    const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//PLP//Sessions//EN','BEGIN:VEVENT',`UID:${session.id}@plp`,`DTSTAMP:${stamp(new Date().toISOString())}`,`DTSTART:${stamp(session.date)}`,`SUMMARY:${escape(session.topic || 'PLP mentorship')}`,`DESCRIPTION:${escape([session.goal, session.meetingLink].filter(Boolean).join('\n'))}`,`LOCATION:${escape(session.location || '')}`,'BEGIN:VALARM','TRIGGER:-PT1H','ACTION:DISPLAY','DESCRIPTION:PLP session reminder','END:VALARM','END:VEVENT','END:VCALENDAR'];
    const url=URL.createObjectURL(new Blob([lines.join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='plp-session.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  return <button className="hub-text-button" onClick={download}><Download size={14}/> {translateUi('Add to calendar')}</button>;
}
