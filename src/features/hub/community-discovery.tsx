import { usePaged, Pager } from "./management-ui";
import { DueBadge } from "./session-calendar";
import { translateUi, useSiteLanguage } from '../../i18n/language';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, Hand, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useHub, today } from './store';
import { deleteRecord, saveRecord } from './platform-records';
import { Heading, Field } from './ui';
import { FormModal } from './modal';
import { ActivityCard, hostName } from './school-operations';
import type { CommunityActivity } from './operations-data';
/** What members see: activities published by schools and PLP, with a one-tap "I'll participate". */
export function CommunityDiscovery({ compact = false }: {
    compact?: boolean;
}) {
    useSiteLanguage();
    const { state, profile } = useHub();
    const [tab, setTab] = useState<'Upcoming' | 'Going' | 'Past'>('Upcoming');
    const [host, setHost] = useState('All');
    const [search, setSearch] = useState('');
    const [busy, setBusy] = useState('');
    const [highlights, setHighlights] = useState<CommunityActivity | null>(null);
    const activities = state.operations.activities;
    const mine = (id: string) => state.operations.requests.find((r) => r.activityId === id && r.memberId === profile.id && r.status !== 'Declined');
    const upcoming = activities.filter((a) => a.date >= today()).sort((a, b) => a.date.localeCompare(b.date));
    const going = upcoming.filter((a) => mine(a.id));
    const past = activities.filter((a) => a.date < today()).sort((a, b) => b.date.localeCompare(a.date));
    const shown = (tab === 'Going' ? going : tab === 'Past' ? past : upcoming)
        .filter((a) => (host === 'All' || a.hostId === host) && `${a.title} ${hostName(a.hostId)} ${a.type ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()));
    const activityPage = usePaged(shown, 9, `${search}|${host}|${tab}`);
    const participate = async (a: CommunityActivity) => {
        setBusy(a.id);
        try {
            await saveRecord('applications', { title: profile.name, description: 'Activity participation', category: `activity:${a.id}` });
            toast.success(translateUi("You're going to {p0}. The organiser can see you on their list.", { p0: translateUi(a.title) }));
        }
        catch (e) {
            toast.error(translateUi((e as Error).message));
        }
        finally {
            setBusy('');
        }
    };
    const withdraw = async (a: CommunityActivity) => {
        const r = mine(a.id);
        if (!r)
            return;
        setBusy(a.id);
        try {
            await deleteRecord('applications', r.id);
            toast.success(translateUi('Removed. The organiser will no longer expect you.'));
        }
        catch (e) {
            toast.error(translateUi((e as Error).message));
        }
        finally {
            setBusy('');
        }
    };
    const actions = (a: CommunityActivity) => {
        if (a.date < today())
            return a.report ? <button className="hub-button secondary" onClick={() => setHighlights(a)}>{translateUi("Read highlights")}</button> : <span className="act-status done">{translateUi("Completed")}</span>;
        if (mine(a.id))
            return <><span className="act-going"><Check size={15}/>{translateUi(" You're going")}</span><button className="hub-text-button act-withdraw" disabled={busy === a.id} onClick={() => void withdraw(a)}>{translateUi("Can't make it")}</button></>;
        return <button className="hub-button" disabled={busy === a.id} onClick={() => void participate(a)}><Hand size={15}/>{translateUi(" I'll participate")}</button>;
    };
    const grid = (rows: CommunityActivity[]) => <div className="act-grid">{translateUi(rows.map((a) => <ActivityCard key={a.id} a={a}><DueBadge date={a.date}/>{translateUi(actions(a))}</ActivityCard>))}</div>;
    if (compact)
        return (<section className="hub-space community-discovery-compact">
      <div className="ws-panel-title"><h2>{translateUi("Coming up")}</h2><Link className="hub-text-link" to="/clubs">{translateUi("All activities ")}<ArrowUpRight size={15}/></Link></div>
      {translateUi(upcoming.length ? grid(upcoming.slice(0, 3)) : <p className="pv-empty">{translateUi("Nothing coming up yet.")}</p>)}
    </section>);
    const hosts = [...new Set(activities.map((a) => a.hostId))].map((id) => ({ id, name: hostName(id) })).sort((a, b) => a.name.localeCompare(b.name));
    return (<>
      <Heading title={translateUi("Activities")} description={translateUi("See what schools and PLP communities are organising, and let them know you'll be there.")}/>
      <div className="ws-tabs" aria-label={translateUi("Activity views")}>
        {translateUi(([['Upcoming', `Upcoming · ${upcoming.length}`], ['Going', `I'm going · ${going.length}`], ['Past', 'Past activities']] as const).map(([key, label]) => (<button key={key} className={tab === key ? 'active' : ''} aria-pressed={tab === key} onClick={() => setTab(key)}>{translateUi(label)}</button>)))}
      </div>
      <div className="act-filters">
        <Field label={translateUi("Search")}><span className="act-search"><Search size={15}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={translateUi("Activity, school or type")} style={{ paddingLeft: 36 }}/></span></Field>
        <Field label={translateUi("School or community")}><select value={host} onChange={(e) => setHost(e.target.value)}><option value="All">{translateUi("All schools and communities")}</option>{translateUi(hosts.map((h) => <option key={h.id} value={h.id}>{translateUi(h.name)}</option>))}</select></Field>
      </div>
      {translateUi(shown.length ? grid(activityPage.items) : <p className="pv-empty">{translateUi(tab === 'Going' ? "You haven't signed up for anything yet. Pick an upcoming activity and tap “I'll participate”." : tab === 'Past' ? 'No past activities yet.' : 'No upcoming activities match. New ones appear here as soon as they are published.')}</p>)}
      <Pager {...activityPage}/>
      {translateUi(highlights && (<FormModal title={translateUi(highlights.title)} description={translateUi(`${hostName(highlights.hostId)} · ${new Date(`${highlights.date}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}`)} onClose={() => setHighlights(null)} wide>
          <p className="am-report">{translateUi(highlights.report)}</p>
          {translateUi(highlights.photos.length > 0 && <div className="ops-photos">{translateUi(highlights.photos.map((p, i) => <img key={i} src={p.data} alt={translateUi("{p0} photo {p1}", { p0: translateUi(highlights.title), p1: translateUi(i + 1) })}/>))}</div>)}
          <div className="hub-actions hub-dialog-actions"><button className="hub-button secondary" onClick={() => setHighlights(null)}>{translateUi("Close")}</button></div>
        </FormModal>))}
    </>);
}
