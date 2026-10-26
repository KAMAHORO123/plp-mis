import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useLiveTick } from './live';
import { Award, Bookmark, BriefcaseBusiness, CalendarDays, CheckCircle2, Clock3, ExternalLink, Eye, EyeOff, FilePenLine, GraduationCap, HandCoins, Lightbulb, MapPin, Megaphone, Plus, Send, Sparkles, Trash2, Trophy, Users, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { confirmAction } from "@/components/shared/confirm-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { opportunityTypes, type Opportunity } from "./data";
import { platformApi, uploadFile } from "./platform-api";
import { useHub, today } from "./store";
import { Empty, Field, Heading, SearchBox } from "./ui";
import "./workspaces.css";

const typeIcon: Record<string, LucideIcon> = { Internship: BriefcaseBusiness, Scholarship: GraduationCap, Job: BriefcaseBusiness, Fellowship: Award, Competition: Trophy, Grant: HandCoins, Volunteering: Users, "Conference & Summit": Megaphone, Training: Lightbulb };
const DOCS = ["CV", "Cover letter", "Supporting letter"] as const;
const isHttps = (v: string) => { try { return new URL(v).protocol === "https:"; } catch { return false; } };
const daysLeft = (deadline: string) => Math.ceil((new Date(`${deadline}T23:59:59`).getTime() - Date.now()) / 86400000);
const deadlineLabel = (deadline: string) => { const d = daysLeft(deadline); return d < 0 ? "Closed" : d === 0 ? "Closes today" : d === 1 ? "1 day left" : d <= 14 ? `${d} days left` : `Apply by ${new Date(deadline).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`; };
const external = (o: Opportunity) => o.applyMode === "external" && !!o.applyUrl;
const hostOf = (url = "") => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } };

type ServerOpportunity = Opportunity & { version: number };
type Application = { id: string; memberId: string; opportunityId: string; note: string; external: boolean; date: string; documents: { kind: string; id: string }[] };
type RecordRow<T> = { id: string; owner_id: string; version: number; created_at: string; data: T };
type OpportunityData = { title: string; description: string; organization?: string; location?: string; deadline?: string; eligibility?: string; opportunity_type?: string; format?: Opportunity["format"]; commitment?: string; apply_mode?: "internal" | "external"; url?: string; published?: boolean };
type ApplicationData = { title: string; description: string; reference_id?: string; external?: boolean; attachments?: string[]; category?: string };

/** Opportunities and applications live on the platform so every member sees what administrators publish. */
function useOpportunityData() {
  const [opportunities, setOpportunities] = useState<ServerOpportunity[]>([]), [applications, setApplications] = useState<Application[]>([]), [loaded, setLoaded] = useState(false);
  const reload = useCallback(async () => {
    try {
      const [rows, apps] = await Promise.all([platformApi<RecordRow<OpportunityData>[]>("/records/opportunities"), platformApi<RecordRow<ApplicationData>[]>("/records/applications")]);
      setOpportunities(rows.map((r) => ({ id: r.id, version: r.version, title: r.data.title, type: r.data.opportunity_type || "Opportunity", organization: r.data.organization || "", location: r.data.location || "", deadline: r.data.deadline || today(), description: r.data.description, eligibility: r.data.eligibility || "", published: !!r.data.published, format: r.data.format, commitment: r.data.commitment, applyMode: r.data.apply_mode, applyUrl: r.data.url })));
      setApplications(apps.filter((a) => a.data.reference_id && !/^(join|activity):/.test(a.data.category ?? "")).map((a) => { const kinds = (a.data.category || "").split(",").filter(Boolean); return { id: a.id, memberId: a.owner_id, opportunityId: a.data.reference_id!, note: a.data.description, external: !!a.data.external, date: a.created_at.slice(0, 10), documents: (a.data.attachments || []).map((id, i) => ({ id, kind: kinds[i] || `Document ${i + 1}` })) }; }));
    } catch (e) { toast.error((e as Error).message); } finally { setLoaded(true); }
  }, []);
  const live = useLiveTick();
  useEffect(() => { void reload(); }, [reload, live]);
  return { opportunities, applications, loaded, reload };
}
const toData = (o: Opportunity): OpportunityData => ({ title: o.title, description: o.description, organization: o.organization, location: o.location, deadline: o.deadline, eligibility: o.eligibility, opportunity_type: o.type, format: o.format, ...(o.commitment ? { commitment: o.commitment } : {}), apply_mode: o.applyMode ?? "internal", ...(o.applyUrl ? { url: o.applyUrl } : {}), published: o.published });

