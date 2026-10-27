import { translateUi, useSiteLanguage } from '../../i18n/language';
import { useEffect, useState } from 'react';
import { useLiveTick } from './live';
import { platformApi } from './platform-api';
import { useOverview, figure, type AdminOverview, type MemberOverview } from './reports';
import { CommunityDiscovery } from './community-discovery';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Award, Clock3, Globe, Coins, BriefcaseBusiness, ArrowUpRight, CalendarDays, UserCheck, type LucideIcon } from 'lucide-react';
import { KpiTile, TrendCard, ShareCard, RankCard, series } from './charts';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { StatCard } from '@/components/shared/stat-card';
import { useHub, balance } from './store';
import { clubs } from './data';
import { demoSchools } from './school-data';
import { Panel, Empty } from './ui';
import './workspaces.css';
type Row = {
    id: string;
    title: string;
    detail: string;
    status: string;
    value: string;
    to: string;
};
export function RoleDashboard() {
    useSiteLanguage();
    const { state, profile } = useHub();
    const admin = profile.role === 'Administrator', trainer = profile.role === 'Trainer', coordinator = profile.role === 'Club leader', leader = profile.role === 'Club leader';
    const [query, setQuery] = useState('');
    // Figures come from the server's records (see services/platform/src/reports.mjs), never from this browser's copy.
    const overview = useOverview<AdminOverview | MemberOverview>();
    const ad = overview?.role === 'admin' ? overview as AdminOverview : null, me = overview && overview.role !== 'admin' ? overview as MemberOverview : null;
    const live = useLiveTick();
    // Platform courses the member is enrolled in, for "Continue learning".
    const [enrolled, setEnrolled] = useState<Row[]>([]);
    useEffect(() => { if (admin)
        return; let active = true; Promise.all([platformApi<{
            course_id: string;
            lessons: number[];
            completed_at: string | null;
        }[]>('/enrollments'), platformApi<{
            id: string;
            data: {
                title: string;
                category?: string;
                lessons?: unknown[];
            };
        }[]>('/records/courses')]).then(([list, courses]) => { if (active)
        setEnrolled(list.flatMap(e => { const c = courses.find(x => x.id === e.course_id); return c ? [{ id: c.id, title: c.data.title, detail: c.data.category || 'Course', status: e.completed_at ? 'Completed' : 'In progress', value: `${new Set(e.lessons).size}/${c.data.lessons?.length ?? 0} modules`, to: `/academy/${c.id}` }] : []; })); }).catch(() => { }); return () => { active = false; }; }, [admin, live]);
    const courses = state.courses.filter(c => admin || c.ownerId === profile.id);
    const own = state.enrollments.filter(e => e.memberId === profile.id);
    const teaching = state.enrollments.filter(e => courses.some(c => c.id === e.courseId));
    const activities = state.activities.filter(a => admin || profile.managedClubIds.includes(a.clubId));
    const members = state.profiles.filter(p => p.membership === 'Approved' && (admin || p.clubIds.some(id => profile.managedClubIds.includes(id))));
    const schoolMembers = state.schoolRecords.members.filter(m => m.schoolId === profile.schoolId);
    const requests = state.schoolRecords.requests.filter(r => admin || r.schoolId === profile.schoolId);
    const pending = requests.filter(r => r.status === 'Submitted');
    const title = admin ? 'Platform overview' : trainer ? 'Teaching overview' : coordinator ? 'School overview' : leader ? 'Club leadership overview' : 'My learning journey';
    const description = admin ? 'Monitor learning, communities, and opportunities across PLP.' : trainer ? 'Create courses, support learners, and review their assignments.' : coordinator ? `${demoSchools.find(s => s.id === profile.schoolId)?.name ?? 'School not assigned'} · Manage your register and school achievement requests.` : leader ? 'Manage your assigned clubs, record participation, and submit reports.' : 'Discover your strengths. Build skills. Put them into practice.';
    let stats: [
        string,
        string | number,
        LucideIcon
    ][];
    let rows: Row[];
    let tableTitle: string;
    let chart: {
        name: string;
        value: number;
    }[];
    let chartTitle: string;
    let action: {
        to: string;
        label: string;
    };
    if (admin) {
        stats = [['Members', figure(ad?.members), Users], ['Schools', figure(ad?.schools), Globe], ['Courses completed', figure(ad?.coursesCompleted), BookOpen], ['Open opportunities', figure(ad?.openOpportunities), BriefcaseBusiness]];
        chart = ad?.pathways ?? [];
        chartTitle = 'Course completions by learning pathway';
        rows = (ad?.tasks ?? []).map(t => ({ id: t.id, title: t.title, detail: t.detail, status: t.status, value: t.value, to: t.link }));
        tableTitle = 'Tasks requiring attention';
        action = { to: '/hub-analytics', label: 'View impact analytics' };
    }
    else if (trainer) {
        stats = [['Assigned courses', courses.length, BookOpen], ['Enrolled learners', new Set(teaching.map(e => e.memberId)).size, Users], ['Assignments submitted', teaching.filter(e => e.assignment).length, Clock3], ['Courses completed', teaching.filter(e => e.completedAt).length, Award]];
        chart = courses.map(c => ({ name: c.title, value: teaching.filter(e => e.courseId === c.id).length }));
        chartTitle = 'Learners by course';
        rows = courses.map(c => ({ id: c.id, title: c.title, detail: c.category, status: c.published ? 'Published' : 'Draft', value: `${teaching.filter(e => e.courseId === c.id && e.assignment).length} assignments`, to: '/studio' }));
        tableTitle = 'Your teaching portfolio';
        action = { to: '/studio', label: 'Open trainer studio' };
    }
    else if (coordinator) {
        stats = [['School members', schoolMembers.length, Users], ['Submitted batches', pending.length, Clock3], ['Returned for correction', requests.filter(r => r.status === 'Returned').length, BookOpen], ['Issued certificates', requests.filter(r => r.status === 'Issued').reduce((n, r) => n + r.members.length, 0), Award]];
        chart = ['Submitted', 'Returned', 'Issued'].map(name => ({ name, value: requests.filter(r => r.status === name).length }));
        chartTitle = 'School certificate requests';
        rows = requests.map(r => ({ id: r.id, title: r.programme, detail: `Completed ${r.completed}`, status: r.status, value: `${r.members.length} recipients`, to: '/certificate-centre' }));
        tableTitle = 'School achievement requests';
        action = { to: '/school-members', label: 'Manage school members' };
    }
    else if (leader) {
        stats = [['Assigned clubs', profile.managedClubIds.length, Globe], ['Club members', members.length, Users], ['Activities', activities.length, BookOpen], ['Reports to submit', activities.filter(a => a.status === 'Draft').length, Clock3]];
        chart = ['Meeting', 'Volunteering', 'Challenge', 'Recruitment'].map(name => ({ name, value: activities.filter(a => a.type === name).reduce((n, a) => n + a.attendees.length, 0) }));
        chartTitle = 'Participation by activity';
        rows = activities.map(a => ({ id: a.id, title: a.title, detail: clubs.find(c => c.id === a.clubId)?.name ?? 'Club', status: a.status, value: `${a.attendees.length} attendees`, to: '/clubs' }));
        tableTitle = 'Activities & reports';
        action = { to: '/clubs', label: 'Manage clubs' };
    }
    else {
        // Built-in academy courses are tracked in this browser; platform courses on the server. Both count.
        const localActive = own.filter(e => !e.completedAt).length, localDone = own.filter(e => e.completedAt);
        stats = [['Courses in progress', me ? figure(me.coursesInProgress + localActive) : '—', BookOpen], ['Courses completed', me ? figure(me.coursesCompleted + localDone.length) : '—', Award], ['PLP credits', figure(balance(state, profile.id)), Coins], ['Activities attended', figure(me?.activitiesAttended), Globe]];
        const byPathway = new Map((me?.pathways ?? []).map(p => [p.name, p.value]));
        for (const e of localDone) {
            const c = state.courses.find(c => c.id === e.courseId);
            if (c)
                byPathway.set(c.category, (byPathway.get(c.category) ?? 0) + 1);
        }
        chart = [...byPathway].map(([name, value]) => ({ name: name.replace(' Development', '').replace(' Skills', '').replace('Civic & Peace Leadership', 'Peace leadership'), value }));
        chartTitle = 'My completed learning pathways';
        rows = [...enrolled, ...own.flatMap(e => { const c = state.courses.find(c => c.id === e.courseId); return c && !enrolled.some(r => r.id === c.id) ? [{ id: c.id, title: c.title, detail: c.category, status: e.completedAt ? 'Completed' : 'In progress', value: `${new Set(e.lessons).size}/${c.lessons.length} lessons`, to: `/academy/${c.id}` }] : []; })];
        tableTitle = 'Continue learning';
        action = { to: '/academy', label: 'Explore learning academy' };
    }
    const visible = rows.filter(r => `${r.title} ${r.detail} ${r.status}`.toLowerCase().includes(query.toLowerCase()));
    const shortcuts = admin ? [['Published courses', 'Courses trainers have published to the academy', '/studio'], ['Members & staff', 'Account access and assigned responsibilities', '/memberships'], ['Reports & analysis', 'School and community activity reports', '/hub-analytics']] : trainer ? [['Assignments', 'Read work submitted by your learners', '/studio?tab=Assignments'], ['Course authoring', 'Lessons, assignments, and assessments', '/studio'], ['My profile', 'Keep your trainer details up to date', '/passport']] : coordinator ? [['School register', 'Add students individually or as a group', '/school-members'], ['Certificate requests', 'Submit evidence and download approved batches', '/certificate-centre'], ['Learning academy', 'Explore the programmes available to students', '/academy']] : leader ? [['Club workspace', 'Members, attendance, activities, and reports', '/clubs'], ['Club invitations', 'Invite people into your assigned communities', '/memberships'], ['My learning', 'Continue your own development', '/academy']] : [['ALX learning zone', 'Explore external programmes and record progress', '/alx'], ['Opportunity centre', 'Internships, jobs, scholarships, and more', '/opportunities'], ['Digital youth passport', 'Skills, achievements, and your development record', '/passport']];
    return <div className="ws-page ws-overview"><header className="ws-page-header"><div><p className="ws-kicker">{translateUi("DISCOVER & DEVELOP \u00B7 ")}{translateUi(profile.role)}</p><h1>{translateUi(title)}</h1><p>{translateUi(description)}</p></div><Link className="hub-button" to={action.to}>{translateUi(action.label)}<ArrowUpRight size={16}/></Link></header>
 {translateUi(profile.requestedRole && <p className="hub-feedback">{translateUi("You requested ")}{translateUi(profile.requestedRole)}{translateUi(" access. Your member account is active; PLP must verify your staff assignment before staff tools become available.")}</p>)}
 {translateUi(admin ? <AdminCharts ad={ad}/> : <div className="ws-stats">{translateUi(stats.map(([label, value, icon]) => <StatCard key={label} label={translateUi(label)} value={String(value)} icon={icon}/>))}</div>)}
 {translateUi(!admin && !trainer && !coordinator && !leader && <CommunityDiscovery compact/>)}
 <div className="ws-shortcuts">{translateUi(shortcuts.map(([label, detail, to]) => <Link to={to} key={to}><strong>{translateUi(label)}<ArrowUpRight size={16}/></strong><span>{translateUi(detail)}</span></Link>))}</div>
 {translateUi(!admin && <Panel><div className="ws-panel-title"><h2>{translateUi(chartTitle)}</h2><span className="ws-pill">{translateUi("Current records")}</span></div>{translateUi(chart.every(c => !c.value) ? <Empty>{translateUi("No ")}{translateUi(trainer ? 'enrolments' : leader ? 'attendance' : coordinator ? 'requests' : 'completions')}{translateUi(" recorded yet. This chart fills in as activity is recorded.")}</Empty> : <div className="ws-chart" role="img" aria-label={translateUi(chart.map(c => `${c.name}: ${c.value}`).join(', '))}><ResponsiveContainer width="100%" height={230}><BarChart data={chart}><CartesianGrid vertical={false} stroke="#eef0f4"/><XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={0}/><YAxis allowDecimals={false} width={30} axisLine={false} tickLine={false}/><Tooltip /><Bar dataKey="value" name={trainer ? 'Enrolments' : leader ? 'Attendances' : coordinator ? 'Requests' : 'Completions'} fill="#659fe8" maxBarSize={64} radius={[4, 4, 0, 0]}/></BarChart></ResponsiveContainer></div>)}</Panel>)}
 <Panel><div className="ws-panel-title"><h2>{translateUi(tableTitle)} <span className="ws-count">{translateUi(rows.length)}</span></h2></div><div className="ws-table-tools"><input aria-label={translateUi("Search {p0}", { p0: translateUi(tableTitle.toLowerCase()) })} placeholder={translateUi("Search by name or status\u2026")} value={query} onChange={e => setQuery(e.target.value)}/></div>{translateUi(visible.length ? <div className="ws-table-wrap"><table className="ws-table"><thead><tr><th>{translateUi("Name")}</th><th>{translateUi("Status")}</th><th>{translateUi("Details")}</th><th>{translateUi("Action")}</th></tr></thead><tbody>{translateUi(visible.map(r => <tr key={r.id}><td><strong>{translateUi(r.title)}</strong><small>{translateUi(r.detail)}</small></td><td>{translateUi(r.status)}</td><td>{translateUi(r.value)}</td><td><Link className="hub-text-link" to={r.to}>{translateUi("Open \u2192")}</Link></td></tr>))}</tbody></table></div> : <Empty>{translateUi(query ? 'No records match your search.' : admin ? 'You are up to date. New review tasks will appear here.' : trainer ? 'Create your first course in the trainer studio.' : leader ? 'Your assigned club activities will appear here.' : coordinator ? 'No school requests yet. Start with your school register.' : 'No courses started yet. Choose a course in the Learning Academy.')}</Empty>)}</Panel>
 </div>;
}
// Members is a running total, so its sparkline shows growth: the total at the end of each month.
const growth = (joined: number[], total = 0) => { let n = total - joined.reduce((a, b) => a + b, 0); return joined.map(j => (n += j)); };
/** Administrator overview: headline figures, then attendance, activity mix, schools, credits, learning and mentoring. */
function AdminCharts({ ad }: {
    ad: AdminOverview | null;
}) {
    useSiteLanguage();
    return <>
  <div className="dv-grid kpis">
   <KpiTile label={translateUi("Members")} value={ad ? ad.members : '—'} icon={Users} spark={growth(series(ad?.trend, 'members'), ad?.members)} change={ad?.change.members}/>
   <KpiTile label={translateUi("Activities held")} value={ad ? ad.activities - ad.upcomingActivities : '—'} icon={CalendarDays} spark={series(ad?.trend, 'activities')} note={ad ? `${ad.upcomingActivities} more coming up` : undefined}/>
   <KpiTile label={translateUi("Attendance recorded")} value={ad ? ad.attendance : '—'} icon={UserCheck} spark={series(ad?.trend, 'attendance')} note={ad ? `${ad.reportsSubmitted} activity reports` : undefined}/>
   <KpiTile label={translateUi("Credits awarded")} value={ad ? ad.creditsAwarded : '—'} icon={Coins} spark={series(ad?.trend, 'credits')} change={ad?.change.credits}/>
  </div>
  <div className="dv-grid wide">
   <TrendCard title={translateUi("Attendance per month")} data={ad?.trend ?? []} dataKey="attendance" unit="attendances"/>
   <ShareCard title={translateUi("Activities by type")} rows={ad?.activityTypes ?? []} unit="activities" empty="Activity types appear once schools publish activities."/>
  </div>
  <div className="dv-grid halves">
   <RankCard title={translateUi("Schools by attendance")} caption="People recorded at each school's activities" rows={(ad?.topSchools ?? []).map(s => ({ name: s.name, value: s.attendance, detail: `${s.activities} activit${s.activities === 1 ? 'y' : 'ies'}` }))} unit="attended" empty="Schools appear here once they record attendance."/>
   <TrendCard title={translateUi("Credits awarded")} data={ad?.trend ?? []} dataKey="credits" unit="credits" columns/>
  </div>
  <div className="dv-grid halves">
   <TrendCard title={translateUi("Course completions")} data={ad?.trend ?? []} dataKey="completions" unit="completions" columns/>
   <ShareCard title={translateUi("Mentoring sessions")} rows={ad?.mentoring ?? []} unit="sessions" empty="Mentoring sessions appear once members book them."/>
  </div>
 </>;
}
