import { AnnouncementEditor } from "./announcement";
import { useLiveTick } from './live';
import { TrainerWorkspace } from "./trainer-workspace";
import { OpportunityAdmin } from "./opportunities";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { confirmAction } from "@/components/shared/confirm-dialog";
import { platformApi } from "./platform-api";
import { readRecord, saveRecord } from "./platform-records";
import { BarChart3, Users } from "lucide-react";
import {
  alxPrograms,
  categories,
  clubs,
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
  const { state, profile } = useHub();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(() => { const requested=searchParams.get("tab"); return (requested === "Assignments" && profile.role !== "Administrator") || (profile.role === "Administrator" && ["ALX certificates", "Opportunities", "Website banner"].includes(requested ?? "")) ? requested! : requested === "ALX reviews" && profile.role === "Administrator" ? "ALX certificates" : "Courses"; });
  const admin = profile.role === "Administrator";
  // ALX certificates are recognised on upload; an administrator can revoke one that turns out to be invalid.
  const [people, setPeople] = useState<{ id: string; name: string }[]>([]);
  const live = useLiveTick();
  useEffect(() => { if (admin) platformApi<{ id: string; name: string }[]>("/users").then(setPeople).catch(() => {}); }, [admin, live]);
  async function reviewProof(id: string, status: "approved" | "returned") {
    if (status === "returned" && !await confirmAction({ title: "Revoke this ALX certificate?", description: "The member loses the recognition and is notified. Do this only if the certificate is not genuine.", confirmLabel: "Revoke", destructive: true })) return;
    try { const stored = await readRecord<Record<string, unknown>>("proofs", id); await saveRecord("proofs", { ...stored.data, status, feedback: status === "returned" ? "Revoked by PLP: this certificate could not be verified." : stored.data.feedback }, { id, version: stored.version }); toast.success(status === "approved" ? "Certificate recognised" : "Certificate revoked"); }
    catch (e) { toast.error((e as Error).message); }
  }
  if (!admin && profile.role !== "Trainer")
    return (
      <Empty>This workspace is for assigned trainers and administrators.</Empty>
    );
  if (!admin) return <TrainerWorkspace/>;
  return (
    <>
      <Heading
        eyebrow="MAKE ROOM FOR LEARNING"
        title={admin ? "Content studio" : "Trainer studio"}
        description={admin ? "See published courses, ALX certificates members have uploaded, opportunities and the website banner." : "Create learning experiences, review assignments, and support the next generation."}
      />
      <div className="hub-chips">
        {[
          "Courses",
          // Assignment feedback belongs to the course's trainer.
          ...(admin ? ["ALX certificates", "Opportunities", "Website banner"] : ["Assignments"]),
        ].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => { setTab(t); setSearchParams(t === "Courses" ? {} : { tab: t }, { replace: true }); }}
          >
            {admin && t === "Courses" ? "Published courses" : t}
          </button>
        ))}
      </div>
      {tab === "Website banner" && admin && <AnnouncementEditor/>}
      {tab === "Courses" && <TrainerWorkspace embedded={admin}/>}
      {tab === "Assignments" && !admin && <TrainerWorkspace initialTab="Learners & assignments"/>}
      {tab === "ALX certificates" && admin && (
        <div className="hub-stack">
          {state.proofs
            .filter((p) => p.file)
            .map((p) => (
              <Panel key={p.id}>
                <Tag>{p.status === "Recognized" ? "Recognised" : p.status === "Returned" ? "Revoked" : "Processing"}</Tag>
                <h3>{alxPrograms.find((a) => a.id === p.programId)?.title}</h3>
                <p>
                  {people.find((m) => m.id === p.memberId)?.name ?? state.profiles.find((m) => m.id === p.memberId)?.name}
                </p>
                <a
                  href={p.file}
                  download={p.fileName}
                  className="hub-text-link"
                >
                  Download certificate{p.fileName ? `: ${p.fileName}` : ""}
                </a>
                <div className="hub-actions hub-space">
                  {p.status === "Recognized"
                    ? <button className="hub-button danger" onClick={() => void reviewProof(p.id, "returned")}>Revoke</button>
                    : <button className="hub-button secondary" onClick={() => void reviewProof(p.id, "approved")}>Recognise</button>}
                </div>
              </Panel>
            ))}
          {!state.proofs.some((p) => p.file) && (
            <Empty>
              No ALX certificates yet. Members upload them in the ALX learning
              zone and they are recognised straight away.
            </Empty>
          )}
        </div>
      )}
      {tab === "Opportunities" && admin && <OpportunityAdmin/>}

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
                  "PLP Hub records",
                ]),
              ])
            }
          >
            <BarChart3 size={17} /> Export impact report
          </button>
        }
      />
      <p className="hub-caption">
        These figures are calculated from PLP Hub profiles and activity. They
        are separate from historical figures in the organization portfolio.
        Active = enrolled, attended an activity, or requested mentoring.
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