function Modal({ title, description, onClose, children }: { title: string; description?: string; onClose: () => void; children: ReactNode }) {
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="hub-app hub-dialog max-h-[90vh] overflow-y-auto">
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
        {children}
      </DialogContent>
    </Dialog>
  );
}
const DocumentLinks = ({ documents }: { documents: Application["documents"] }) => <>{documents.map((d) => <p key={d.id}><a className="hub-text-link" href={`/api/files/${d.id}`}>{d.kind}</a></p>)}</>;

export function OpportunitiesPage() {
  const { state, profile, update } = useHub();
  const { opportunities, applications, loaded, reload } = useOpportunityData();
  const [search, setSearch] = useState(""), [type, setType] = useState("All"), [format, setFormat] = useState("Any format"), [tab, setTab] = useState("Explore");
  const [viewing, setViewing] = useState<Opportunity | null>(null), [applying, setApplying] = useState<Opportunity | null>(null), [busy, setBusy] = useState(false);
  const saved = (o: Opportunity) => state.saved.some((s) => s.memberId === profile.id && s.opportunityId === o.id);
  const mine = applications;
  const application = (o: Opportunity) => mine.find((a) => a.opportunityId === o.id);
  const published = opportunities.filter((o) => o.published);
  const open = published.filter((o) => daysLeft(o.deadline) >= 0);
  const savedCount = published.filter(saved).length;
  const list = published
    .filter((o) => (type === "All" || o.type === type) && (format === "Any format" || (o.format ?? "On-site") === format) && `${o.title} ${o.organization} ${o.location} ${o.description}`.toLowerCase().includes(search.toLowerCase()))
    .filter((o) => tab === "Explore" ? daysLeft(o.deadline) >= 0 : tab === "Saved" ? saved(o) : !!application(o))
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
  const toggleSave = (o: Opportunity) => {
    const was = saved(o);
    if (update((s) => { s.saved = s.saved.filter((x) => !(x.memberId === profile.id && x.opportunityId === o.id)); if (!was) s.saved.push({ memberId: profile.id, opportunityId: o.id }); }))
      toast.success(was ? "Removed from saved" : "Saved to your shortlist");
  };
  const submit = async (body: ApplicationData) => {
    setBusy(true);
    try { await platformApi("/records/applications", "POST", body); await reload(); return true; }
    catch (e) { toast.error((e as Error).message); return false; } finally { setBusy(false); }
  };
  const recordExternal = async (o: Opportunity) => {
    if (await submit({ title: o.title, reference_id: o.id, description: `Applied on ${hostOf(o.applyUrl)}`, external: true })) toast.success("Marked as applied. Track it under My applications.");
  };
  const withdraw = async (o: Opportunity) => {
    const a = application(o);
    if (!a || !await confirmAction({ title: external(o) ? "Remove from your tracker?" : "Withdraw this application?", description: external(o) ? "This only removes it here; contact the organiser to withdraw your external application." : "Your application and its documents will be withdrawn.", confirmLabel: "Remove", destructive: true })) return;
    try { await platformApi(`/records/applications/${a.id}`, "DELETE"); await reload(); toast.success("Application removed"); } catch (e) { toast.error((e as Error).message); }
  };
  const cta = (o: Opportunity) => {
    const applied = application(o), closed = daysLeft(o.deadline) < 0;
    if (applied) return <span className="op-applied"><CheckCircle2 size={15} /> Applied {applied.date}</span>;
    if (closed) return <span className="op-closed">Applications closed</span>;
    return external(o)
      ? <a className="hub-button" href={o.applyUrl} target="_blank" rel="noopener noreferrer" onClick={() => setTimeout(() => setViewing(o), 400)}>Apply on {hostOf(o.applyUrl)} <ExternalLink size={14} /></a>
      : <button className="hub-button" onClick={() => setApplying(o)}><Send size={14} /> Apply now</button>;
  };
  return (
    <div className="ws-page">
      <Heading eyebrow="PLP CONNECT" title="Your next opportunity awaits." description="Internships, scholarships, fellowships and more — matched to young people in the PLP community." />
      <div className="ws-stats">
        <StatCard label="Open opportunities" value={String(open.length)} icon={Sparkles} />
        <StatCard label="Closing this week" value={String(open.filter((o) => daysLeft(o.deadline) <= 7).length)} icon={Clock3} />
        <StatCard label="Saved" value={String(savedCount)} icon={Bookmark} />
        <StatCard label="My applications" value={String(mine.length)} icon={Send} />
      </div>
      <div className="op-filters">
        <SearchBox value={search} onChange={setSearch} placeholder="Search by role, organisation or place" />
        <select aria-label="Work format" value={format} onChange={(e) => setFormat(e.target.value)}>{["Any format", "On-site", "Remote", "Hybrid"].map((f) => <option key={f}>{f}</option>)}</select>
      </div>
      <div className="op-types" aria-label="Opportunity types">
        {["All", ...opportunityTypes].map((t) => { const Icon = typeIcon[t] ?? Sparkles; return <button key={t} className={type === t ? "active" : ""} onClick={() => setType(t)}><Icon size={14} /> {t}</button>; })}
      </div>
      <div className="ws-tabs" role="tablist">
        {[["Explore", open.length], ["Saved", savedCount], ["My applications", mine.length]].map(([t, n]) => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "active" : ""} onClick={() => setTab(String(t))}>{t}<span>{n}</span></button>)}
      </div>
      {!loaded ? <p role="status">Loading opportunities…</p> : list.length ? (
        <div className="op-grid">
          {list.map((o) => {
            const Icon = typeIcon[o.type] ?? Sparkles, left = daysLeft(o.deadline);
            return (
              <article key={o.id} className="op-card">
                <header>
                  <span className="op-icon"><Icon size={20} /></span>
                  <div><span className="op-type">{o.type}</span><span className="op-org">{o.organization}</span></div>
                  <button className={`op-save ${saved(o) ? "on" : ""}`} aria-label={`${saved(o) ? "Unsave" : "Save"} ${o.title}`} title={saved(o) ? "Saved" : "Save"} onClick={() => toggleSave(o)}><Bookmark size={18} fill={saved(o) ? "currentColor" : "none"} /></button>
                </header>
                <h2>{o.title}</h2>
                <ul className="op-meta">
                  <li><MapPin size={14} />{o.location}</li>
                  <li><BriefcaseBusiness size={14} />{o.format ?? "On-site"}{o.commitment ? ` · ${o.commitment}` : ""}</li>
                  <li className={left < 0 ? "closed" : left <= 7 ? "urgent" : ""}><CalendarDays size={14} />{deadlineLabel(o.deadline)}</li>
                </ul>
                <p className="op-desc">{o.description}</p>
                <footer>
                  <button className="hub-text-button" onClick={() => setViewing(o)}>View details</button>
                  <div className="op-cta">{external(o) && !application(o) && left >= 0 && <small>External application</small>}{cta(o)}</div>
                </footer>
              </article>
            );
          })}
        </div>
      ) : <Empty>{tab === "Saved" ? "Save opportunities with the bookmark to build your shortlist." : tab === "My applications" ? "Applications you submit or mark as applied appear here." : published.length ? "No open opportunities match your filters. Try another type or format." : "No opportunities have been published yet. Check back soon."}</Empty>}

      {viewing && (
        <Modal title={viewing.title} description={`${viewing.organization} · ${viewing.type}`} onClose={() => setViewing(null)}>
          <ul className="op-meta hub-space">
            <li><MapPin size={14} />{viewing.location}</li>
            <li><BriefcaseBusiness size={14} />{viewing.format ?? "On-site"}{viewing.commitment ? ` · ${viewing.commitment}` : ""}</li>
            <li><CalendarDays size={14} />{deadlineLabel(viewing.deadline)}</li>
          </ul>
          <h3 className="op-h3">About the opportunity</h3><p className="hub-prewrap">{viewing.description}</p>
          <h3 className="op-h3">Who can apply</h3><p className="hub-prewrap">{viewing.eligibility}</p>
          {application(viewing) ? (
            <div className="op-external hub-space">
              <span className="op-applied"><CheckCircle2 size={15} /> {external(viewing) ? "Marked as applied" : "Applied"} {application(viewing)!.date}</span>
              {!external(viewing) && <><p className="hub-prewrap">{application(viewing)!.note}</p><DocumentLinks documents={application(viewing)!.documents} /></>}
              <div className="hub-actions"><button className="hub-button danger" onClick={() => { const o = viewing; setViewing(null); void withdraw(o); }}>{external(viewing) ? "Remove from tracker" : "Withdraw application"}</button></div>
            </div>
          ) : daysLeft(viewing.deadline) < 0 ? <p className="op-closed hub-space">Applications are closed.</p> : external(viewing) ? (
            <div className="op-external hub-space">
              <p>Applications are handled by <strong>{viewing.organization}</strong> on <strong>{hostOf(viewing.applyUrl)}</strong>. After you apply there, record it here so you can track it.</p>
              <div className="hub-actions">
                <a className="hub-button" href={viewing.applyUrl} target="_blank" rel="noopener noreferrer">Go to application <ExternalLink size={14} /></a>
                <button className="hub-button secondary" disabled={busy} onClick={async () => { const o = viewing; setViewing(null); await recordExternal(o); }}><CheckCircle2 size={14} /> I've applied</button>
              </div>
            </div>
          ) : <div className="hub-actions hub-dialog-actions"><button className="hub-button" onClick={() => { setApplying(viewing); setViewing(null); }}><Send size={14} /> Apply now</button></div>}
        </Modal>
      )}
      {applying && (
        <Modal title={`Apply: ${applying.title}`} description={`${applying.organization} reviews applications submitted through PLP.`} onClose={() => setApplying(null)}>
          <form className="hub-form hub-space" onSubmit={async (e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget), o = applying, kinds: string[] = [], attachments: string[] = [];
            setBusy(true);
            try {
              for (const kind of DOCS) { const file = f.get(kind) as File; if (file?.size) { if (file.size > 5 * 1024 * 1024) throw new Error(`${kind} must be 5 MB or smaller.`); attachments.push(await uploadFile(file)); kinds.push(kind); } }
            } catch (err) { setBusy(false); return toast.error((err as Error).message); }
            setBusy(false);
            if (await submit({ title: o.title, reference_id: o.id, description: String(f.get("note")).trim(), attachments, category: kinds.join(",") })) { toast.success("Application submitted"); setApplying(null); }
          }}>
            <Field label="Why are you a good fit?"><textarea name="note" required minLength={20} maxLength={1500} rows={5} placeholder="Share your motivation and relevant experience." /></Field>
            {DOCS.map((kind) => <Field key={kind} label={`${kind}${kind === "CV" ? "" : " (optional)"}`}><input type="file" name={kind} required={kind === "CV"} accept=".pdf,.png,.jpg,.jpeg" /></Field>)}
            <p className="hub-caption">PDF, PNG or JPEG · up to 5 MB per file.</p>
            <div className="hub-actions hub-dialog-actions"><button type="button" className="hub-button secondary" onClick={() => setApplying(null)}>Cancel</button><button className="hub-button" disabled={busy}><Send size={14} /> {busy ? "Submitting…" : "Submit application"}</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/** Administrator CRUD for opportunities, including external application links and applicant review. */
export function OpportunityAdmin() {
  const { opportunities, applications, reload } = useOpportunityData();
  const [people, setPeople] = useState<{ id: string; name: string; email: string }[]>([]);
  const [editing, setEditing] = useState<ServerOpportunity | "new" | null>(null), [applicants, setApplicants] = useState<ServerOpportunity | null>(null);
  const [mode, setMode] = useState<"internal" | "external">("internal"), [busy, setBusy] = useState(false);
  useEffect(() => { platformApi<{ id: string; name: string; email: string }[]>("/users").then(setPeople).catch(() => {}); }, []);
  const count = (o: Opportunity) => applications.filter((a) => a.opportunityId === o.id).length;
  const current = editing && editing !== "new" ? editing : null;
  const startEdit = (o: ServerOpportunity | "new") => { setEditing(o); setMode(o !== "new" && o.applyMode === "external" ? "external" : "internal"); };
  const save = async (o: Opportunity, version?: number) => {
    setBusy(true);
    try { if (version) await platformApi(`/records/opportunities/${o.id}`, "PUT", { version, data: toData(o) }); else await platformApi("/records/opportunities", "POST", toData(o)); await reload(); return true; }
    catch (e) { toast.error((e as Error).message); return false; } finally { setBusy(false); }
  };
  const remove = async (o: ServerOpportunity) => {
    if (count(o)) return toast.error("This opportunity has applications. Unpublish it instead so members keep their records.");
    if (!await confirmAction({ title: `Delete “${o.title}”?`, description: "It is removed for everyone.", confirmLabel: "Delete", destructive: true })) return;
    try { await platformApi(`/records/opportunities/${o.id}`, "DELETE"); await reload(); toast.success("Opportunity deleted"); } catch (e) { toast.error((e as Error).message); }
  };
  return (
    <div className="hub-stack">
      <div className="ws-panel-title"><div><h2>Opportunities <span className="ws-count">{opportunities.length}</span></h2><p className="hub-caption">Publish roles that members apply for through PLP, or link to an organiser's own application page.</p></div><button className="hub-button" onClick={() => startEdit("new")}><Plus size={16} /> Add opportunity</button></div>
      {opportunities.length ? <div className="ws-table-wrap"><table className="ws-table">
        <thead><tr><th>Opportunity</th><th>Deadline</th><th>How to apply</th><th>Applications</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{[...opportunities].sort((a, b) => a.deadline.localeCompare(b.deadline)).map((o) => (
          <tr key={o.id}>
            <td><strong>{o.title}</strong><small>{o.type} · {o.organization} · {o.location}</small></td>
            <td>{o.deadline}<small>{deadlineLabel(o.deadline)}</small></td>
            <td>{external(o) ? <span className="mb-role"><ExternalLink size={13} /> {hostOf(o.applyUrl)}</span> : "Through PLP"}</td>
            <td><button className="hub-text-button" onClick={() => setApplicants(o)}>{count(o)} {external(o) ? "tracked" : "received"}</button></td>
            <td><span className={`ws-status ${o.published ? "ws-status-issued" : "ws-status-returned"}`}>{o.published ? "Published" : "Hidden"}</span></td>
            <td><div className="mb-actions">
              <button className="hub-record-icon hub-record-edit" title="Edit" aria-label={`Edit ${o.title}`} onClick={() => startEdit(o)}><FilePenLine size={17} /></button>
              <button className="hub-record-icon hub-record-edit" disabled={busy} title={o.published ? "Unpublish" : "Publish"} aria-label={`${o.published ? "Unpublish" : "Publish"} ${o.title}`} onClick={async () => { if (await save({ ...o, published: !o.published }, o.version)) toast.success(o.published ? "Hidden from members" : "Published to members"); }}>{o.published ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              <button className="hub-record-icon hub-record-delete" title="Delete" aria-label={`Delete ${o.title}`} onClick={() => void remove(o)}><Trash2 size={17} /></button>
            </div></td>
          </tr>
        ))}</tbody>
      </table></div> : <Empty>No opportunities yet. Add the first one for members.</Empty>}
      {editing && (
        <Modal title={current ? "Edit opportunity" : "Add opportunity"} onClose={() => setEditing(null)}>
          <form className="hub-form hub-space" onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget), str = (k: string) => String(f.get(k) ?? "").trim();
            const applyUrl = mode === "external" ? str("applyUrl") : "";
            if (mode === "external" && !isHttps(applyUrl)) return toast.error("Enter the organiser's application link, starting with https://");
            const record: Opportunity = { id: current?.id ?? "", title: str("title"), type: str("type"), organization: str("organization"), location: str("location"), deadline: str("deadline"), description: str("description"), eligibility: str("eligibility"), format: str("format") as Opportunity["format"], commitment: str("commitment") || undefined, applyMode: mode, applyUrl: applyUrl || undefined, published: current?.published ?? true };
            if (await save(record, current?.version)) { toast.success(current ? "Opportunity updated" : "Opportunity published"); setEditing(null); }
          }}>
            <Field label="Title"><input name="title" required minLength={3} maxLength={100} defaultValue={current?.title} /></Field>
            <div className="ws-form-grid">
              <Field label="Type"><select name="type" defaultValue={current?.type ?? opportunityTypes[0]}>{opportunityTypes.map((t) => <option key={t}>{t}</option>)}</select></Field>
              <Field label="Organisation"><input name="organization" required maxLength={100} defaultValue={current?.organization} /></Field>
              <Field label="Location"><input name="location" required maxLength={100} defaultValue={current?.location} placeholder="e.g. Kigali, Rwanda" /></Field>
              <Field label="Format"><select name="format" defaultValue={current?.format ?? "On-site"}>{["On-site", "Remote", "Hybrid"].map((t) => <option key={t}>{t}</option>)}</select></Field>
              <Field label="Commitment (optional)"><input name="commitment" maxLength={60} defaultValue={current?.commitment} placeholder="e.g. Full-time · 3 months" /></Field>
              <Field label="Application deadline"><input type="date" name="deadline" required min={current ? undefined : today()} defaultValue={current?.deadline} /></Field>
            </div>
            <Field label="Description"><textarea name="description" required minLength={20} maxLength={2500} rows={4} defaultValue={current?.description} /></Field>
            <Field label="Eligibility"><textarea name="eligibility" required minLength={10} maxLength={1000} rows={3} defaultValue={current?.eligibility} /></Field>
            <fieldset className="op-mode"><legend>How do members apply?</legend>
              <label className={mode === "internal" ? "on" : ""}><input type="radio" name="mode" checked={mode === "internal"} onChange={() => setMode("internal")} /><strong>Through PLP</strong><small>Members submit a statement and CV here; you review applicants in this table.</small></label>
              <label className={mode === "external" ? "on" : ""}><input type="radio" name="mode" checked={mode === "external"} onChange={() => setMode("external")} /><strong>On the organiser's website</strong><small>Members are sent to an external link and can mark the opportunity as applied.</small></label>
            </fieldset>
            {mode === "external" && <Field label="Application link"><input name="applyUrl" type="url" required maxLength={500} defaultValue={current?.applyUrl} placeholder="https://organisation.org/apply" /></Field>}
            <div className="hub-actions hub-dialog-actions"><button type="button" className="hub-button secondary" onClick={() => setEditing(null)}>Cancel</button><button className="hub-button" disabled={busy}>{current ? "Save changes" : "Publish opportunity"}</button></div>
          </form>
        </Modal>
      )}
      {applicants && (
        <Modal title={`Applicants · ${applicants.title}`} description={external(applicants) ? "Members who recorded that they applied on the organiser's website." : "Applications submitted through PLP."} onClose={() => setApplicants(null)}>
          {applications.filter((a) => a.opportunityId === applicants.id).map((a) => { const p = people.find((x) => x.id === a.memberId); return (
            <div key={a.id} className="ms-session hub-space">
              <div className="ms-session-head"><div><strong>{p?.name ?? "Member"}</strong><small>{p?.email} · {a.date}</small></div>{a.external && <span className="ws-status">External</span>}</div>
              <p className="hub-prewrap">{a.note}</p>
              <DocumentLinks documents={a.documents} />
            </div>
          ); })}
          {!applications.some((a) => a.opportunityId === applicants.id) && <Empty>No applications yet.</Empty>}
        </Modal>
      )}
    </div>
  );
}
