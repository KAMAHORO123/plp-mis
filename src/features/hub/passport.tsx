import { platformApi } from "./platform-api";
import { useLiveTick } from './live';
import { isPlatformId } from "./platform-course";
import { certificateReference } from "./certificate-id";
import { downloadCertificatePDF, certificateFileName, courseCertificateDesign, issuedCertificateDesign, type IssuedCertificate } from './certificate-pdf';
import { CertificateCard } from './certificate-card';
import { downloadPassportPDF } from './passport-pdf';
import { ProfileCard, ProfilePanel } from './profile-card';
import { useOverview, figure, type MemberOverview } from './reports';
import { FormModal } from './modal';
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpen,
  Clock3,
  Coins,
  Download,
  Fingerprint,
  Plus,
  PencilLine,
  Sparkles,
  Flag,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { clubs, mentors } from "./data";
import { useHub, balance, type HubCertificate } from "./store";
import {
  Empty,
  Field,
  Heading,
  Panel,
  Progress,
  Stats,
  Tag,
  TextLink,
} from "./ui";
export function JourneyPage() {
  const { state, profile } = useHub();
  const enrollments = state.enrollments.filter(
    (e) => e.memberId === profile.id,
  );
  const completed = enrollments.filter((e) => e.completedAt);
  return (
    <>
      <Heading
        eyebrow="YOUR SPACE TO GROW"
        title={`Welcome, ${profile.name.split(" ")[0]}.`}
        description="You don’t need to have it all figured out. Just take the next step."
        action={
          <Link to="/passport" className="hub-button secondary">
            <Fingerprint size={18} /> My youth passport
          </Link>
        }
      />
      <div className="hub-journey-banner">
        <div>
          <Tag>Stage 01 · Discover & Develop</Tag>
          <h2>Your next chapter starts with learning.</h2>
          <p>
            Build your skills, meet your community, and turn curiosity into
            action.
          </p>
          <Link to="/academy" className="hub-button">
            Find your next course <ArrowRight size={17} />
          </Link>
        </div>
        <BookOpen size={100} />
      </div>
      <Stats
        items={[
          { label: "Courses completed", value: completed.length },
          {
            label: "Certificates earned",
            value: state.certificates.filter((c) => c.memberId === profile.id)
              .length,
          },
          { label: "PLP credits", value: balance(state, profile.id) },
          { label: "Communities joined", value: profile.clubIds.length },
        ]}
      />
      <div className="hub-row hub-section-title">
        <h2>Keep your momentum</h2>
        <TextLink to="/academy">All courses</TextLink>
      </div>
      <div className="hub-grid two">
        {enrollments
          .filter((e) => !e.completedAt)
          .map((e) => {
            const c = state.courses.find((c) => c.id === e.courseId)!;
            return (
              <Panel key={c.id}>
                <Tag>{c.category}</Tag>
                <h2>{c.title}</h2>
                <Progress
                  value={Math.round(
                    (e.lessons.length / (c.lessons.length + 1)) * 100,
                  )}
                />
                <TextLink to={`/academy/${c.id}`}>Continue learning</TextLink>
              </Panel>
            );
          })}
      </div>
      {!enrollments.some((e) => !e.completedAt) && (
        <Empty>
          Ready for a new skill?{" "}
          <TextLink to="/academy">Explore the learning academy</TextLink>
        </Empty>
      )}
      <div className="hub-grid two hub-space">
        <Panel>
          <h2>Your mentoring sessions</h2>
          {state.sessions.filter(
            (s) => s.memberId === profile.id && s.status === "Requested",
          ).length ? (
            state.sessions
              .filter(
                (s) => s.memberId === profile.id && s.status === "Requested",
              )
              .slice()
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(0, 3)
              .map((s) => (
                <div className="hub-list-row" key={s.id}>
                  <div>
                    <strong>
                      {mentors.find((m) => m.id === s.mentorId)?.name}
                    </strong>
                    <p className="hub-caption">
                      {new Date(s.date).toLocaleString()}
                    </p>
                  </div>
                  <Tag>Requested</Tag>
                </div>
              ))
          ) : (
            <p>No sessions scheduled yet.</p>
          )}
          <TextLink to="/mentorship">View mentoring</TextLink>
        </Panel>
        <Panel>
          <h2>Updates from your clubs</h2>
          {state.activities.filter((a) => profile.clubIds.includes(a.clubId))
            .length ? (
            state.activities
              .filter((a) => profile.clubIds.includes(a.clubId))
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 3)
              .map((a) => (
                <div className="hub-list-row" key={a.id}>
                  <div>
                    <strong>{a.title}</strong>
                    <p className="hub-caption">
                      {clubs.find((c) => c.id === a.clubId)?.name} · {a.date}
                    </p>
                  </div>
                  <Tag>{a.type}</Tag>
                </div>
              ))
          ) : (
            <p>Join a community to see its activities here.</p>
          )}
          <TextLink to="/clubs">Visit my communities</TextLink>
        </Panel>
      </div>
      <h2 className="hub-section-title">Make space for what’s next</h2>
      <div className="hub-grid three">
        {[
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
        ].map((x) => (
          <Panel key={x.to}>
            <x.icon className="hub-feature-icon" />
            <h3>{x.title}</h3>
            <p>{x.text}</p>
            <TextLink to={x.to}>Explore</TextLink>
          </Panel>
        ))}
      </div>
    </>
  );
}
export function PassportPage() {
  const { state, profile, update } = useHub();
  // Server-issued certificates (trainer-built courses and school membership) count alongside local ones.
  const live = useLiveTick();
  const [serverCerts, setServerCerts] = useState<{ id: string; kind: string; revoked_at: string | null }[]>([]);
  useEffect(() => { platformApi<{ id: string; kind: string; revoked_at: string | null }[]>("/certificates").then((rows) => setServerCerts(rows.filter((r) => !r.revoked_at))).catch(() => {}); }, [profile.id, live]);
  const [edit, setEdit] = useState(false);
  const schoolAchievements = state.schoolRecords.requests.filter(r => r.status === 'Issued').flatMap(r => r.members.filter(m => m.email && m.email.toLowerCase() === profile.email.toLowerCase()).map(m => ({ id: `${r.id}/${m.id}`, title: r.programme, name: m.name, issued: r.issued, completed: r.completed, schoolId: r.schoolId, verifyUrl: `/certificate-check/${r.id}/${m.id}` })));

  const enrollments = state.enrollments.filter(
    (e) => e.memberId === profile.id,
  );
  // Learning, attendance and certificates are counted on the server; built-in academy courses live in this browser.
  const overview = useOverview<MemberOverview>();
  const volunteerHours = overview?.volunteerHours ?? 0;
  const downloadPassport = async () => {
              try {
                const issued = await platformApi<{ id: string; programme: string; issued_at: string; revoked_at: string | null; kind: string }[]>("/certificates").catch(() => []);
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
              } catch { toast.error("The passport PDF could not be created. Try again."); }
            };
  const localCertificates = state.certificates.filter((c) => c.memberId === profile.id && !serverCerts.some((r) => r.id === c.id)).length;
  const courses = overview ? figure(overview.coursesCompleted + enrollments.filter((e) => e.completedAt).length) : "—";
  const certificates = overview ? figure(overview.certificates + localCertificates) : "—";
  const communities = clubs.filter((c) => profile.clubIds.includes(c.id));
  return (
    <div className="ws-page pv-page">
      <ProfileCard
        kicker="PLP DIGITAL YOUTH PASSPORT"
        bio={profile.bio || "Add a short bio so mentors and communities know what you care about."}
        actions={<>
          <button className="hub-button secondary" onClick={() => setEdit(true)}><PencilLine size={16} /> Edit profile</button>
          <button className="hub-button" onClick={downloadPassport}><Download size={16} /> Download PDF</button>
        </>}
        stats={[{ label: "Courses completed", value: courses, icon: BookOpen }, { label: "Certificates", value: certificates, icon: Award }, { label: "Verified credits", value: figure(balance(state, profile.id)), icon: Coins }, { label: "Volunteer hours", value: overview ? figure(volunteerHours) : "—", icon: Clock3 }]}
      />
      {edit && (
        <FormModal title="Edit your passport" description="Shown on your youth passport and in the PDF you download." onClose={() => setEdit(false)}>
          <form
            key={profile.id}
            className="hub-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (
                update((s) => {
                  const p = s.profiles.find((p) => p.id === profile.id)!;
                  p.name = String(f.get("name")).trim();
                  p.bio = String(f.get("bio"));
                  p.skills = String(f.get("skills"))
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean);
                  p.leadership = String(f.get("leadership"))
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean);
                })
              ) {
                setEdit(false);
                toast.success("Passport updated");
              }
            }}
          >
            <Field label="Name">
              <input
                name="name"
                required
                pattern=".*\S.*"
                maxLength={80}
                defaultValue={profile.name}
              />
            </Field>
            <Field label="About you">
              <textarea name="bio" maxLength={500} defaultValue={profile.bio} />
            </Field>
            <Field label="Skills (comma separated)">
              <input
                name="skills"
                maxLength={500}
                defaultValue={profile.skills.join(", ")}
              />
            </Field>
            <Field label="Leadership roles (comma separated)">
              <input
                name="leadership"
                maxLength={500}
                defaultValue={profile.leadership.join(", ")}
              />
            </Field>
            <div className="hub-actions hub-dialog-actions">
              <button type="button" className="hub-button secondary" onClick={() => setEdit(false)}>Cancel</button>
              <button className="hub-button">Save profile</button>
            </div>
          </form>
        </FormModal>
      )}
      <div className="pv-grid">
        <ProfilePanel icon={Sparkles} title="Skills">
          {profile.skills.length
            ? <div className="pv-chips">{profile.skills.map((s) => <span key={s}>{s}</span>)}</div>
            : <p className="pv-empty">Skills you add or earn from courses appear here.</p>}
          <button className="hub-text-button" onClick={() => setEdit(true)}>{profile.skills.length ? "Edit skills" : "Add skills"}</button>
        </ProfilePanel>
        <ProfilePanel icon={Flag} title="Leadership">
          {profile.leadership.length
            ? <ul className="pv-list">{profile.leadership.map((r, i) => <li key={i}>{r}</li>)}</ul>
            : <p className="pv-empty">Roles you take on in clubs, schools and events appear here.</p>}
          <TextLink to="/certificates">View my achievements</TextLink>
        </ProfilePanel>
        <ProfilePanel icon={Users} title="Communities">
          {communities.length
            ? <ul className="pv-list">{communities.map((c) => <li key={c.id}><span>{c.name}</span><small>{c.type}</small></li>)}</ul>
            : <p className="pv-empty">Join a local club or homegroup to grow with others.</p>}
          <TextLink to="/clubs">Explore communities</TextLink>
        </ProfilePanel>
      </div>
    </div>
  );
}
export async function certificatePDF(c: HubCertificate) {
  await downloadCertificatePDF([courseCertificateDesign({ id: c.id, recipient: c.memberName, course: c.title, date: c.date })], certificateFileName(c.memberName, c.title));
}
export function CertificatesPage({ administration = false }: { administration?: boolean }) {
  const { state, profile } = useHub();
  const [query, setQuery] = useState('');
  const admin = administration && profile.role === 'Administrator';
  const [issued,setIssued]=useState<HubCertificate[]>([]);
  // The platform's own records, so each download uses the wording it was issued with.
  const [rows,setRows]=useState<IssuedCertificate[]>([]);
  useEffect(()=>{let active=true;const load=()=>platformApi<(IssuedCertificate&{revoked_at:string|null})[]>("/certificates").then(rows=>{if(active)setRows(rows);if(active)setIssued(rows.filter(r=>!r.revoked_at).map(r=>({id:r.id,memberId:profile.id,memberName:r.recipient,title:r.programme,courseId:r.kind==="school"?"school":r.id,date:r.issued_at.slice(0,10)})));}).catch(()=>{});void load();window.addEventListener('plp:achievements-updated',load);return()=>{active=false;window.removeEventListener('plp:achievements-updated',load);};},[profile.id]);
  const list = [...issued,...state.certificates.filter(c=>!issued.some(r=>r.id===c.id))].filter(c => (admin || c.memberId === profile.id) && `${c.title} ${c.memberName} ${c.id}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="hub-editorial-page hub-achievements-page">
      <Heading
        title={admin ? "Issued course certificates" : "My achievements"}
        description={admin ? "Manage issued course certificates." : "Your learning milestones, all in one place."}
      />
      <div className="hub-achievements-summary"><span><strong>{list.length}</strong> {list.length === 1 ? "achievement" : "achievements"}</span><TextLink to="/certificate-centre">School certificates</TextLink></div>
      {admin && <Field label="Search issued certificates"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search recipient, programme, or certificate ID"/></Field>}
      {!list.length ? (
        <Empty>
          <Award size={32} />
          <h2>{admin ? "No issued course certificates match this view." : "Your first milestone is waiting."}</h2>
          <p>
            Complete a course’s lessons, assignment, and assessment to earn a
            certificate.
          </p>
          <TextLink to="/academy">Find a course</TextLink>
        </Empty>
      ) : (
        <div className="cc-grid">
          {list.map((c) => {
            // Platform certificates carry their own wording; courses tracked in this browser use the course design.
            const raw = rows.find((r) => r.id === c.id);
            return <CertificateCard key={c.id} design={raw ? issuedCertificateDesign(raw) : courseCertificateDesign({ id: c.id, recipient: c.memberName, course: c.title, date: c.date })} revoked={!!(raw as { revoked_at?: string | null } | undefined)?.revoked_at} />;
          })}
        </div>
      )}
    </div>
  );
}
function PlatformVerifyPage(){
 const {id}=useParams();const [record,setRecord]=useState<{recipient:string;programme:string;issued_at:string;revoked_at:string|null;kind?:string;title?:string|null;citation?:string|null;role?:string|null;period_from?:string|null;period_to?:string|null;school?:string|null}|null>(null),[error,setError]=useState('');
 useEffect(()=>{platformApi<typeof record>(`/public/certificates/${id}`).then(setRecord).catch(e=>setError(e.message));},[id]);
 // Anyone who scans the QR code sees the certificate itself, with its current status.
 return <div className="hub-section cv-page"><Heading title="Certificate verification" description="Peace and Love Proclaimers"/>{record?<>
  <p className={`cv-status ${record.revoked_at?'revoked':''}`}>{record.revoked_at?'This certificate has been revoked and is no longer valid.':`Verified: this certificate was issued by Peace and Love Proclaimers on ${record.issued_at.slice(0,10)}.`}</p>
  <CertificateCard actions={false} design={issuedCertificateDesign({...record,id:id!,kind:record.kind??(record.title?'school':'course')})}/>
 </>:<Panel><p>{error||'Checking certificate…'}</p></Panel>}</div>;
}
export function VerifyPage(){const {id}=useParams();return id&&isPlatformId(id)?<PlatformVerifyPage/>:<LocalVerifyPage/>;}
function LocalVerifyPage() {
  const { id } = useParams();
  const { state } = useHub();
  const c = state.certificates.find(c => certificateReference(c.id) === certificateReference(id || ""));
  return (
    <>
      <Heading
        title="Certificate verification"
        description="Check a PLP course completion record."
      />
      {c ? (
        <Panel>
          <Award className="hub-feature-icon" />
          <Tag>Record found</Tag>
          <h2>{c.title}</h2>
          <p>
            Awarded to {c.memberName} on {c.date}.
          </p>
          <p className="hub-caption hub-break">{c.id}</p>
        </Panel>
      ) : (
        <Empty>
          No certificate was found with this ID. Check the link or QR code and
          try again.
        </Empty>
      )}
    </>
  );
}
export function CreditsPage() {
  const { state, profile, creditsLoading, creditsError } = useHub();
  const total = balance(state, profile.id);
  const ledger = state.credits.filter((c) => c.memberId === profile.id);
  return (
    <>
      <Heading
        title="Your PLP credits"
        description="Credits confirmed by PLP and saved to your account."
      />
      <div className="hub-credit-hero">
        <Coins size={50} />
        <div>
          <p>AVAILABLE BALANCE</p>
          <strong>{creditsLoading ? "…" : creditsError ? "—" : total}</strong>
          <span>PLP credits</span>
        </div>
<p>Verified attendance.<br />Recognized learning.</p>
      </div>
      {creditsError && <p role="alert">Could not load your verified credits. {creditsError}</p>}
      <h2 className="hub-section-title">How to earn</h2>
      <div className="hub-grid two">
        <Panel><h3>Attend a PLP meeting</h3><p>Visit the venue, use the host’s code, and confirm your location during the attendance window. Credits arrive automatically, once per meeting.</p><TextLink to="/meetings">Upcoming meetings</TextLink></Panel>
        <Panel><h3>Complete verified learning & activities</h3><p>Credits are awarded when PLP confirms course completion or activity participation. Self-reported progress does not add verified credits.</p><TextLink to="/academy">Explore learning</TextLink></Panel>
      </div>
      <h2 className="hub-section-title">Your credit history</h2>
      <Panel>
        {ledger.length ? (
          ledger
            .slice()
            .map((c) => (
              <div className="hub-list-row" key={c.id}>
                <div>
                  <strong>{c.label}</strong>
                  <p className="hub-caption">{c.date}</p>
                </div>
                <Tag>
                  {c.amount > 0 ? "+" : ""}
                  {c.amount}
                </Tag>
              </div>
            ))
        ) : (
          <Empty>{creditsLoading ? "Loading credit history…" : creditsError ? "Credit history is unavailable." : "Your verified credits will appear here."}</Empty>
        )}
      </Panel>
    </>
  );
}
