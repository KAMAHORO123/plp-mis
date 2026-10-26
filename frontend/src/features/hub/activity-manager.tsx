import { useEffect, useState } from 'react';
import { useLiveTick } from './live';
import { CalendarCheck2, CheckCircle2, ClipboardList, Megaphone, UserCheck } from 'lucide-react';
import { today } from './store';
import { FormModal } from './modal';
import { usePaged, Pager } from './management-ui';
import { type CommunityActivity } from './operations-data';
import { platformApi } from './platform-api';

export interface Registration { id: string; member_id: string; name: string; email: string; created_at: string }
export const activityCredits = (type = 'Meeting') => ({ Meeting: 10, Volunteering: 20, Challenge: 25, Recruitment: 15 } as Record<string, number>)[type] ?? 10;

/** Where an activity is in its life: open for registration, waiting for its report, or complete. A submitted report is final. */
export function activityStage(a: CommunityActivity) {
  if (a.report) return { key: 'done', label: 'Completed' } as const;
  if (a.date <= today()) return { key: 'due', label: 'Report due' } as const;
  return { key: 'open', label: 'Registration open' } as const;
}

export function useRegistrations(eventId: string | undefined) {
  const [rows, setRows] = useState<Registration[] | null>(null);
  const live = useLiveTick();
  useEffect(() => { setRows(null); }, [eventId]);
  useEffect(() => {
    if (!eventId) return;
    platformApi<Registration[]>(`/events/${eventId}/registrations`).then(setRows).catch(() => setRows([]));
  }, [eventId, live]);
  return rows;
}

export function ActivityManager({ activity: a, host, admin, onClose, onReport }: { activity: CommunityActivity; host: string; admin: boolean; onClose: () => void; onReport: () => void }) {
  const registrations = useRegistrations(a.id);
  const paged = usePaged(registrations ?? [], 5);
  const stage = activityStage(a);
  const order = ['open', 'due', 'done'];
  const at = order.indexOf(stage.key);
  const steps = [
    { icon: Megaphone, title: 'Published', detail: 'Members can see and register' },
    { icon: UserCheck, title: 'Registrations', detail: registrations ? `${registrations.length} registered` : 'Loading…' },
    { icon: ClipboardList, title: 'Attendance & report', detail: a.report ? `${a.attendees.length} attended · credits awarded` : `From ${a.date}` },
  ];
  const state = (i: number) => (i <= at ? 'done' : i === at + 1 ? 'current' : '');
  return (
    <FormModal title={a.title} description={`${host} · ${a.type ?? 'Meeting'} · ${new Date(`${a.date}T00:00:00`).toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`} onClose={onClose} wide>
      <ol className="am-steps">
        {steps.map((s, i) => <li key={s.title} className={state(i)}><span>{state(i) === 'done' ? <CheckCircle2 size={16} /> : <s.icon size={16} />}</span><strong>{s.title}</strong><small>{s.detail}</small></li>)}
      </ol>

      <div className={`am-next ${stage.key}`}>
        {stage.key === 'open' && <><CalendarCheck2 size={20} /><div><strong>Registration is open</strong><p>Members find this activity in Clubs & communities and register. On {a.date} you take attendance and submit the report here.</p></div></>}
        {stage.key === 'due' && <><ClipboardList size={20} /><div><strong>Take attendance and submit the report</strong><p>Tick who came, describe what happened and add photos. Attendees with an account earn {activityCredits(a.type)} PLP credits.</p></div><button className="hub-button" onClick={onReport}>Take attendance & report</button></>}
        {stage.key === 'done' && <><CheckCircle2 size={20} /><div><strong>Report submitted</strong><p>{a.attendees.length ? `${a.attendees.length} attended, and credits were awarded automatically.` : 'No attendance was recorded, so no credits were awarded.'}{admin ? '' : ' You can still update the report.'}</p></div>{!admin && <button className="hub-button secondary" onClick={onReport}>Update report</button>}</>}
      </div>

      <section className="am-section">
        <h3>Registered members <span>{registrations?.length ?? ''}</span></h3>
        {registrations === null ? <p className="hub-caption">Loading registrations…</p>
          : registrations.length ? <><ul className="am-people">{paged.items.map(r => <li key={r.id}><span className="am-initial">{r.name.slice(0, 1).toUpperCase()}</span><div><strong>{r.name}</strong><small>{r.email}</small></div><small>{new Date(r.created_at).toLocaleDateString()}</small>{a.attendees.includes(r.member_id) && <em>Attended</em>}</li>)}</ul><Pager {...paged} /></>
          : <p className="am-empty">No one has registered yet. You can still record attendance from your school register on the day.</p>}
      </section>

      {a.report && <section className="am-section"><h3>Report</h3><p className="am-report">{a.report}</p>
        {a.photos.length > 0 && <div className="am-photos">{a.photos.map((p, i) => <a key={i} href={p.data} target="_blank" rel="noreferrer"><img src={p.data} alt={`${a.title} photo ${i + 1}`} /></a>)}</div>}</section>}
      {a.description && !a.report && <section className="am-section"><h3>About this activity</h3><p className="am-report">{a.description}</p></section>}
    </FormModal>
  );
}
