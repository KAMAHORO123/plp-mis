import { translateUi, useSiteLanguage } from '../../i18n/language';
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
import { alxPrograms, categories, clubs, } from "./data";
import { useHub, uid, today } from "./store";
import { Empty, Field, Heading, Panel, Progress, Stats, Tag, downloadCSV, } from "./ui";
export function StudioPage() {
    useSiteLanguage();
    const { state, profile } = useHub();
    const [searchParams, setSearchParams] = useSearchParams();
    const [tab, setTab] = useState(() => { const requested = searchParams.get("tab"); return (requested === "Assignments" && profile.role !== "Administrator") || (profile.role === "Administrator" && ["ALX certificates", "Opportunities", "Website banner"].includes(requested ?? "")) ? requested! : requested === "ALX reviews" && profile.role === "Administrator" ? "ALX certificates" : "Courses"; });
    const admin = profile.role === "Administrator";
    // ALX certificates are recognised on upload; an administrator can revoke one that turns out to be invalid.
    const [people, setPeople] = useState<{
        id: string;
        name: string;
    }[]>([]);
    const live = useLiveTick();
    useEffect(() => { if (admin)
        platformApi<{
            id: string;
            name: string;
        }[]>("/users").then(setPeople).catch(() => { }); }, [admin, live]);
    async function reviewProof(id: string, status: "approved" | "returned") {
        if (status === "returned" && !await confirmAction({ title: "Revoke this ALX certificate?", description: "The member loses the recognition and is notified. Do this only if the certificate is not genuine.", confirmLabel: "Revoke", destructive: true }))
            return;
        try {
            const stored = await readRecord<Record<string, unknown>>("proofs", id);
            await saveRecord("proofs", { ...stored.data, status, feedback: status === "returned" ? "Revoked by PLP: this certificate could not be verified." : stored.data.feedback }, { id, version: stored.version });
            toast.success(translateUi(status === "approved" ? "Certificate recognised" : "Certificate revoked"));
        }
        catch (e) {
            toast.error(translateUi((e as Error).message));
        }
    }
    if (!admin && profile.role !== "Trainer")
        return (<Empty>{translateUi("This workspace is for assigned trainers and administrators.")}</Empty>);
    if (!admin)
        return <TrainerWorkspace />;
    return (<>
      <Heading eyebrow="MAKE ROOM FOR LEARNING" title={translateUi(admin ? "Content studio" : "Trainer studio")} description={translateUi(admin ? "See published courses, ALX certificates members have uploaded, opportunities and the website banner." : "Create learning experiences, review assignments, and support the next generation.")}/>
      <div className="hub-chips">
        {translateUi([
            "Courses",
            // Assignment feedback belongs to the course's trainer.
            ...(admin ? ["ALX certificates", "Opportunities", "Website banner"] : ["Assignments"]),
        ].map((t) => (<button key={t} className={tab === t ? "active" : ""} onClick={() => { setTab(t); setSearchParams(t === "Courses" ? {} : { tab: t }, { replace: true }); }}>
            {translateUi(admin && t === "Courses" ? "Published courses" : t)}
          </button>)))}
      </div>
      {translateUi(tab === "Website banner" && admin && <AnnouncementEditor />)}
      {translateUi(tab === "Courses" && <TrainerWorkspace embedded={admin}/>)}
      {translateUi(tab === "Assignments" && !admin && <TrainerWorkspace initialTab="Learners & assignments"/>)}
      {translateUi(tab === "ALX certificates" && admin && (<div className="hub-stack">
          {translateUi(state.proofs
                .filter((p) => p.file)
                .map((p) => (<Panel key={p.id}>
                <Tag>{translateUi(p.status === "Recognized" ? "Recognised" : p.status === "Returned" ? "Revoked" : "Processing")}</Tag>
                <h3>{translateUi(alxPrograms.find((a) => a.id === p.programId)?.title)}</h3>
                <p>
                  {translateUi(people.find((m) => m.id === p.memberId)?.name ?? state.profiles.find((m) => m.id === p.memberId)?.name)}
                </p>
                <a href={p.file} download={p.fileName} className="hub-text-link">{translateUi(" Download certificate")}{translateUi(p.fileName ? `: ${p.fileName}` : "")}
                </a>
                <div className="hub-actions hub-space">
                  {translateUi(p.status === "Recognized"
                    ? <button className="hub-button danger" onClick={() => void reviewProof(p.id, "returned")}>{translateUi("Revoke")}</button>
                    : <button className="hub-button secondary" onClick={() => void reviewProof(p.id, "approved")}>{translateUi("Recognise")}</button>)}
                </div>
              </Panel>)))}
          {translateUi(!state.proofs.some((p) => p.file) && (<Empty>{translateUi(" No ALX certificates yet. Members upload them in the ALX learning zone and they are recognised straight away. ")}</Empty>))}
        </div>))}
      {translateUi(tab === "Opportunities" && admin && <OpportunityAdmin />)}

    </>);
}
export function AnalyticsPage() {
    useSiteLanguage();
    const { state, profile, update } = useHub();
    if (profile.role !== "Administrator")
        return <Empty>{translateUi("Impact analytics is an administrator workspace.")}</Empty>;
    const completed = state.enrollments.filter((e) => e.completedAt);
    const activeIds = new Set([
        ...state.enrollments.map((e) => e.memberId),
        ...state.activities.flatMap((a) => a.attendees),
        ...state.sessions.map((s) => s.memberId),
    ]);
    const activeClubs = clubs.filter((c) => state.profiles.some((p) => p.clubIds.includes(c.id)));
    const employment = state.outcomes.filter((o) => ["Employment", "Internship", "Apprenticeship"].includes(o.type));
    const metrics = [
        {
            label: "Total members",
            value: state.profiles.filter((p) => p.membership === "Approved").length,
        },
        { label: "Active members", value: activeIds.size },
        { label: "Courses completed", value: completed.length },
        { label: "Certificates issued", value: state.certificates.length + state.schoolRecords.requests.filter(r => r.status === "Issued").reduce((n, r) => n + r.members.length, 0) },
        { label: "Active clubs", value: activeClubs.length },
        {
            label: "Youth reached",
            value: state.profiles.filter((p) => p.membership === "Approved" &&
                ["Student member", "University member", "Community member"].includes(p.role)).length,
        },
        { label: "Employment / placements", value: employment.length },
    ];
    return (<>
      <Heading eyebrow="MONITORING, EVALUATION & LEARNING" title={translateUi("See the difference taking shape.")} description={translateUi("Track learning, participation, and outcomes across the Hub\u2019s local records.")} action={<button className="hub-button secondary" onClick={() => downloadCSV("plp-hub-impact.csv", [
                ["Metric", "Value", "Scope"],
                ...metrics.map((m) => [
                    m.label,
                    m.value,
                    "PLP Hub records",
                ]),
            ])}>
            <BarChart3 size={17}/>{translateUi(" Export impact report ")}</button>}/>
      <p className="hub-caption">{translateUi(" These figures are calculated from PLP Hub profiles and activity. They are separate from historical figures in the organization portfolio. Active = enrolled, attended an activity, or requested mentoring. ")}</p>
      <Stats items={metrics}/>
      <div className="hub-grid two">
        <Panel>
          <h2>{translateUi("Learning by pathway")}</h2>
          {translateUi(categories.map((c) => {
            const total = state.enrollments.filter((e) => state.courses.find((x) => x.id === e.courseId)?.category === c);
            const done = total.filter((e) => e.completedAt).length;
            return (<div className="hub-space" key={c}>
                <h3>{translateUi(c)}</h3>
                <Progress label={translateUi("{p0} of {p1} enrollments completed", { p0: translateUi(done), p1: translateUi(total.length) })} value={total.length ? Math.round((done / total.length) * 100) : 0}/>
              </div>);
        }))}
        </Panel>
        <Panel>
          <h2>{translateUi("Club participation")}</h2>
          {translateUi(clubs.map((c) => (<div key={c.id} className="hub-list-row">
              <div>
                <strong>{translateUi(c.name)}</strong>
                <p className="hub-caption">
                  {translateUi(state.activities.filter((a) => a.clubId === c.id).length)}{translateUi(" ")}{translateUi(" activities \u00B7")}{translateUi(" ")}
                  {translateUi(state.activities.filter((a) => a.clubId === c.id && a.status !== "Draft").length)}{translateUi(" ")}{translateUi(" reports ")}</p>
              </div>
              <Tag>
                {translateUi(state.profiles.filter((p) => p.clubIds.includes(c.id)).length)}{translateUi(" ")}{translateUi(" members ")}</Tag>
            </div>)))}
        </Panel>
      </div>
      <Panel className="hub-space">
        <h2>{translateUi("Record a member outcome")}</h2>
        <p>{translateUi(" Capture a placement, venture, or community outcome for donor reporting. ")}</p>
        <form className="hub-form" onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const f = new FormData(form);
            if (update((s) => {
                s.outcomes.push({
                    id: uid(),
                    memberId: String(f.get("memberId")),
                    type: String(f.get("type")),
                    detail: String(f.get("detail")).trim(),
                    date: String(f.get("date")),
                });
            }))
                form.reset();
        }}>
          <div className="hub-grid two">
            <Field label={translateUi("Member")}>
              <select name="memberId">
                {translateUi(state.profiles.map((p) => (<option key={p.id} value={p.id}>
                    {translateUi(p.name)}
                  </option>)))}
              </select>
            </Field>
            <Field label={translateUi("Outcome type")}>
              <select name="type">
                {translateUi([
            "Employment",
            "Internship",
            "Apprenticeship",
            "Venture launched",
            "Community impact",
        ].map((t) => (<option key={t} value={t}>{translateUi(t)}</option>)))}
              </select>
            </Field>
          </div>
          <Field label={translateUi("Outcome date")}>
            <input name="date" type="date" max={today()} required/>
          </Field>
          <Field label={translateUi("Outcome details")}>
            <textarea name="detail" required minLength={15} maxLength={2000}/>
          </Field>
          <button className="hub-button">
            <Users size={17}/>{translateUi(" Record outcome ")}</button>
        </form>
      </Panel>
      <h2 className="hub-section-title">{translateUi("Outcome records")}</h2>
      {translateUi(state.outcomes.length ? (<Panel>
          {translateUi(state.outcomes.map((o) => (<div className="hub-list-row" key={o.id}>
              <div>
                <h3>{translateUi(state.profiles.find((p) => p.id === o.memberId)?.name)}</h3>
                <p>{translateUi(o.detail)}</p>
                <p className="hub-caption">{translateUi(o.date)}</p>
              </div>
              <Tag>{translateUi(o.type)}</Tag>
            </div>)))}
        </Panel>) : (<Empty>{translateUi("No outcomes recorded yet.")}</Empty>))}
    </>);
}
