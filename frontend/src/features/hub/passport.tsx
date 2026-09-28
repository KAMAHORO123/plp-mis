import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpen,
  Coins,
  Download,
  Fingerprint,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { clubs, alxPrograms, mentors } from "./data";
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
  downloadText,
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
  const [edit, setEdit] = useState(false);
  const schoolAchievements = state.schoolRecords.requests.filter(r => r.status === 'Issued').flatMap(r => r.members.filter(m => m.email && m.email.toLowerCase() === profile.email.toLowerCase()).map(m => ({ id: `${r.id}/${m.id}`, title: r.programme, name: m.name, issued: r.issued, completed: r.completed, schoolId: r.schoolId, verifyUrl: `/certificate-check/${r.id}/${m.id}` })));

  const enrollments = state.enrollments.filter(
    (e) => e.memberId === profile.id,
  );
  const projects = state.projects.filter((p) => p.memberId === profile.id);
  const volunteerHours = state.activities
    .filter(
      (a) => a.type === "Volunteering" && a.attendees.includes(profile.id),
    )
    .reduce((n, a) => n + a.hours, 0);
  return (
    <>
      <Heading
        eyebrow="YOUR GROWTH, IN ONE PLACE"
        title="Digital youth passport"
        description="A living record of the skills you build, the people you serve, and the impact you make."
        action={
          <button
            className="hub-button secondary"
            onClick={() =>
              downloadText(
                "plp-youth-passport.json",
                JSON.stringify(
                  {
                    profile,
                    enrollments,
                    certificates: state.certificates.filter(
                      (c) => c.memberId === profile.id,
                    ),
                    schoolCertificates: schoolAchievements,
                    projects,
                    volunteerHours,
                  },
                  null,
                  2,
                ),
                "application/json",
              )
            }
          >
            <Download size={17} /> Export passport
          </button>
        }
      />
      <Panel className="hub-passport-header">
        <div className="hub-passport-avatar">
          {profile.name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")}
        </div>
        <div>
          <Tag>{profile.role}</Tag>
          <h2>{profile.name}</h2>
          <p>{profile.bio || "Your PLP journey is just beginning."}</p>
          <p className="hub-caption">
            Member since {profile.joined} · Local preview profile
          </p>
        </div>
        <button className="hub-button secondary" onClick={() => setEdit(!edit)}>
          {edit ? "Close editor" : "Edit profile"}
        </button>
      </Panel>
      {edit && (
        <Panel className="hub-space">
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
            <button className="hub-button">Save profile</button>
          </form>
        </Panel>
      )}
      <Stats
        items={[
          {
            label: "Courses completed",
            value: enrollments.filter((e) => e.completedAt).length,
          },
          {
            label: "Certificates",
            value: state.certificates.filter((c) => c.memberId === profile.id)
              .length + schoolAchievements.length,
          },
          { label: "Recorded volunteer hours", value: volunteerHours },
        ]}
      />
      <div className="hub-grid two">
        <Panel>
          <h2>Skills & leadership</h2>
          <div className="hub-tags">
            {profile.skills.length ? (
              profile.skills.map((s) => <Tag key={s}>{s}</Tag>)
            ) : (
              <p>Complete a course or add a skill to start your record.</p>
            )}
          </div>
          <h3 className="hub-space">Leadership roles</h3>
          {profile.leadership.length ? (
            profile.leadership.map((r, i) => <p key={i}>{r}</p>)
          ) : (
            <p>Your leadership roles will appear here.</p>
          )}
          <p className="hub-caption">Profile additions are self-reported.</p>
        </Panel>
        <Panel>
          <h2>My communities</h2>
          {profile.clubIds.length ? (
            clubs
              .filter((c) => profile.clubIds.includes(c.id))
              .map((c) => (
                <div className="hub-list-row" key={c.id}>
                  <span>{c.name}</span>
                  <Tag>{c.type}</Tag>
                </div>
              ))
          ) : (
            <p>Find a local club or homegroup to begin.</p>
          )}
          <TextLink to="/clubs">Explore communities</TextLink>
        </Panel>
        <Panel>
          <h2>Learning progress</h2>
          {enrollments.length ? (
            enrollments.map((e) => {
              const c = state.courses.find((c) => c.id === e.courseId)!;
              return (
                <div className="hub-space" key={c.id}>
                  <TextLink to={`/academy/${c.id}`}>{c.title}</TextLink>
                  <Progress
                    value={
                      e.completedAt
                        ? 100
                        : Math.round(
                            (e.lessons.length / (c.lessons.length + 1)) * 100,
                          )
                    }
                  />
                </div>
              );
            })
          ) : (
            <TextLink to="/academy">Start learning</TextLink>
          )}
        </Panel>
        <Panel>
          <h2>Badges & achievements</h2>
          {state.certificates
            .filter((c) => c.memberId === profile.id)
            .map((c) => (
              <div className="hub-list-row" key={c.id}>
                <Award size={20} />
                <span>{c.title}</span>
                <Tag>Completed</Tag>
              </div>
            ))}
          {state.proofs
            .filter(
              (p) => p.memberId === profile.id && p.status === "Recognized",
            )
            .map((p) => (
              <div className="hub-list-row" key={p.id}>
                <Award size={20} />
                <span>
                  {alxPrograms.find((a) => a.id === p.programId)?.title}
                </span>
                <Tag>ALX recognition</Tag>
              </div>
            ))}
          {schoolAchievements.map(c => <div className="hub-list-row" key={c.id}><Award size={20}/><Link className="hub-text-link" to={c.verifyUrl}>{c.title}</Link><Tag>School achievement</Tag></div>)}
          <TextLink to="/certificates">View certificates</TextLink>
        </Panel>
      </div>

    </>
  );
}
export async function certificatePDF(c: HubCertificate) {
  const [{ jsPDF }, { default: QRCode }] = await Promise.all([
    import("jspdf"),
    import("qrcode"),
  ]);
  const doc = new jsPDF({ orientation: "landscape" });
  const url = `${window.location.origin}/verify/${c.id}`;
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 200 });
  doc.setFillColor(246, 248, 252);
  doc.rect(0, 0, 297, 210, "F");
  doc.setDrawColor(32, 82, 160);
  doc.setLineWidth(1);
  doc.rect(12, 12, 273, 186);
  doc.setTextColor(26, 46, 75);
  doc.setFontSize(17);
  doc.text("PEACE AND LOVE PROCLAIMERS", 148, 37, { align: "center" });
  doc.setFontSize(30);
  doc.text("Certificate of completion", 148, 62, { align: "center" });
  doc.setFontSize(12);
  doc.text("FRONTEND PREVIEW - NOT AN OFFICIAL CREDENTIAL", 148, 76, {
    align: "center",
  });
  doc.setFontSize(22);
  doc.text(c.memberName, 148, 99, { align: "center", maxWidth: 235 });
  doc.setFontSize(13);
  doc.text("has completed the sample learning course", 148, 115, {
    align: "center",
  });
  doc.setFontSize(19);
  doc.text(c.title, 148, 133, { align: "center", maxWidth: 230 });
  doc.setFontSize(10);
  doc.text(`Issued ${c.date}`, 24, 160);
  doc.text(doc.splitTextToSize(c.id, 205), 24, 172);
  doc.text("Verification record exists only in the issuing browser.", 24, 188);
  doc.addImage(qr, "PNG", 245, 152, 30, 30);
  doc.save(`PLP-${c.courseId}-certificate.pdf`);
}
export function CertificatesPage({ administration = false }: { administration?: boolean }) {
  const { state, profile } = useHub();
  const [query, setQuery] = useState('');
  const admin = administration && profile.role === 'Administrator';
  const list = state.certificates.filter(c => (admin || c.memberId === profile.id) && `${c.title} ${c.memberName} ${c.id}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <Heading
        eyebrow="CELEBRATE YOUR PROGRESS"
        title={admin ? "Issued course certificates" : "Certificates & digital badges"}
        description={admin ? "Search automatically awarded course records. Course completion needs no manual approval." : "Course achievements are awarded automatically after you complete the lessons, assignment, and assessment."}
      />
      <p className="hub-caption">
        Preview certificates are not official credentials. QR verification works
        only where this browser’s local records are available.
      </p>
      <Panel className="hub-space"><h2>School-issued achievements</h2><p>School activities completed outside the Academy follow a separate coordinator request and administrator approval process.</p><TextLink to="/certificate-centre">{admin ? "Review school certificate requests" : "View my school certificates"}</TextLink></Panel>
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
        <div className="hub-grid two">
          {list.map((c) => (
            <Panel key={c.id} className="hub-certificate">
              <Award size={38} />
              <Tag>Course completed</Tag>
              <h2>{c.title}</h2>
              <p>
                {c.memberName} · {c.date}
              </p>
              <p className="hub-caption hub-break">{c.id}</p>
              <div className="hub-actions">
                <button
                  className="hub-button"
                  onClick={() =>
                    certificatePDF(c).catch(() =>
                      toast.error("Certificate could not be generated."),
                    )
                  }
                >
                  <Download size={16} /> Download PDF
                </button>
                <Link className="hub-button secondary" to={`/verify/${c.id}`}>
                  Verify record
                </Link>
                <a
                  className="hub-text-link"
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin + "/verify/" + c.id)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Share on LinkedIn ↗
                </a>
              </div>
              <p className="hub-caption">
                This preview link requires member sign-in and the issuing
                browser.
              </p>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
export function VerifyPage() {
  const { id } = useParams();
  const { state, profile } = useHub();
  const c = state.certificates.find(
    (c) =>
      c.id === id &&
      (c.memberId === profile.id || profile.role === "Administrator"),
  );
  return (
    <>
      <Heading
        title="Certificate verification"
        description="Check a completion record in this local preview."
      />
      {c ? (
        <Panel>
          <Award className="hub-feature-icon" />
          <Tag>Found in this browser</Tag>
          <h2>{c.title}</h2>
          <p>
            Awarded to {c.memberName} on {c.date}.
          </p>
          <p className="hub-caption hub-break">{c.id}</p>
          <p>
            This sample record is stored locally and is not an independently
            verified PLP credential.
          </p>
        </Panel>
      ) : (
        <Empty>
          No accessible certificate was found. Members can view only their own
          records.
        </Empty>
      )}
    </>
  );
}
export function CreditsPage() {
  const { state, profile } = useHub();
  const total = balance(state, profile.id);
  const ledger = state.credits.filter((c) => c.memberId === profile.id);
  return (
    <>
      <Heading
        eyebrow="SMALL STEPS. REAL MOMENTUM."
        title="Your PLP credits"
        description="Celebrate learning and participation. Turn your progress into new possibilities."
      />
      <div className="hub-credit-hero">
        <Coins size={50} />
        <div>
          <p>AVAILABLE BALANCE</p>
          <strong>{total}</strong>
          <span>PLP credits</span>
        </div>
        <p>
          Keep learning.
          <br />
          Keep showing up.
          <br />
          Keep making a difference.
        </p>
      </div>
      <h2 className="hub-section-title">How to earn</h2>
      <div className="hub-grid three">
        {[
          { title: "Complete a course", amount: 50, to: "/academy" },
          { title: "Attend a club meeting", amount: 10, to: "/clubs" },
          { title: "Volunteer with your club", amount: 20, to: "/clubs" },
          { title: "Recruit new members", amount: 15, to: "/clubs" },
          { title: "Participate in a challenge", amount: 25, to: "/clubs" },
        ].map((x) => (
          <Panel key={x.title}>
            <Tag>+{x.amount} credits</Tag>
            <h3>{x.title}</h3>
            <TextLink to={x.to}>
              {x.to === "/academy"
                ? "Find a course"
                : "Explore club activities"}
            </TextLink>
          </Panel>
        ))}
      </div>
      <p className="hub-caption">
        Preview reward values. Club credits are awarded when a leader confirms
        participation, once per activity. Course credits are awarded once per
        completed course.
      </p>
      <h2 className="hub-section-title">Your credit history</h2>
      <Panel>
        {ledger.length ? (
          ledger
            .slice()
            .reverse()
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
          <Empty>Your first credits are a course or activity away.</Empty>
        )}
      </Panel>
    </>
  );
}
