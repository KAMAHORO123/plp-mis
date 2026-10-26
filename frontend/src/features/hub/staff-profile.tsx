import { useEffect, useState } from 'react';
import { useLiveTick } from './live';
import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen, CalendarDays, CheckCircle2, ClipboardCheck, ClipboardList, FileText, GraduationCap, IdCard, Inbox, LayoutGrid, Mail, PencilLine, School, UserCheck, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useHub, today } from './store';
import { Field } from './ui';
import { FormModal } from './modal';
import { platformApi } from './platform-api';
import { hostName } from './school-operations';
import { ProfileCard, ProfilePanel, type ProfileStat } from './profile-card';
import { useOverview, figure, type AdminOverview } from './reports';
import type { TeachingData } from './teaching-types';

type Course = { id: string; owner_id: string; data: TeachingData };

/** "My profile" for administrators, trainers, mentors and club leaders: the same card and panels as the youth passport, with role-specific figures. */
export function StaffProfilePage() {
  const { state, profile, update } = useHub();
  const [edit, setEdit] = useState(false);
  const [me, setMe] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const overview = useOverview<AdminOverview>();
  const role = profile.role;
  const live = useLiveTick();
  useEffect(() => {
    platformApi<{ id: string }>('/me').then((m) => setMe(m.id)).catch(() => {});
    if (role === 'Trainer') platformApi<Course[]>('/records/courses').then(setCourses).catch(() => {});
  }, [role, live]);

  const acts = state.operations.activities;
  const mine = courses.filter((c) => c.owner_id === me);
  const sessions = state.sessions.filter((s) => s.mentorId === me);
  const mentorCard = state.mentors.find((m) => m.id === me);
  const schoolActs = acts.filter((a) => a.hostId === profile.schoolId);

  let subtitle = '';
  let stats: ProfileStat[] = [];
  let links: [string, string][] = [];
  let focus = <></>;
  if (role === 'Administrator') {
    subtitle = 'PLP administration';
    stats = [
      { label: 'Accounts', value: overview ? figure(overview.members + overview.staff) : '—', icon: Users },
      { label: 'Awaiting approval', value: figure(overview?.pendingAccounts), icon: UserCheck },
      { label: 'Schools', value: figure(overview?.schools), icon: School },
      { label: 'Reports submitted', value: figure(overview?.reportsSubmitted), icon: ClipboardCheck },
    ];
    links = [['/memberships', 'Members & staff'], ['/clubs?view=reports', 'Activity reports'], ['/studio', 'Published courses'], ['/certificate-centre', 'School certificates']];
    focus = <List empty="Reports appear here as club leaders submit them." items={acts.filter((a) => a.report).sort((x, y) => y.date.localeCompare(x.date)).slice(0, 5).map((a) => [a.title, hostName(a.hostId)])} />;
  } else if (role === 'Trainer') {
    subtitle = profile.community ? `Trainer · ${profile.community}` : 'PLP trainer';
    stats = [
      { label: 'Courses created', value: mine.length, icon: BookOpen },
      { label: 'Published', value: mine.filter((c) => c.data.published).length, icon: CheckCircle2 },
      { label: 'Drafts', value: mine.filter((c) => !c.data.published).length, icon: Inbox },
      { label: 'Modules written', value: mine.reduce((n, c) => n + (c.data.lessons?.length ?? 0), 0), icon: GraduationCap },
    ];
    links = [['/studio', 'Course studio'], ['/academy', 'Learning academy']];
    focus = <List empty="Courses you create in the studio appear here." items={mine.slice(0, 5).map((c) => [c.data.title || 'Untitled course', c.data.published ? 'Published' : 'Draft'])} />;
  } else if (role === 'Mentor') {
    subtitle = mentorCard ? `${mentorCard.title} · ${mentorCard.area}` : 'PLP mentor';
    stats = [
      { label: 'New requests', value: sessions.filter((s) => s.status === 'Requested').length, icon: Inbox },
      { label: 'Upcoming sessions', value: sessions.filter((s) => s.status === 'Confirmed').length, icon: CalendarDays },
      { label: 'Sessions completed', value: sessions.filter((s) => s.status === 'Completed').length, icon: CheckCircle2 },
      { label: 'Mentees supported', value: new Set(sessions.filter((s) => s.status !== 'Declined').map((s) => s.memberId)).size, icon: Users },
    ];
    links = [['/hub', 'Mentor dashboard'], ['/academy', 'Learning academy']];
    focus = <List empty="Confirmed sessions appear here." items={sessions.filter((s) => s.status === 'Confirmed').sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5).map((s) => [state.profiles.find((p) => p.id === s.memberId)?.name ?? 'Mentee', new Date(s.date).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })])} />;
  } else {
    subtitle = profile.schoolId ? hostName(profile.schoolId) : 'Awaiting school assignment';
    stats = [
      { label: 'School members', value: state.schoolRecords.members.filter((m) => m.schoolId === profile.schoolId).length, icon: Users },
      { label: 'Activities', value: schoolActs.length, icon: CalendarDays },
      { label: 'Reports submitted', value: schoolActs.filter((a) => a.report).length, icon: FileText },
      { label: 'Materials completed', value: state.operations.completions.filter((c) => c.schoolId === profile.schoolId).length, icon: BookOpen },
    ];
    links = [['/school-members', 'Member register'], ['/clubs', 'Activities & reports'], ['/learning-materials', 'Learning materials'], ['/certificate-centre', 'Membership certificates']];
    focus = <List empty="Upcoming school activities appear here." items={schoolActs.filter((a) => a.date >= today()).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5).map((a) => [a.title, a.date])} />;
  }
  const focusTitle = { Administrator: 'Recent activity reports', Trainer: 'My courses', Mentor: 'Upcoming sessions' }[role as string] ?? 'Upcoming activities';

  return (
    <div className="ws-page pv-page">
      <ProfileCard
        kicker="PLP STAFF PROFILE"
        subtitle={subtitle}
        bio={profile.bio || mentorCard?.bio}
        actions={<>
          <button className="hub-button secondary" onClick={() => setEdit(true)}><PencilLine size={16} /> Edit profile</button>
          {links[0] && <Link className="hub-button" to={links[0][0]}><LayoutGrid size={16} /> {links[0][1]}</Link>}
        </>}
        stats={stats}
      />
      {edit && (
        <FormModal title="Edit your profile" description={role === 'Mentor' ? 'Your mentor title, area and availability are edited from the mentor dashboard.' : 'Shown on your profile.'} onClose={() => setEdit(false)}>
          <form className="hub-form" onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            if (update((s) => { const p = s.profiles.find((x) => x.id === profile.id)!; p.name = String(f.get('name')).trim(); p.bio = String(f.get('bio')).trim(); if (role === 'Trainer') p.community = String(f.get('community')).trim(); })) { setEdit(false); toast.success('Profile updated'); }
          }}>
            <Field label="Full name"><input name="name" required minLength={2} maxLength={100} pattern=".*\S.*" defaultValue={profile.name} /></Field>
            <Field label="Short bio"><textarea name="bio" maxLength={1000} defaultValue={profile.bio} /></Field>
            {role === 'Trainer' && <Field label="Community"><input name="community" maxLength={100} defaultValue={profile.community ?? ''} /></Field>}
            <div className="hub-actions hub-dialog-actions"><button type="button" className="hub-button secondary" onClick={() => setEdit(false)}>Cancel</button><button className="hub-button">Save profile</button></div>
          </form>
        </FormModal>
      )}
      <div className="pv-grid">
        <ProfilePanel icon={IdCard} title="Account details">
          <ul className="pv-list">
            <li><span><Mail size={13} /> Email</span><small>{profile.email}</small></li>
            <li><span>Role</span><small>{role}</small></li>
            {role === 'Club leader' && <li><span>School</span><small>{subtitle}</small></li>}
            {role === 'Trainer' && <li><span>Community</span><small>{profile.community || '—'}</small></li>}
            {role === 'Mentor' && <li><span>Taking requests</span><small>{mentorCard?.accepting === false ? 'Paused' : 'Yes'}</small></li>}
          </ul>
        </ProfilePanel>
        <ProfilePanel icon={ClipboardList} title={focusTitle}>{focus}</ProfilePanel>
        <ProfilePanel icon={LayoutGrid} title="Quick links">
          <ul className="pv-list pv-links">{links.map(([to, label]) => <li key={to}><Link to={to}>{label}<ArrowUpRight size={14} /></Link></li>)}</ul>
        </ProfilePanel>
      </div>
    </div>
  );
}

function List({ items, empty }: { items: [string, string][]; empty: string }) {
  return items.length ? <ul className="pv-list">{items.map(([a, b], i) => <li key={i}><span>{a}</span><small>{b}</small></li>)}</ul> : <p className="pv-empty">{empty}</p>;
}
