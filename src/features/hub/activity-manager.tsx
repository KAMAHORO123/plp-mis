import { translateUi, useSiteLanguage } from '../../i18n/language';
import { useEffect, useState } from 'react';
import { useLiveTick } from './live';
import { CalendarCheck2, CheckCircle2, ClipboardList, Megaphone, UserCheck } from 'lucide-react';
import { today } from './store';
import { FormModal } from './modal';
import { usePaged, Pager } from './management-ui';
import { type CommunityActivity } from './operations-data';
import { platformApi } from './platform-api';
export interface Registration {
    id: string;
    member_id: string;
    name: string;
    email: string;
    created_at: string;
}
export const activityCredits = (type = 'Meeting') => ({ Meeting: 10, Volunteering: 20, Challenge: 25, Recruitment: 15 } as Record<string, number>)[type] ?? 10;
/** Where an activity is in its life: open for registration, waiting for its report, or complete. A submitted report is final. */
export function activityStage(a: CommunityActivity) {
    if (a.report)
        return { key: 'done', label: 'Completed' } as const;
    if (a.date <= today())
        return { key: 'due', label: 'Report due' } as const;
    return { key: 'open', label: 'Registration open' } as const;
}
export function useRegistrations(eventId: string | undefined) {
    const [rows, setRows] = useState<Registration[] | null>(null);
    const live = useLiveTick();
    useEffect(() => { setRows(null); }, [eventId]);
    useEffect(() => {
        if (!eventId)
            return;
        platformApi<Registration[]>(`/events/${eventId}/registrations`).then(setRows).catch(() => setRows([]));
    }, [eventId, live]);
    return rows;
}
export function ActivityManager({ activity: a, host, admin, onClose, onReport }: {
    activity: CommunityActivity;
    host: string;
    admin: boolean;
    onClose: () => void;
    onReport: () => void;
}) {
    useSiteLanguage();
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
    return (<FormModal title={translateUi(a.title)} description={translateUi(`${host} · ${a.type ?? 'Meeting'} · ${new Date(`${a.date}T00:00:00`).toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`)} onClose={onClose} wide>
      <ol className="am-steps">
        {translateUi(steps.map((s, i) => <li key={s.title} className={state(i)}><span>{translateUi(state(i) === 'done' ? <CheckCircle2 size={16}/> : <s.icon size={16}/>)}</span><strong>{translateUi(s.title)}</strong><small>{translateUi(s.detail)}</small></li>))}
      </ol>

      <div className={`am-next ${stage.key}`}>
        {translateUi(stage.key === 'open' && <><CalendarCheck2 size={20}/><div><strong>{translateUi("Registration is open")}</strong><p>{translateUi("Members find this activity in Clubs & communities and register. On ")}{translateUi(a.date)}{translateUi(" you take attendance and submit the report here.")}</p></div></>)}
        {translateUi(stage.key === 'due' && <><ClipboardList size={20}/><div><strong>{translateUi("Take attendance and submit the report")}</strong><p>{translateUi("Tick who came, describe what happened and add photos. Attendees with an account earn ")}{translateUi(activityCredits(a.type))}{translateUi(" PLP credits.")}</p></div><button className="hub-button" onClick={onReport}>{translateUi("Take attendance & report")}</button></>)}
        {translateUi(stage.key === 'done' && <><CheckCircle2 size={20}/><div><strong>{translateUi("Report submitted")}</strong><p>{translateUi(a.attendees.length ? `${a.attendees.length} attended, and credits were awarded automatically.` : 'No attendance was recorded, so no credits were awarded.')}{translateUi(admin ? '' : ' You can still update the report.')}</p></div>{translateUi(!admin && <button className="hub-button secondary" onClick={onReport}>{translateUi("Update report")}</button>)}</>)}
      </div>

      <section className="am-section">
        <h3>{translateUi("Registered members ")}<span>{translateUi(registrations?.length ?? '')}</span></h3>
        {translateUi(registrations === null ? <p className="hub-caption">{translateUi("Loading registrations\u2026")}</p>
            : registrations.length ? <><ul className="am-people">{translateUi(paged.items.map(r => <li key={r.id}><span className="am-initial">{translateUi(r.name.slice(0, 1).toUpperCase())}</span><div><strong>{translateUi(r.name)}</strong><small>{translateUi(r.email)}</small></div><small>{translateUi(new Date(r.created_at).toLocaleDateString())}</small>{translateUi(a.attendees.includes(r.member_id) && <em>{translateUi("Attended")}</em>)}</li>))}</ul><Pager {...paged}/></>
                : <p className="am-empty">{translateUi("No one has registered yet. You can still record attendance from your school register on the day.")}</p>)}
      </section>

      {translateUi(a.report && <section className="am-section"><h3>{translateUi("Report")}</h3><p className="am-report">{translateUi(a.report)}</p>
        {translateUi(a.photos.length > 0 && <div className="am-photos">{translateUi(a.photos.map((p, i) => <a key={i} href={p.data} target="_blank" rel="noreferrer"><img src={p.data} alt={translateUi("{p0} photo {p1}", { p0: translateUi(a.title), p1: translateUi(i + 1) })}/></a>))}</div>)}</section>)}
      {translateUi(a.description && !a.report && <section className="am-section"><h3>{translateUi("About this activity")}</h3><p className="am-report">{translateUi(a.description)}</p></section>)}
    </FormModal>);
}
