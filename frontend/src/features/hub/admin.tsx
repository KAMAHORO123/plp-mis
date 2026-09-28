import { CourseManagement } from "./course-management";
import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { BarChart3, Users } from "lucide-react";
import {
  alxPrograms,
  categories,
  clubs,
  opportunityTypes,
} from "./data";
import { useHub, uid, today } from "./store";
import {
  Empty,
  Field,
  Heading,
  Panel,
  Progress,
  Stats,
  Tag,
  downloadCSV,
} from "./ui";
export function StudioPage() {
  const { state, profile, update } = useHub();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(() => { const requested=searchParams.get("tab"); return requested === "Assignments" || (profile.role === "Administrator" && ["ALX reviews", "Opportunities"].includes(requested ?? "")) ? requested! : "Courses"; });
  const admin = profile.role === "Administrator";
  const managedCourses = state.courses.filter(
    (c) => admin || c.ownerId === profile.id,
  );
  const assignments = state.enrollments.filter(
    (e) => e.assignment && managedCourses.some((c) => c.id === e.courseId),
  );
  if (!admin && profile.role !== "Trainer")
    return (
      <Empty>This workspace is for assigned trainers and administrators.</Empty>
    );
  return (
    <>
      <Heading
        eyebrow="MAKE ROOM FOR LEARNING"
        title={admin ? "Content studio" : "Trainer studio"}
        description="Create learning experiences, review assignments, and support the next generation."
      />
      <div className="hub-chips">
        {[
          "Courses",
          "Assignments",
          ...(admin ? ["ALX reviews", "Opportunities"] : []),
        ].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Courses" && <CourseManagement/>}
      {tab === "Assignments" && (
        <div className="hub-stack">
          {assignments.map((e) => (
            <Panel key={`${e.memberId}-${e.courseId}`}>
              <Tag>{e.passed ? "Assessment passed" : "Needs review"}</Tag>
              <h3>{state.courses.find((c) => c.id === e.courseId)?.title}</h3>
              <p>{state.profiles.find((p) => p.id === e.memberId)?.name}</p>
              <p className="hub-prewrap">{e.assignment}</p>
            </Panel>
          ))}
          {!assignments.length && (
            <Empty>Submitted learner assignments will appear here.</Empty>
          )}
        </div>
      )}
      {tab === "ALX reviews" && admin && (
        <div className="hub-stack">
          {state.proofs
            .filter((p) => p.file)
            .map((p) => (
              <Panel key={p.id}>
                <Tag>{p.status}</Tag>
                <h3>{alxPrograms.find((a) => a.id === p.programId)?.title}</h3>
                <p>
                  {state.profiles.find((m) => m.id === p.memberId)?.name}
                </p>
                <a
                  href={p.file}
                  download={p.fileName}
                  className="hub-text-link"
                >
                  Download evidence: {p.fileName}
                </a>
                {p.status === "Pending review" && (
                  <div className="hub-actions hub-space">
                    <button
                      className="hub-button"
                      onClick={() =>
                        update((s) => {
                          s.proofs.find((x) => x.id === p.id)!.status =
                            "Recognized";
                        })
                      }
                    >
                      Recognize completion
                    </button>
                    <button
                      className="hub-button secondary"
                      onClick={() =>
                        update((s) => {
                          s.proofs.find((x) => x.id === p.id)!.status =
                            "Returned";
                        })
                      }
                    >
                      Return for revision
                    </button>
                  </div>
                )}
              </Panel>
            ))}
          {!state.proofs.some((p) => p.file) && (
            <Empty>
              No evidence submitted yet. Members can upload proof in the ALX
              learning zone.
            </Empty>
          )}
        </div>
      )}
      {tab === "Opportunities" && admin && (
        <>
          <div className="hub-stack">
            {state.opportunities.map((o) => (
              <Panel key={o.id}>
                <div className="hub-row">
                  <div>
                    <Tag>{o.type}</Tag>
                    <h3>{o.title}</h3>
                    <p>
                      {o.organization} · {o.deadline}
                    </p>
                  </div>
                  <button
                    className="hub-button secondary"
                    onClick={() =>
                      update((s) => {
                        const row = s.opportunities.find((x) => x.id === o.id)!;
                        row.published = !row.published;
                      })
                    }
                  >
                    {o.published ? "Unpublish" : "Publish"}
                  </button>
                </div>
              </Panel>
            ))}
          </div>
          <Panel className="hub-space">
            <h2>Add an opportunity</h2>
            <form
              className="hub-form"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const f = new FormData(form);
                const str = (key: string) => String(f.get(key)).trim();
                if (
                  update((s) => {
                    s.opportunities.push({
                      id: uid(),
                      title: str("title"),
                      type: str("type"),
                      organization: str("organization"),
                      location: str("location"),
                      deadline: str("deadline"),
                      description: str("description"),
                      eligibility: str("eligibility"),
                      published: true,
                    });
                  })
                ) {
                  form.reset();
                  toast.success("Opportunity added to this preview");
                }
              }}
            >
              <Field label="Title">
                <input name="title" required minLength={3} maxLength={100} />
              </Field>
              <Field label="Opportunity category">
                <select name="type">
                  {opportunityTypes.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <div className="hub-grid two">
                <Field label="Organization">
                  <input name="organization" required maxLength={100} />
                </Field>
                <Field label="Location">
                  <input name="location" required maxLength={100} />
                </Field>
              </div>
              <Field label="Application deadline">
                <input type="date" name="deadline" required min={today()} />
              </Field>
              <Field label="Description">
                <textarea
                  name="description"
                  required
                  minLength={20}
                  maxLength={2500}
                />
              </Field>
              <Field label="Eligibility">
                <textarea
                  name="eligibility"
                  required
                  minLength={10}
                  maxLength={1000}
                />
              </Field>
              <button className="hub-button">Publish opportunity</button>
            </form>
          </Panel>
        </>
      )}

    </>
  );
}
export function AnalyticsPage() {
  const { state, profile, update } = useHub();
  if (profile.role !== "Administrator")
    return <Empty>Impact analytics is an administrator workspace.</Empty>;
  const completed = state.enrollments.filter((e) => e.completedAt);
  const activeIds = new Set([
    ...state.enrollments.map((e) => e.memberId),
    ...state.activities.flatMap((a) => a.attendees),
    ...state.sessions.map((s) => s.memberId),
  ]);
  const activeClubs = clubs.filter((c) =>
    state.profiles.some((p) => p.clubIds.includes(c.id)),
  );
  const employment = state.outcomes.filter((o) =>
    ["Employment", "Internship", "Apprenticeship"].includes(o.type),
  );
  const metrics = [
    {
      label: "Total members",
      value: state.profiles.filter((p) => p.membership === "Approved").length,
    },
    { label: "Active members", value: activeIds.size },
    { label: "Courses completed", value: completed.length },
    { label: "Certificates issued", value: state.certificates.length + state.schoolRecords.requests.filter(r=>r.status==="Issued").reduce((n,r)=>n+r.members.length,0) },
    { label: "Active clubs", value: activeClubs.length },
    {
      label: "Youth reached",
      value: state.profiles.filter(
        (p) =>
          p.membership === "Approved" &&
          ["Student member", "University member", "Community member"].includes(
            p.role,
          ),
      ).length,
    },
    { label: "Employment / placements", value: employment.length },
  ];
  return (
    <>
      <Heading
        eyebrow="MONITORING, EVALUATION & LEARNING"
        title="See the difference taking shape."
        description="Track learning, participation, and outcomes across the Hub’s local records."
        action={
          <button
            className="hub-button secondary"
            onClick={() =>
              downloadCSV("plp-hub-impact.csv", [
                ["Metric", "Value", "Scope"],
                ...metrics.map((m) => [
                  m.label,
                  m.value,
                  "Local preview records",
                ]),
              ])
            }
          >
            <BarChart3 size={17} /> Export impact report
          </button>
        }
      />
      <p className="hub-caption">
        These figures are calculated from this browser’s sample profiles and
        activity. They are separate from historical figures in the organization
        portfolio. Active = enrolled, attended an activity, or requested
        mentoring.
      </p>
      <Stats items={metrics} />
      <div className="hub-grid two">
        <Panel>
          <h2>Learning by pathway</h2>
          {categories.map((c) => {
            const total = state.enrollments.filter(
              (e) =>
                state.courses.find((x) => x.id === e.courseId)?.category === c,
            );
            const done = total.filter((e) => e.completedAt).length;
            return (
              <div className="hub-space" key={c}>
                <h3>{c}</h3>
                <Progress
                  label={`${done} of ${total.length} enrollments completed`}
                  value={
                    total.length ? Math.round((done / total.length) * 100) : 0
                  }
                />
              </div>
            );
          })}
        </Panel>
        <Panel>
          <h2>Club participation</h2>
          {clubs.map((c) => (
            <div key={c.id} className="hub-list-row">
              <div>
                <strong>{c.name}</strong>
                <p className="hub-caption">
                  {state.activities.filter((a) => a.clubId === c.id).length}{" "}
                  activities ·{" "}
                  {
                    state.activities.filter(
                      (a) => a.clubId === c.id && a.status !== "Draft",
                    ).length
                  }{" "}
                  reports
                </p>
              </div>
              <Tag>
                {state.profiles.filter((p) => p.clubIds.includes(c.id)).length}{" "}
                members
              </Tag>
            </div>
          ))}
        </Panel>
      </div>
      <Panel className="hub-space">
        <h2>Record a member outcome</h2>
        <p>
          Capture a placement, venture, or community outcome for donor
          reporting.
        </p>
        <form
          className="hub-form"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const f = new FormData(form);
            if (
              update((s) => {
                s.outcomes.push({
                  id: uid(),
                  memberId: String(f.get("memberId")),
                  type: String(f.get("type")),
                  detail: String(f.get("detail")).trim(),
                  date: String(f.get("date")),
                });
              })
            )
              form.reset();
          }}
        >
          <div className="hub-grid two">
            <Field label="Member">
              <select name="memberId">
                {state.profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Outcome type">
              <select name="type">
                {[
                  "Employment",
                  "Internship",
                  "Apprenticeship",
                  "Venture launched",
                  "Community impact",
                ].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Outcome date">
            <input name="date" type="date" max={today()} required />
          </Field>
          <Field label="Outcome details">
            <textarea name="detail" required minLength={15} maxLength={2000} />
          </Field>
          <button className="hub-button">
            <Users size={17} /> Record outcome
          </button>
        </form>
      </Panel>
      <h2 className="hub-section-title">Outcome records</h2>
      {state.outcomes.length ? (
        <Panel>
          {state.outcomes.map((o) => (
            <div className="hub-list-row" key={o.id}>
              <div>
                <h3>{state.profiles.find((p) => p.id === o.memberId)?.name}</h3>
                <p>{o.detail}</p>
                <p className="hub-caption">{o.date}</p>
              </div>
              <Tag>{o.type}</Tag>
            </div>
          ))}
        </Panel>
      ) : (
        <Empty>No outcomes recorded yet.</Empty>
      )}
    </>
  );
}
