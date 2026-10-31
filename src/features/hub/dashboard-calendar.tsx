import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useHub } from './store';
import { Heading, Panel } from './ui';
import { SessionCalendar, CALENDAR_KINDS, type CalendarItem } from './session-calendar';
import { platformApi } from './platform-api';
import { useLiveTick } from './live';
import { translateUi, useSiteLanguage } from '../../i18n/language';
const dayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const dayOf = (date: string) => date.length === 10 ? date : dayKey(new Date(date));
/** Everything with a date that matters to the signed-in person: sessions, activities, meetings and deadlines. */
function useCalendarItems() {
  const { state, profile } = useHub();
  const [remote, setRemote] = useState<CalendarItem[]>([]);
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
  useSiteLanguage();
  const items = useCalendarItems();
  return <div className="ws-page"><Heading title={translateUi('Calendar')} description={translateUi(CALENDAR_KINDS.map(([,label])=>label).join(' · '))}/>
    <Panel className="calendar-page"><SessionCalendar items={items}/></Panel>
  </div>;
}
