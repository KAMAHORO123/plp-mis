import { RecordTable, usePaged, Pager } from "./management-ui";
import "./sessions.css";
import { translateUi, useSiteLanguage } from '../../i18n/language';
import { platformApi } from "./platform-api";
import { useLiveTick } from './live';
import { isPlatformId } from "./platform-course";
import { certificateReference } from "./certificate-id";
import { downloadCertificatePDF, certificateFileName, courseCertificateDesign, issuedCertificateDesign, type IssuedCertificate } from './certificate-pdf';
import { CertificateCard, CertificateSummary } from './certificate-card';
import { downloadPassportPDF } from './passport-pdf';
import { ProfileCard, ProfilePanel } from './profile-card';
import { useOverview, figure, type MemberOverview } from './reports';
import { FormModal } from './modal';
import { confirmAction } from "@/components/shared/confirm-dialog";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Award, BookOpen, Clock3, Coins, Download, Fingerprint, Plus, PencilLine, Flag, Users } from "lucide-react";
import { toast } from "sonner";
import { clubs, mentors } from "./data";
import { useHub, balance, type HubCertificate } from "./store";
import { Empty, Field, Heading, Panel, Progress, Stats, Tag, TextLink, } from "./ui";

// Where a member is in their studies, saved on the platform so it follows them to every device.
type Stage = "high-school" | "university" | "graduated" | "community";
interface Education { education_stage: Stage; institution: string; graduation_year: number | null; school_id: string | null }
const stageLabels: Record<Stage, string> = { "high-school": "High school student", university: "University student", graduated: "Graduated", community: "Community member" };

export function JourneyPage() {
    useSiteLanguage();
    const { state, profile } = useHub();
    const enrollments = state.enrollments.filter((e) => e.memberId === profile.id);
    const completed = enrollments.filter((e) => e.completedAt);
    return (<>
      <Heading eyebrow="YOUR SPACE TO GROW" title={translateUi("Welcome, {p0}.", { p0: translateUi(profile.name.split(" ")[0]) })} description={translateUi("You don’t need to have it all figured out. Just take the next step.")} action={<Link to="/passport" className="hub-button secondary">
            <Fingerprint size={18}/>{translateUi(" My youth passport ")}</Link>}/>
      <div className="hub-journey-banner">
        <div>
          <Tag>{translateUi("Stage 01 · Discover & Develop")}</Tag>
          <h2>{translateUi("Your next chapter starts with learning.")}</h2>
          <p>{translateUi(" Build your skills, meet your community, and turn curiosity into action. ")}</p>
          <Link to="/academy" className="hub-button">{translateUi(" Find your next course ")}<ArrowRight size={17}/>
          </Link>
        </div>
        <BookOpen size={100}/>
      </div>
      <Stats items={[
            { label: "Courses completed", value: completed.length },
            {
                label: "Certificates earned",
                value: state.certificates.filter((c) => c.memberId === profile.id)
                    .length,
            },
            { label: "PLP credits", value: balance(state, profile.id) },
            { label: "Communities joined", value: profile.clubIds.length },
        ]}/>
      <div className="hub-row hub-section-title">
        <h2>{translateUi("Keep your momentum")}</h2>
        <TextLink to="/academy">{translateUi("All courses")}</TextLink>
      </div>
      <div className="hub-grid two">
        {translateUi(enrollments
            .filter((e) => !e.completedAt)
            .map((e) => {
            const c = state.courses.find((c) => c.id === e.courseId)!;
            return (<Panel key={c.id}>
                <Tag>{translateUi(c.category)}</Tag>
                <h2>{translateUi(c.title)}</h2>
                <Progress value={Math.round((e.lessons.length / (c.lessons.length + 1)) * 100)}/>
                <TextLink to={`/academy/${c.id}`}>{translateUi("Continue learning")}</TextLink>
              </Panel>);
        }))}
      </div>
      {translateUi(!enrollments.some((e) => !e.completedAt) && (<Empty>{translateUi(" Ready for a new skill?")}{translateUi(" ")}
          <TextLink to="/academy">{translateUi("Explore the learning academy")}</TextLink>
        </Empty>))}
      <div className="hub-grid two hub-space">
        <Panel>
          <h2>{translateUi("Your mentoring sessions")}</h2>
          {translateUi(state.sessions.filter((s) => s.memberId === profile.id && s.status === "Requested").length ? (state.sessions
            .filter((s) => s.memberId === profile.id && s.status === "Requested")
            .slice()
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 3)
            .map((s) => (<div className="hub-list-row" key={s.id}>
                  <div>
                    <strong>
                      {translateUi(mentors.find((m) => m.id === s.mentorId)?.name)}
                    </strong>
                    <p className="hub-caption">
                      {translateUi(new Date(s.date).toLocaleString())}
                    </p>
                  </div>
                  <Tag>{translateUi("Requested")}</Tag>
                </div>))) : (<p>{translateUi("No sessions scheduled yet.")}</p>))}
          <TextLink to="/mentorship">{translateUi("View mentoring")}</TextLink>
        </Panel>
        <Panel>
          <h2>{translateUi("Updates from your clubs")}</h2>
          {translateUi(state.activities.filter((a) => profile.clubIds.includes(a.clubId))
            .length ? (state.activities
            .filter((a) => profile.clubIds.includes(a.clubId))
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 3)
            .map((a) => (<div className="hub-list-row" key={a.id}>
                  <div>
                    <strong>{translateUi(a.title)}</strong>
                    <p className="hub-caption">
                      {translateUi(clubs.find((c) => c.id === a.clubId)?.name)}{translateUi(" · ")}{translateUi(a.date)}
                    </p>
                  </div>
                  <Tag>{translateUi(a.type)}</Tag>
                </div>))) : (<p>{translateUi("Join a community to see its activities here.")}</p>))}
          <TextLink to="/clubs">{translateUi("Visit my communities")}</TextLink>
        </Panel>
      </div>
      <h2 className="hub-section-title">{translateUi("Make space for what’s next")}</h2>
      <div className="hub-grid three">
        {translateUi([
            {
                title: "Find your people",
                text: "A club or homegroup is a great place to begin.",
                to: "/clubs",
                icon: Plus,
            },
            {
                title: "Ask a mentor",
                text: "A fresh perspective can help you take the next step.",
                to: "/mentorship",
                icon: Award,
            },
            {
                title: "Put skills into action",
                text: "Discover practical opportunities through PLP Connect.",
                to: "/opportunities",
                icon: Coins,
            },
        ].map((x) => (<Panel key={x.to}>
            <x.icon className="hub-feature-icon"/>
            <h3>{translateUi(x.title)}</h3>
            <p>{translateUi(x.text)}</p>
            <TextLink to={x.to}>{translateUi("Explore")}</TextLink>
          </Panel>)))}
      </div>
    </>);
}
export function PassportPage() {
    useSiteLanguage();
    const { state, profile, update } = useHub();
    const live = useLiveTick();
    const [serverCerts, setServerCerts] = useState<{
        id: string;
        kind: string;
        revoked_at: string | null;
    }[]>([]);
    const [education, setEducation] = useState<Education | null>(null);
    const [stage, setStage] = useState<Stage>("community");
    const [edit, setEdit] = useState(false);
    useEffect(() => { platformApi<{
        id: string;
        kind: string;
        revoked_at: string | null;
    }[]>("/certificates").then((rows) => setServerCerts(rows.filter((r) => !r.revoked_at))).catch(() => { }); }, [profile.id, live]);
    useEffect(() => { platformApi<Education>("/me").then((me) => { setEducation(me); setStage(me.education_stage); }).catch(() => { }); }, [profile.id]);
    const schoolAchievements = state.schoolRecords.requests.filter(r => r.status === 'Issued').flatMap(r => r.members.filter(m => m.email && m.email.toLowerCase() === profile.email.toLowerCase()).map(m => ({ id: `${r.id}/${m.id}`, title: r.programme, name: m.name, issued: r.issued, completed: r.completed, schoolId: r.schoolId, verifyUrl: `/certificate-check/${r.id}/${m.id}` })));
    const enrollments = state.enrollments.filter((e) => e.memberId === profile.id);
    const overview = useOverview<MemberOverview>();
    const volunteerHours = overview?.volunteerHours ?? 0;
    const downloadPassport = async () => {
        try {
            const issued = await platformApi<{
                id: string;
                programme: string;
                issued_at: string;
                revoked_at: string | null;
                kind: string;
            }[]>("/certificates").catch(() => []);
            const local = state.certificates.filter((c) => c.memberId === profile.id && !issued.some((r) => r.id === c.id));
            await downloadPassportPDF({
                name: profile.name, email: profile.email, role: profile.role, joined: profile.joined, bio: profile.bio, photo: profile.avatarUrl,
                skills: profile.skills, leadership: profile.leadership,
                communities: clubs.filter((c) => profile.clubIds.includes(c.id)).map((c) => c.name),
                credits: balance(state, profile.id), volunteerHours,
                coursesInProgress: enrollments.filter((e) => !e.completedAt).map((e) => state.courses.find((c) => c.id === e.courseId)?.title).filter((t): t is string => !!t),
                achievements: [
                    ...issued.filter((r) => !r.revoked_at).map((r) => ({ title: r.programme, kind: r.kind === "school" ? "School membership certificate" : "Course certificate", date: r.issued_at.slice(0, 10), reference: certificateReference(r.id) })),
                    ...local.map((c) => ({ title: c.title, kind: "Course certificate", date: c.date, reference: c.id })),
                    ...schoolAchievements.filter(() => !issued.some((r) => r.kind === "school")).map((a) => ({ title: a.title, kind: "School membership certificate", date: a.issued ?? "", reference: a.id })),
                ],
            });
        }
        catch {
            toast.error(translateUi("The passport PDF could not be created. Try again."));
        }
    };
    const localCertificates = state.certificates.filter((c) => c.memberId === profile.id && !serverCerts.some((r) => r.id === c.id)).length;
    const courses = overview ? figure(overview.coursesCompleted + enrollments.filter((e) => e.completedAt).length) : "—";
    const certificates = overview ? figure(overview.certificates + localCertificates) : "—";
    return (<div className="ws-page pv-page">
      <ProfileCard kicker="PLP DIGITAL YOUTH PASSPORT" bio={profile.bio || "Add a short bio so mentors and communities know what you care about."} actions={<>
          <button className="hub-button secondary" onClick={() => setEdit(true)}><PencilLine size={16}/>{translateUi(" Edit profile")}</button>
          <button className="hub-button" onClick={downloadPassport}><Download size={16}/>{translateUi(" Download PDF")}</button>
        </>} stats={[{ label: "Courses completed", value: courses, icon: BookOpen }, { label: "Certificates", value: certificates, icon: Award }, { label: "Verified credits", value: figure(balance(state, profile.id)), icon: Coins }, { label: "Volunteer hours", value: overview ? figure(volunteerHours) : "—", icon: Clock3 }]}/>
      {translateUi(edit && (<FormModal title={translateUi("Edit your passport")} description={translateUi("Shown on your youth passport and in the PDF you download.")} onClose={() => setEdit(false)}>
          <form key={profile.id} className="hub-form" onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const year = String(f.get("graduationYear") ?? "").trim();
                const name = String(f.get("name")).trim();
                const leavingSchool = !!education?.school_id && stage !== "high-school";
                if (leavingSchool && !await confirmAction({ title: translateUi("Leave your school's register?"), description: translateUi("Your school's club leaders will no longer manage your membership. Your certificates, credits and activity history stay with you."), confirmLabel: translateUi("Save and continue") }))
                    return;
                try {
                    const list = (key: string) => String(f.get(key) ?? "").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 20);
                    const saved = await platformApi<Education>("/me/profile", "PUT", { name, education_stage: stage, institution: String(f.get("institution") ?? "").trim(), graduation_year: year ? Number(year) : null, bio: String(f.get("bio") ?? "").trim(), skills: list("skills"), leadership: list("leadership") });
                    setEducation(saved);
                }
                catch (err) {
                    return toast.error(translateUi((err as Error).message));
                }
                if (update((s) => {
                    const p = s.profiles.find((p) => p.id === profile.id)!;
                    p.name = name;
                    p.bio = String(f.get("bio"));
                    p.skills = String(f.get("skills"))
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean);
                    p.leadership = String(f.get("leadership"))
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean);
                    p.memberCategory = stage === "high-school" ? "High school" : stage === "university" ? "University" : "Community";
                    if (leavingSchool) p.schoolId = undefined;
                })) {
                    setEdit(false);
                    toast.success(translateUi(leavingSchool ? "Congratulations on graduating! Your profile is updated." : "Passport updated"));
                }
            }}>
            <Field label={translateUi("Name")}>
              <input name="name" required pattern=".*\S.*" maxLength={80} defaultValue={profile.name}/>
            </Field>
            <Field label={translateUi("About you")}>
              <textarea name="bio" maxLength={500} defaultValue={profile.bio}/>
            </Field>
            <Field label={translateUi("Skills (comma separated)")}>
              <input name="skills" maxLength={500} defaultValue={profile.skills.join(", ")}/>
            </Field>
            <Field label={translateUi("Leadership roles (comma separated)")}>
              <input name="leadership" maxLength={500} defaultValue={profile.leadership.join(", ")}/>
            </Field>
            <Field label={translateUi("Where are you now?")}>
              <select value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
                {(Object.keys(stageLabels) as Stage[]).map((k) => <option key={k} value={k}>{translateUi(stageLabels[k])}</option>)}
              </select>
            </Field>
            {stage !== "community" && <div className="ws-form-grid">
              <Field label={translateUi(stage === "high-school" ? "School" : stage === "university" ? "University or college" : "Where you studied")}>
                <input name="institution" maxLength={120} defaultValue={education?.institution ?? ""}/>
              </Field>
              <Field label={translateUi(stage === "graduated" ? "Year you graduated" : "Expected graduation year")}>
                <input name="graduationYear" type="number" min={1990} max={new Date().getFullYear() + 8} defaultValue={education?.graduation_year ?? ""} placeholder={String(new Date().getFullYear())}/>
              </Field>
            </div>}
            {education?.school_id && stage !== "high-school" && <p className="hub-feedback">{translateUi("Finished high school? Saving this moves you off your school's register. Your certificates, credits and activity history stay on your passport.")}</p>}
            <div className="hub-actions hub-dialog-actions">
              <button type="button" className="hub-button secondary" onClick={() => setEdit(false)}>{translateUi("Cancel")}</button>
              <button className="hub-button">{translateUi("Save profile")}</button>
            </div>
          </form>
        </FormModal>))}
      <div className="pv-grid">
        <ProfilePanel icon={BookOpen} title={translateUi("Skills")}>
          {translateUi(profile.skills.length
            ? <div className="pv-chips">{translateUi(profile.skills.map((s) => <span key={s}>{translateUi(s)}</span>))}</div>
            : <p className="pv-empty">{translateUi("Skills you add or earn from courses appear here.")}</p>)}
          <button className="hub-text-button" onClick={() => setEdit(true)}>{translateUi(profile.skills.length ? "Edit skills" : "Add skills")}</button>
        </ProfilePanel>
        <ProfilePanel icon={Flag} title={translateUi("Leadership")}>
          {translateUi(profile.leadership.length
            ? <ul className="pv-list">{translateUi(profile.leadership.map((r, i) => <li key={i}>{translateUi(r)}</li>))}</ul>
            : <p className="pv-empty">{translateUi("Roles you take on in clubs, schools and events appear here.")}</p>)}
          <TextLink to="/certificates">{translateUi("View my achievements")}</TextLink>
        </ProfilePanel>
        <ProfilePanel icon={Users} title={translateUi("Studies")}>
          <div className="pv-list">
            <span>{translateUi(education ? stageLabels[education.education_stage] : "—")}</span>
            {education?.institution && <span>{education.institution}</span>}
            {education?.graduation_year && <span>{translateUi(education.education_stage === "graduated" ? "Graduated" : "Expected to graduate")} {education.graduation_year}</span>}
          </div>
          <button className="hub-text-button" onClick={() => setEdit(true)}>{translateUi("Update studies")}</button>
        </ProfilePanel>
      </div>
    </div>);
}
export async function certificatePDF(c: HubCertificate) {
    await downloadCertificatePDF([courseCertificateDesign({ id: c.id, recipient: c.memberName, course: c.title, date: c.date })], certificateFileName(c.memberName, c.title));
}
export function CertificatesPage({ administration = false }: {
    administration?: boolean;
}) {
    useSiteLanguage();
    const { state, profile } = useHub();
    const [query, setQuery] = useState(''), [kind, setKind] = useState('All'), [year, setYear] = useState('All'), [order, setOrder] = useState('newest');
    const admin = administration && profile.role === 'Administrator';
    const [issued, setIssued] = useState<HubCertificate[]>([]);
    // The platform's own records, so each download uses the wording it was issued with.
    const [rows, setRows] = useState<IssuedCertificate[]>([]);
    useEffect(() => { let active = true; const load = () => platformApi<(IssuedCertificate & {
        revoked_at: string | null;
    })[]>("/certificates").then(rows => { if (active)
        setRows(rows); if (active)
        setIssued(rows.filter(r => !r.revoked_at).map(r => ({ id: r.id, memberId: profile.id, memberName: r.recipient, title: r.programme, courseId: r.kind === "school" ? "school" : r.id, date: r.issued_at.slice(0, 10) }))); }).catch(() => { }); void load(); window.addEventListener('plp:achievements-updated', load); return () => { active = false; window.removeEventListener('plp:achievements-updated', load); }; }, [profile.id]);
    const kindOf = (c: HubCertificate) => c.courseId === 'school' ? 'School membership' : 'Course';
    const mine = [...issued, ...state.certificates.filter(c => !issued.some(r => r.id === c.id))].filter(c => admin || c.memberId === profile.id);
    const years = [...new Set(mine.map(c => c.date.slice(0, 4)))].sort().reverse();
    const list = mine
        .filter(c => (kind === 'All' || kindOf(c) === kind) && (year === 'All' || c.date.startsWith(year)) && `${c.title} ${c.memberName} ${c.id}`.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => order === 'az' ? a.title.localeCompare(b.title) : order === 'oldest' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
    const filtering = !!query || kind !== 'All' || year !== 'All';
    const certificatePage = usePaged(list, 8, `${query}|${kind}|${year}|${order}`);
    return (<div className="hub-editorial-page hub-achievements-page">
      <Heading title={translateUi(admin ? "Issued course certificates" : "My achievements")} description={translateUi(admin ? "Manage issued course certificates." : "Your learning milestones, all in one place.")}/>
      <div className="hub-achievements-summary"><span><strong>{translateUi(list.length)}</strong> {translateUi(list.length === 1 ? "achievement" : "achievements")}</span><TextLink to="/certificate-centre">{translateUi("School certificates")}</TextLink></div>
      <div className="ws-table-tools cs-filters">
        <input aria-label={translateUi("Search certificates")} value={query} onChange={e => setQuery(e.target.value)} placeholder={translateUi(admin ? "Search recipient, programme, or certificate ID" : "Search by programme or certificate ID")}/>
        <select aria-label={translateUi("Certificate type")} value={kind} onChange={e => setKind(e.target.value)}>{['All', 'Course', 'School membership'].map(k => <option key={k} value={k}>{translateUi(k === 'All' ? 'Type: all' : k)}</option>)}</select>
        <select aria-label={translateUi("Year issued")} value={year} onChange={e => setYear(e.target.value)}><option value="All">{translateUi("Year: all")}</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
        <select aria-label={translateUi("Sort certificates")} value={order} onChange={e => setOrder(e.target.value)}><option value="newest">{translateUi("Newest first")}</option><option value="oldest">{translateUi("Oldest first")}</option><option value="az">{translateUi("A to Z")}</option></select>
        {filtering && <button type="button" className="hub-text-button" onClick={() => { setQuery(''); setKind('All'); setYear('All'); }}>{translateUi("Clear filters")}</button>}
        <span>{translateUi("{p0} of {p1}", { p0: list.length, p1: mine.length })}</span>
      </div>
      {translateUi(!list.length ? (<Empty>
          <Award size={32}/>
          <h2>{translateUi(filtering ? "No certificates match these filters." : admin ? "No issued course certificates match this view." : "Your first milestone is waiting.")}</h2>
          <p>{translateUi(" Complete a course\u2019s lessons, assignment, and assessment to earn a certificate. ")}</p>
          <TextLink to="/academy">{translateUi("Find a course")}</TextLink>
        </Empty>) : (<div className="cs-list">
          {translateUi(certificatePage.items.map((c) => {
                // Platform certificates carry their own wording; courses tracked in this browser use the course design.
                const raw = rows.find((r) => r.id === c.id);
                return <CertificateSummary key={c.id} design={raw ? issuedCertificateDesign(raw) : courseCertificateDesign({ id: c.id, recipient: c.memberName, course: c.title, date: c.date })} revoked={!!(raw as {
                    revoked_at?: string | null;
                } | undefined)?.revoked_at}/>;
            }))}
        </div>))}
      <Pager {...certificatePage}/>
    </div>);
}
function PlatformVerifyPage() {
    useSiteLanguage();
    const { id } = useParams();
    const [record, setRecord] = useState<{
        recipient: string;
        programme: string;
        issued_at: string;
        revoked_at: string | null;
        kind?: string;
        title?: string | null;
        citation?: string | null;
        role?: string | null;
        period_from?: string | null;
        period_to?: string | null;
        school?: string | null;
    } | null>(null), [error, setError] = useState('');
    useEffect(() => { platformApi<typeof record>(`/public/certificates/${id}`).then(setRecord).catch(e => setError(e.message)); }, [id]);
    // Anyone who scans the QR code sees the certificate itself, with its current status.
    return <div className="hub-section cv-page"><Heading title={translateUi("Certificate verification")} description={translateUi("Peace and Love Proclaimers")}/>{translateUi(record ? <>
  <p className={`cv-status ${record.revoked_at ? 'revoked' : ''}`}>{translateUi(record.revoked_at ? 'This certificate has been revoked and is no longer valid.' : `Verified: this certificate was issued by Peace and Love Proclaimers on ${record.issued_at.slice(0, 10)}.`)}</p>
  <CertificateCard actions={false} design={issuedCertificateDesign({ ...record, id: id!, kind: record.kind ?? (record.title ? 'school' : 'course') })}/>
 </> : <Panel><p>{translateUi(error || 'Checking certificate…')}</p></Panel>)}</div>;
}
export function VerifyPage() { useSiteLanguage(); const { id } = useParams(); return id && isPlatformId(id) ? <PlatformVerifyPage /> : <LocalVerifyPage />; }
function LocalVerifyPage() {
    useSiteLanguage();
    const { id } = useParams();
    const { state } = useHub();
    const c = state.certificates.find(c => certificateReference(c.id) === certificateReference(id || ""));
    return (<>
      <Heading title={translateUi("Certificate verification")} description={translateUi("Check a PLP course completion record.")}/>
      {translateUi(c ? (<Panel>
          <Award className="hub-feature-icon"/>
          <Tag>{translateUi("Record found")}</Tag>
          <h2>{translateUi(c.title)}</h2>
          <p>{translateUi(" Awarded to ")}{translateUi(c.memberName)}{translateUi(" on ")}{translateUi(c.date)}{translateUi(". ")}</p>
          <p className="hub-caption hub-break">{translateUi(c.id)}</p>
        </Panel>) : (<Empty>{translateUi(" No certificate was found with this ID. Check the link or QR code and try again. ")}</Empty>))}
    </>);
}
export function CreditsPage() {
    useSiteLanguage();
    const { state, profile, creditsLoading, creditsError } = useHub();
    const total = balance(state, profile.id);
    const ledger = state.credits.filter(c => c.memberId === profile.id).sort((a,b)=>b.date.localeCompare(a.date));
    const [from,setFrom] = useState(''), [to,setTo] = useState('');
    const shown = ledger.filter(c=>(!from||c.date.slice(0,10)>=from)&&(!to||c.date.slice(0,10)<=to));
    const month = new Date().toISOString().slice(0,7);
    const earned = ledger.filter(c=>c.amount>0&&c.date.startsWith(month)).reduce((n,c)=>n+c.amount,0);
    const sourceLabel = (source:string) => ({meeting:'Meeting',course:'Learning',event:'Activity',activity:'Activity'}[source.split(':')[0]] || 'Other');
    const sources = [...new Set(ledger.map(c=>sourceLabel(c.source)))];
    return <div className="ws-page credits-page">
      <Heading title={translateUi('My credits')} description={translateUi('A clear record of your participation and progress.')}/>
      <div className="credit-summary">
        <Panel className="credit-balance"><span className="credit-label"><Coins size={18}/>{translateUi('AVAILABLE BALANCE')}</span><strong>{creditsLoading?'…':creditsError?'—':total.toLocaleString()}</strong><span>{translateUi('PLP credits')}</span><small>{translateUi('Verified learning. Meaningful participation.')}</small></Panel>
        <Panel><span className="credit-label">{translateUi('EARNED THIS MONTH')}</span><strong className="credit-number">{creditsLoading?'…':creditsError?'—':`+${earned.toLocaleString()}`}</strong><p className="hub-caption">{translateUi('Keep showing up. Every contribution counts.')}</p></Panel>
        <Panel><span className="credit-label">{translateUi('VERIFIED RECORDS')}</span><strong className="credit-number">{creditsLoading?'…':creditsError?'—':ledger.length}</strong><p className="hub-caption">{translateUi('Your confirmed credit transactions.')}</p></Panel>
      </div>
      {creditsError&&<p role="alert">{translateUi('Could not load your verified credits. ')}{creditsError}</p>}
      <Panel><div className="ws-panel-title"><div><h2>{translateUi('Credit history')}</h2><p className="hub-caption">{translateUi('Search your activity, filter by source, or choose a date range.')}</p></div></div>
        <div className="credit-dates"><Field label={translateUi('From date')}><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></Field><Field label={translateUi('To date')}><input type="date" min={from} value={to} onChange={e=>setTo(e.target.value)}/></Field>{(from||to)&&<button className="hub-text-button" onClick={()=>{setFrom('');setTo('');}}>{translateUi('Clear dates')}</button>}</div>
        {creditsLoading?<p role="status">{translateUi('Loading credit history…')}</p>:creditsError?<Empty>{translateUi('Credit history is unavailable.')}</Empty>:<RecordTable title="credit history" rows={shown} searchText={c=>`${c.label} ${c.source} ${c.date} ${c.amount}`} filters={[
          {label:'Source',options:sources.map(source=>({label:source,test:(c:typeof ledger[number])=>sourceLabel(c.source)===source}))},
          {label:'Type',options:[{label:'Earned',test:(c:typeof ledger[number])=>c.amount>0},{label:'Adjustments',test:(c:typeof ledger[number])=>c.amount<=0}]}
        ]} columns={[
          {label:'Activity',render:c=><strong>{c.label}</strong>},
          {label:'Source',render:c=><span className="credit-source">{translateUi(sourceLabel(c.source))}</span>},
          {label:'Date',render:c=>new Date(c.date).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})},
          {label:'Credits',render:c=><span className={`credit-amount ${c.amount>0?'positive':'negative'}`}>{c.amount>0?'+':''}{c.amount.toLocaleString()}</span>}
        ]}/>}</Panel>
      <div className="hub-grid two credit-earn">
        <Panel><h3>{translateUi('Attend a PLP meeting')}</h3><p>{translateUi('Check in at the venue. Verified attendance adds credits automatically.')}</p><TextLink to="/meetings">{translateUi('Upcoming meetings')}</TextLink></Panel>
        <Panel><h3>{translateUi('Learn and participate')}</h3><p>{translateUi('Earn credits through confirmed course completion and community activities.')}</p><TextLink to="/academy">{translateUi('Explore learning')}</TextLink></Panel>
      </div>
    </div>;
}
