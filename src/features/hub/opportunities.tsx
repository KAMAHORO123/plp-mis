import { ApplicantEmailDialog } from "./applicant-email";
import { HelpChat } from "./faq-chat";
import { translateUi, useSiteLanguage } from '../../i18n/language';
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useLiveTick } from './live';
import { Award, Bookmark, BriefcaseBusiness, CalendarDays, CheckCircle2, Clock3, ExternalLink, Eye, Mail, EyeOff, FilePenLine, GraduationCap, HandCoins, Lightbulb, MapPin, Megaphone, Plus, Send, Trash2, Trophy, Users, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { confirmAction } from "@/components/shared/confirm-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { opportunityTypes, type Opportunity } from "./data";
import { platformApi, uploadFile } from "./platform-api";
import { useHub, today } from "./store";
import { Empty, Field, Heading, SearchBox, Stats } from "./ui";
import { Link, useSearchParams } from "react-router-dom";
import { MembershipsPage } from "./memberships";
import { RecordTable, usePaged, Pager } from "./management-ui";
import "./workspaces.css";
const typeIcon: Record<string, LucideIcon> = { Internship: BriefcaseBusiness, Scholarship: GraduationCap, Job: BriefcaseBusiness, Fellowship: Award, Competition: Trophy, Grant: HandCoins, Volunteering: Users, "Conference & Summit": Megaphone, Training: Lightbulb };
const DOCS = ["CV", "Cover letter", "Supporting letter"] as const;
const isHttps = (v: string) => { try {
    return new URL(v).protocol === "https:";
}
catch {
    return false;
} };
const daysLeft = (deadline: string) => Math.ceil((new Date(`${deadline}T23:59:59`).getTime() - Date.now()) / 86400000);
const deadlineLabel = (deadline: string) => { const d = daysLeft(deadline); return d < 0 ? "Closed" : d === 0 ? "Closes today" : d === 1 ? "1 day left" : d <= 14 ? `${d} days left` : `Apply by ${new Date(`${deadline}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`; };
const shortDate = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
const external = (o: Opportunity) => o.applyMode === "external" && !!o.applyUrl;
const hostOf = (url = "") => { try {
    return new URL(url).hostname.replace(/^www\./, "");
}
catch {
    return "";
} };
type ServerOpportunity = Opportunity & {
    version: number;
};
type Application = {
    id: string;
    memberId: string;
    opportunityId: string;
    note: string;
    external: boolean;
    date: string;
    documents: {
        kind: string;
        id: string;
    }[];
    status: ReviewStatus;
    feedback: string;
    version: number;
    data: ApplicationData;
};
type ReviewStatus = "pending" | "approved" | "rejected";
const reviewLabel: Record<ReviewStatus, string> = { pending: "Awaiting review", approved: "Accepted", rejected: "Not selected" };
type RecordRow<T> = {
    id: string;
    owner_id: string;
    version: number;
    created_at: string;
    data: T;
};
type OpportunityData = {
    title: string;
    description: string;
    organization?: string;
    location?: string;
    deadline?: string;
    eligibility?: string;
    opportunity_type?: string;
    format?: Opportunity["format"];
    commitment?: string;
    apply_mode?: "internal" | "external";
    url?: string;
    published?: boolean;
};
type ApplicationData = {
    title: string;
    description: string;
    reference_id?: string;
    external?: boolean;
    attachments?: string[];
    category?: string;
    status?: string;
    feedback?: string;
};
/** Opportunities and applications live on the platform so every member sees what administrators publish. */
function useOpportunityData() {
    const [opportunities, setOpportunities] = useState<ServerOpportunity[]>([]), [applications, setApplications] = useState<Application[]>([]), [loaded, setLoaded] = useState(false);
    const reload = useCallback(async () => {
        try {
            const [rows, apps] = await Promise.all([platformApi<RecordRow<OpportunityData>[]>("/records/opportunities"), platformApi<RecordRow<ApplicationData>[]>("/records/applications")]);
            setOpportunities(rows.map((r) => ({ id: r.id, version: r.version, title: r.data.title, type: r.data.opportunity_type || "Opportunity", organization: r.data.organization || "", location: r.data.location || "", deadline: r.data.deadline || today(), description: r.data.description, eligibility: r.data.eligibility || "", published: !!r.data.published, format: r.data.format, commitment: r.data.commitment, applyMode: r.data.apply_mode, applyUrl: r.data.url })));
            setApplications(apps.filter((a) => a.data.reference_id && !/^(join|activity):/.test(a.data.category ?? "")).map((a) => { const kinds = (a.data.category || "").split(",").filter(Boolean); return { id: a.id, memberId: a.owner_id, opportunityId: a.data.reference_id!, note: a.data.description, external: !!a.data.external, date: a.created_at.slice(0, 10), documents: (a.data.attachments || []).map((id, i) => ({ id, kind: kinds[i] || `Document ${i + 1}` })), status: (["approved", "rejected"].includes(a.data.status ?? "") ? a.data.status : "pending") as ReviewStatus, feedback: a.data.feedback ?? "", version: a.version, data: a.data }; }));
        }
        catch (e) {
            toast.error(translateUi((e as Error).message));
        }
        finally {
            setLoaded(true);
        }
    }, []);
    const live = useLiveTick();
    useEffect(() => { void reload(); }, [reload, live]);
    return { opportunities, applications, loaded, reload };
}
const toData = (o: Opportunity): OpportunityData => ({ title: o.title, description: o.description, organization: o.organization, location: o.location, deadline: o.deadline, eligibility: o.eligibility, opportunity_type: o.type, format: o.format, ...(o.commitment ? { commitment: o.commitment } : {}), apply_mode: o.applyMode ?? "internal", ...(o.applyUrl ? { url: o.applyUrl } : {}), published: o.published });
function Modal({ title, description, onClose, children }: {
    title: string;
    description?: string;
    onClose: () => void;
    children: ReactNode;
}) {
    useSiteLanguage();
    return (<Dialog open onOpenChange={(o) => { if (!o)
        onClose(); }}>
      <DialogContent className="hub-app hub-dialog max-h-[90vh] overflow-y-auto">
        <DialogTitle>{translateUi(title)}</DialogTitle>
        {translateUi(description && <DialogDescription>{translateUi(description)}</DialogDescription>)}
        {translateUi(children)}
      </DialogContent>
    </Dialog>);
}
const DocumentLinks = ({ documents }: {
    documents: Application["documents"];
}) => {
    useSiteLanguage();
    return <>{translateUi(documents.map((d) => <p key={d.id}><a className="hub-text-link" href={`/api/files/${d.id}`}>{translateUi(d.kind)}</a></p>))}</>;
};
export function OpportunitiesPage() {
    useSiteLanguage();
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
    const list = (tab === "My applications" ? opportunities.filter((o) => !!application(o)) : published)
        .filter((o) => (type === "All" || o.type === type) && (format === "Any format" || (o.format ?? "On-site") === format) && `${o.title} ${o.organization} ${o.location} ${o.description}`.toLowerCase().includes(search.toLowerCase()))
        .filter((o) => tab === "Explore" ? daysLeft(o.deadline) >= 0 : tab === "Saved" ? saved(o) : !!application(o))
        .sort((a, b) => a.deadline.localeCompare(b.deadline));
    const opportunityPage = usePaged(list, 8, `${search}|${type}|${format}|${tab}`);
    const toggleSave = (o: Opportunity) => {
        const was = saved(o);
        if (update((s) => { s.saved = s.saved.filter((x) => !(x.memberId === profile.id && x.opportunityId === o.id)); if (!was)
            s.saved.push({ memberId: profile.id, opportunityId: o.id }); }))
            toast.success(translateUi(was ? "Removed from saved" : "Saved to your shortlist"));
    };
    const submit = async (body: ApplicationData) => {
        setBusy(true);
        try {
            await platformApi("/records/applications", "POST", body);
            await reload();
            return true;
        }
        catch (e) {
            toast.error(translateUi((e as Error).message));
            return false;
        }
        finally {
            setBusy(false);
        }
    };
    const recordExternal = async (o: Opportunity) => {
        if (await submit({ title: o.title, reference_id: o.id, description: `Applied on ${hostOf(o.applyUrl)}`, external: true }))
            toast.success(translateUi("Marked as applied. Track it under My applications."));
    };
    const withdraw = async (o: Opportunity) => {
        const a = application(o);
        if (!a || !await confirmAction({ title: external(o) ? "Remove from your tracker?" : "Withdraw this application?", description: external(o) ? "This only removes it here; contact the organiser to withdraw your external application." : "Your application and its documents will be withdrawn.", confirmLabel: "Remove", destructive: true }))
            return;
        try {
            await platformApi(`/records/applications/${a.id}`, "DELETE");
            await reload();
            toast.success(translateUi("Application removed"));
        }
        catch (e) {
            toast.error(translateUi((e as Error).message));
        }
    };
    const cta = (o: Opportunity) => {
        const applied = application(o), closed = daysLeft(o.deadline) < 0;
        if (applied)
            return <span className={`op-applied is-${applied.external ? "external" : applied.status}`}><CheckCircle2 size={15}/>{translateUi(applied.external ? "Applied {p0}" : applied.status === "pending" ? "Awaiting review · applied {p0}" : applied.status === "approved" ? "Accepted" : "Not selected", { p0: shortDate(applied.date) })}</span>;
        if (closed)
            return <span className="op-closed">{translateUi("Applications closed")}</span>;
        return external(o)
            ? <a className="hub-button" href={o.applyUrl} target="_blank" rel="noopener noreferrer" onClick={() => setTimeout(() => setViewing(o), 400)}>{translateUi("Apply on ")}{translateUi(hostOf(o.applyUrl))} <ExternalLink size={14}/></a>
            : <button className="hub-button" onClick={() => setApplying(o)}><Send size={14}/>{translateUi(" Apply now")}</button>;
    };
    return (<div className="ws-page opportunities-page">
      <HelpChat opportunities/>
      <Heading eyebrow="PLP CONNECT" title={translateUi("Opportunities")} description={translateUi("Find your next role, scholarship or learning experience.")}/>
      <div className="ws-stats">
        <StatCard label={translateUi("Open opportunities")} value={String(open.length)} icon={BriefcaseBusiness}/>
        <StatCard label={translateUi("Closing this week")} value={String(open.filter((o) => daysLeft(o.deadline) <= 7).length)} icon={Clock3}/>
        <StatCard label={translateUi("Saved")} value={String(savedCount)} icon={Bookmark}/>
        <StatCard label={translateUi("My applications")} value={String(mine.length)} icon={Send}/>
      </div>
      <div className="ws-tabs" role="tablist">
        {translateUi([["Explore", open.length], ["Saved", savedCount], ["My applications", mine.length]].map(([t, n]) => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "active" : ""} onClick={() => setTab(String(t))}>{translateUi(t)}<span>{translateUi(n)}</span></button>))}
      </div>
      <div className="op-filters">
        <SearchBox value={search} onChange={setSearch} placeholder={translateUi("Search by role, organisation or place")}/>
        <select aria-label={translateUi("Work format")} value={format} onChange={(e) => setFormat(e.target.value)}>{translateUi(["Any format", "On-site", "Remote", "Hybrid"].map((f) => <option key={f} value={f}>{translateUi(f)}</option>))}</select>
      </div>
      <div className="op-types" aria-label={translateUi("Opportunity types")}>
        {translateUi(["All", ...opportunityTypes].map((t) => { return <button key={t} className={type === t ? "active" : ""} onClick={() => setType(t)}>{translateUi(t)}</button>; }))}
      </div>
      {translateUi(!loaded ? <p role="status">{translateUi("Loading opportunities\u2026")}</p> : list.length ? (<div className="op-grid">
          {translateUi(opportunityPage.items.map((o) => {
                const Icon = typeIcon[o.type] ?? BriefcaseBusiness, left = daysLeft(o.deadline);
                return (<article key={o.id} className="op-card">
                <header>
                  <span className="op-icon"><Icon size={20}/></span>
                  <div><span className="op-type">{translateUi(o.type)}</span><span className="op-org">{translateUi(o.organization)}</span></div>
                  <button className={`op-save ${saved(o) ? "on" : ""}`} aria-label={translateUi(`${saved(o) ? "Unsave" : "Save"} ${o.title}`)} title={translateUi(saved(o) ? "Saved" : "Save")} onClick={() => toggleSave(o)}><Bookmark size={18} fill={saved(o) ? "currentColor" : "none"}/></button>
                </header>
                <h2>{translateUi(o.title)}</h2>
                <ul className="op-meta">
                  <li><MapPin size={14}/>{translateUi(o.location)}</li>
                  <li><BriefcaseBusiness size={14}/>{translateUi(o.format ?? "On-site")}{translateUi(o.commitment ? ` · ${o.commitment}` : "")}</li>
                  <li className={left < 0 ? "closed" : left <= 7 ? "urgent" : ""}><CalendarDays size={14}/>{translateUi(deadlineLabel(o.deadline))}</li>
                </ul>
                <p className="op-desc">{translateUi(o.description)}</p>
                <footer>
                  <button className="hub-text-button" onClick={() => setViewing(o)}>{translateUi("View details")}</button>
                  <div className="op-cta">{translateUi(external(o) && !application(o) && left >= 0 && <small>{translateUi("External application")}</small>)}{translateUi(cta(o))}</div>
                </footer>
              </article>);
            }))}
        </div>) : <Empty>{translateUi(tab === "Saved" ? "Save opportunities with the bookmark to build your shortlist." : tab === "My applications" ? "Applications you submit or mark as applied appear here." : published.length ? "No open opportunities match your filters. Try another type or format." : "No opportunities have been published yet. Check back soon.")}</Empty>)}

      <Pager {...opportunityPage}/>
      {translateUi(viewing && (<Modal title={translateUi(viewing.title)} description={translateUi(`${viewing.organization} · ${viewing.type}`)} onClose={() => setViewing(null)}>
          <ul className="op-meta hub-space">
            <li><MapPin size={14}/>{translateUi(viewing.location)}</li>
            <li><BriefcaseBusiness size={14}/>{translateUi(viewing.format ?? "On-site")}{translateUi(viewing.commitment ? ` · ${viewing.commitment}` : "")}</li>
            <li><CalendarDays size={14}/>{translateUi(deadlineLabel(viewing.deadline))}</li>
          </ul>
          <h3 className="op-h3">{translateUi("About the opportunity")}</h3><p className="hub-prewrap">{translateUi(viewing.description)}</p>
          <h3 className="op-h3">{translateUi("Who can apply")}</h3><p className="hub-prewrap">{translateUi(viewing.eligibility)}</p>
          {translateUi(application(viewing) ? (<div className="op-external hub-space">
              <span className="op-applied"><CheckCircle2 size={15}/> {translateUi(external(viewing) ? "Marked as applied" : "Applied")} {shortDate(application(viewing)!.date)}</span>
              {!external(viewing) && <p className="op-status-line">{translateUi("Status")}: <strong>{translateUi(reviewLabel[application(viewing)!.status])}</strong></p>}
              {application(viewing)!.feedback && <div className="op-feedback"><strong>{translateUi("Message from PLP")}</strong><p className="hub-prewrap">{application(viewing)!.feedback}</p></div>}
              {translateUi(!external(viewing) && <><p className="hub-prewrap">{translateUi(application(viewing)!.note)}</p><DocumentLinks documents={application(viewing)!.documents}/></>)}
              {(external(viewing) || application(viewing)!.status === "pending") && <div className="hub-actions"><button className="hub-button danger" onClick={() => { const o = viewing; setViewing(null); void withdraw(o); }}>{translateUi(external(viewing) ? "Remove from tracker" : "Withdraw application")}</button></div>}
            </div>) : daysLeft(viewing.deadline) < 0 ? <p className="op-closed hub-space">{translateUi("Applications are closed.")}</p> : external(viewing) ? (<div className="op-external hub-space">
              <p>{translateUi("Applications are handled by ")}<strong>{translateUi(viewing.organization)}</strong>{translateUi(" on ")}<strong>{translateUi(hostOf(viewing.applyUrl))}</strong>{translateUi(". After you apply there, record it here so you can track it.")}</p>
              <div className="hub-actions">
                <a className="hub-button" href={viewing.applyUrl} target="_blank" rel="noopener noreferrer">{translateUi("Go to application ")}<ExternalLink size={14}/></a>
                <button className="hub-button secondary" disabled={busy} onClick={async () => { const o = viewing; setViewing(null); await recordExternal(o); }}><CheckCircle2 size={14}/>{translateUi(" I've applied")}</button>
              </div>
            </div>) : <div className="hub-actions hub-dialog-actions"><button className="hub-button" onClick={() => { setApplying(viewing); setViewing(null); }}><Send size={14}/>{translateUi(" Apply now")}</button></div>)}
        </Modal>))}
      {translateUi(applying && (<Modal title={translateUi("Apply: {p0}", { p0: translateUi(applying.title) })} description={translateUi("{p0} reviews applications submitted through PLP.", { p0: translateUi(applying.organization) })} onClose={() => setApplying(null)}>
          <form className="hub-form hub-space" onSubmit={async (e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget), o = applying, kinds: string[] = [], attachments: string[] = [];
                setBusy(true);
                try {
                    for (const kind of DOCS) {
                        const file = f.get(kind) as File;
                        if (file?.size) {
                            if (file.size > 5 * 1024 * 1024)
                                throw new Error(`${kind} must be 5 MB or smaller.`);
                            attachments.push(await uploadFile(file));
                            kinds.push(kind);
                        }
                    }
                }
                catch (err) {
                    setBusy(false);
                    return toast.error(translateUi((err as Error).message));
                }
                setBusy(false);
                if (await submit({ title: o.title, reference_id: o.id, description: String(f.get("note")).trim(), attachments, category: kinds.join(",") })) {
                    toast.success(translateUi("Application submitted"));
                    setApplying(null);
                }
            }}>
            <Field label={translateUi("Why are you a good fit?")}><textarea name="note" required minLength={20} maxLength={1500} rows={5} placeholder={translateUi("Share your motivation and relevant experience.")}/></Field>
            {translateUi(DOCS.map((kind) => <Field key={kind} label={translateUi(`${kind}${kind === "CV" ? "" : " (optional)"}`)}><input type="file" name={kind} required={kind === "CV"} accept=".pdf,.png,.jpg,.jpeg"/></Field>))}
            <p className="hub-caption">{translateUi("PDF, PNG or JPEG \u00B7 up to 5 MB per file.")}</p>
            <div className="hub-actions hub-dialog-actions"><button type="button" className="hub-button secondary" onClick={() => setApplying(null)}>{translateUi("Cancel")}</button><button className="hub-button" disabled={busy}><Send size={14}/> {translateUi(busy ? "Submitting…" : "Submit application")}</button></div>
          </form>
        </Modal>))}
    </div>);
}
/** Administrator CRUD for opportunities, including external application links and applicant review. */
export function OpportunityAdmin() {
    useSiteLanguage();
    const { opportunities, applications, reload } = useOpportunityData();
    const [people, setPeople] = useState<{
        id: string;
        name: string;
        email: string;
    }[]>([]);
    const [editing, setEditing] = useState<ServerOpportunity | "new" | null>(null), [applicants, setApplicants] = useState<ServerOpportunity | null>(null);
    const [mode, setMode] = useState<"internal" | "external">("internal"), [busy, setBusy] = useState(false);
    useEffect(() => { platformApi<{
        id: string;
        name: string;
        email: string;
    }[]>("/users").then(setPeople).catch(() => { }); }, []);
    const count = (o: Opportunity) => applications.filter((a) => a.opportunityId === o.id).length;
    const waiting = applications.filter((a) => a.status === "pending" && !a.external).length;
    const current = editing && editing !== "new" ? editing : null;
    const startEdit = (o: ServerOpportunity | "new") => { setEditing(o); setMode(o !== "new" && o.applyMode === "external" ? "external" : "internal"); };
    const save = async (o: Opportunity, version?: number) => {
        setBusy(true);
        try {
            if (version)
                await platformApi(`/records/opportunities/${o.id}`, "PUT", { version, data: toData(o) });
            else
                await platformApi("/records/opportunities", "POST", toData(o));
            await reload();
            return true;
        }
        catch (e) {
            toast.error(translateUi((e as Error).message));
            return false;
        }
        finally {
            setBusy(false);
        }
    };
    // Publishing or hiding many at once; each is saved on its own so one conflict never blocks the rest.
    const setPublished = async (rows: ServerOpportunity[], published: boolean) => {
        const changing = rows.filter((r) => r.published !== published);
        if (!changing.length)
            return toast.info(translateUi(published ? "Those opportunities are already published." : "Those opportunities are already hidden."));
        if (!published && !await confirmAction({ title: `Hide ${changing.length} ${changing.length === 1 ? "opportunity" : "opportunities"} from members?`, description: "Members can no longer find or apply to them. Existing applications are kept.", confirmLabel: "Hide" }))
            return;
        let done = 0;
        for (const o of changing) {
            try {
                await platformApi(`/records/opportunities/${o.id}`, "PUT", { version: o.version, data: toData({ ...o, published }) });
                done++;
            }
            catch { /* Counted below. */ }
        }
        await reload();
        if (done)
            toast.success(translateUi(published ? "{p0} published" : "{p0} hidden from members", { p0: done === 1 ? "1 opportunity" : `${done} opportunities` }));
        if (done < changing.length)
            toast.error(translateUi("{p0} could not be updated. Reload and try again.", { p0: changing.length - done }));
    };
    const removeMany = async (rows: ServerOpportunity[]) => {
        const free = rows.filter((o) => !count(o));
        if (!free.length)
            return toast.error(translateUi("Those opportunities have applications. Hide them instead so members keep their records."));
        if (!await confirmAction({ title: `Delete ${free.length} ${free.length === 1 ? "opportunity" : "opportunities"}?`, description: rows.length > free.length ? `${rows.length - free.length} selected have applications and will be kept.` : "They are removed for everyone.", confirmLabel: `Delete ${free.length}`, destructive: true }))
            return;
        let done = 0;
        for (const o of free) { try { await platformApi(`/records/opportunities/${o.id}`, "DELETE"); done++; } catch { /* Counted below. */ } }
        await reload();
        if (done) toast.success(translateUi("{p0} deleted", { p0: done === 1 ? "1 opportunity" : `${done} opportunities` }));
        if (done < free.length) toast.error(translateUi("{p0} could not be deleted.", { p0: free.length - done }));
    };
    const remove = async (o: ServerOpportunity) => {
        if (count(o))
            return toast.error(translateUi("This opportunity has applications. Unpublish it instead so members keep their records."));
        if (!await confirmAction({ title: `Delete “${o.title}”?`, description: "It is removed for everyone.", confirmLabel: "Delete", destructive: true }))
            return;
        try {
            await platformApi(`/records/opportunities/${o.id}`, "DELETE");
            await reload();
            toast.success(translateUi("Opportunity deleted"));
        }
        catch (e) {
            toast.error(translateUi((e as Error).message));
        }
    };
    return (<div className="hub-stack">
      {translateUi(waiting > 0 && <div className="act-review-callout" role="status"><Send size={20}/><div><strong>{translateUi("{p0} applications waiting for review", { p0: waiting })}</strong></div><Link className="hub-button" to="/applications">{translateUi("Review applications")}</Link></div>)}
      <div className="ws-panel-title"><div><h2>{translateUi("Opportunities ")}<span className="ws-count">{translateUi(opportunities.length)}</span></h2><p className="hub-caption">{translateUi("Publish roles that members apply for through PLP, or link to an organiser's own application page.")}</p></div><button className="hub-button" onClick={() => startEdit("new")}><Plus size={16}/>{translateUi(" Add opportunity")}</button></div>
      {translateUi(opportunities.length ? <div className="ws-table-wrap"><RecordTable title="opportunities" rows={[...opportunities].sort((a, b) => a.deadline.localeCompare(b.deadline))} bulkActions={[{ label: "Publish", run: (rows) => setPublished(rows, true) }, { label: "Hide", tone: "danger", run: (rows) => setPublished(rows, false) }, { label: "Delete", tone: "danger", run: removeMany }]} searchText={o=>`${o.title} ${o.organization} ${o.location} ${o.type}`} filters={[{label:'Availability',options:[{label:'Published',test:(o:Opportunity)=>o.published},{label:'Hidden',test:(o:Opportunity)=>!o.published},{label:'Closing this week',test:(o:Opportunity)=>daysLeft(o.deadline)>=0&&daysLeft(o.deadline)<=7}]}]} columns={[{label:translateUi("Opportunity"),render:(o)=>{return <><strong>{translateUi(o.title)}</strong><small>{translateUi(o.type)}{translateUi(" \u00B7 ")}{translateUi(o.organization)}{translateUi(" \u00B7 ")}{translateUi(o.location)}</small></>;}},
{label:translateUi("Deadline"),render:(o)=>{return <>{translateUi(o.deadline)}<small>{translateUi(deadlineLabel(o.deadline))}</small></>;}},
{label:translateUi("How to apply"),render:(o)=>{return <>{translateUi(external(o) ? <span className="mb-role"><ExternalLink size={13}/> {translateUi(hostOf(o.applyUrl))}</span> : "Through PLP")}</>;}},
{label:translateUi("Applications"),render:(o)=>{return <><button className="hub-text-button" onClick={() => setApplicants(o)}>{translateUi(count(o))} {translateUi(external(o) ? "tracked" : "received")}</button></>;}},
{label:translateUi("Status"),render:(o)=>{return <><span className={`ws-status ${o.published ? "ws-status-issued" : "ws-status-returned"}`}>{translateUi(o.published ? "Published" : "Hidden")}</span></>;}},
{label:translateUi("Actions"),render:(o)=>{return <><div className="mb-actions">
              <button className="hub-record-icon hub-record-edit" title={translateUi("Edit")} aria-label={translateUi("Edit {p0}", { p0: translateUi(o.title) })} onClick={() => startEdit(o)}><FilePenLine size={17}/></button>
              <button className="hub-record-icon hub-record-edit" disabled={busy} title={translateUi(o.published ? "Unpublish" : "Publish")} aria-label={translateUi(`${o.published ? "Unpublish" : "Publish"} ${o.title}`)} onClick={async () => { if (await save({ ...o, published: !o.published }, o.version))
                toast.success(translateUi(o.published ? "Hidden from members" : "Published to members")); }}>{translateUi(o.published ? <EyeOff size={17}/> : <Eye size={17}/>)}</button>
              <button className="hub-record-icon hub-record-delete" title={translateUi("Delete")} aria-label={translateUi("Delete {p0}", { p0: translateUi(o.title) })} onClick={() => void remove(o)}><Trash2 size={17}/></button>
            </div></>;}}]}/></div> : <Empty>{translateUi("No opportunities yet. Add the first one for members.")}</Empty>)}
      {translateUi(editing && (<Modal title={translateUi(current ? "Edit opportunity" : "Add opportunity")} onClose={() => setEditing(null)}>
          <form className="hub-form hub-space" onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget), str = (k: string) => String(f.get(k) ?? "").trim();
                const applyUrl = mode === "external" ? str("applyUrl") : "";
                if (mode === "external" && !isHttps(applyUrl))
                    return toast.error(translateUi("Enter the organiser's application link, starting with https://"));
                const record: Opportunity = { id: current?.id ?? "", title: str("title"), type: str("type"), organization: str("organization"), location: str("location"), deadline: str("deadline"), description: str("description"), eligibility: str("eligibility"), format: str("format") as Opportunity["format"], commitment: str("commitment") || undefined, applyMode: mode, applyUrl: applyUrl || undefined, published: current?.published ?? true };
                if (await save(record, current?.version)) {
                    toast.success(translateUi(current ? "Opportunity updated" : "Opportunity published"));
                    setEditing(null);
                }
            }}>
            <Field label={translateUi("Title")}><input name="title" required minLength={3} maxLength={100} defaultValue={current?.title}/></Field>
            <div className="ws-form-grid">
              <Field label={translateUi("Type")}><select name="type" defaultValue={current?.type ?? opportunityTypes[0]}>{translateUi(opportunityTypes.map((t) => <option key={t} value={t}>{translateUi(t)}</option>))}</select></Field>
              <Field label={translateUi("Organisation")}><input name="organization" required maxLength={100} defaultValue={current?.organization}/></Field>
              <Field label={translateUi("Location")}><input name="location" required maxLength={100} defaultValue={current?.location} placeholder={translateUi("e.g. Kigali, Rwanda")}/></Field>
              <Field label={translateUi("Format")}><select name="format" defaultValue={current?.format ?? "On-site"}>{translateUi(["On-site", "Remote", "Hybrid"].map((t) => <option key={t} value={t}>{translateUi(t)}</option>))}</select></Field>
              <Field label={translateUi("Commitment (optional)")}><input name="commitment" maxLength={60} defaultValue={current?.commitment} placeholder={translateUi("e.g. Full-time \u00B7 3 months")}/></Field>
              <Field label={translateUi("Application deadline")}><input type="date" name="deadline" required min={current ? undefined : today()} defaultValue={current?.deadline}/></Field>
            </div>
            <Field label={translateUi("Description")}><textarea name="description" required minLength={20} maxLength={2500} rows={4} defaultValue={current?.description}/></Field>
            <Field label={translateUi("Eligibility")}><textarea name="eligibility" required minLength={10} maxLength={1000} rows={3} defaultValue={current?.eligibility}/></Field>
            <fieldset className="op-mode"><legend>{translateUi("How do members apply?")}</legend>
              <label className={mode === "internal" ? "on" : ""}><input type="radio" name="mode" checked={mode === "internal"} onChange={() => setMode("internal")}/><strong>{translateUi("Through PLP")}</strong><small>{translateUi("Members submit a statement and CV here; you review applicants in this table.")}</small></label>
              <label className={mode === "external" ? "on" : ""}><input type="radio" name="mode" checked={mode === "external"} onChange={() => setMode("external")}/><strong>{translateUi("On the organiser's website")}</strong><small>{translateUi("Members are sent to an external link and can mark the opportunity as applied.")}</small></label>
            </fieldset>
            {translateUi(mode === "external" && <Field label={translateUi("Application link")}><input name="applyUrl" type="url" required maxLength={500} defaultValue={current?.applyUrl} placeholder={translateUi("https://organisation.org/apply")}/></Field>)}
            <div className="hub-actions hub-dialog-actions"><button type="button" className="hub-button secondary" onClick={() => setEditing(null)}>{translateUi("Cancel")}</button><button className="hub-button" disabled={busy}>{translateUi(current ? "Save changes" : "Publish opportunity")}</button></div>
          </form>
        </Modal>))}
      {translateUi(applicants && (<Modal title={translateUi("Applicants \u00B7 {p0}", { p0: translateUi(applicants.title) })} description={translateUi(external(applicants) ? "Members who recorded that they applied on the organiser's website." : "Applications submitted through PLP.")} onClose={() => setApplicants(null)}>
          {translateUi(applications.filter((a) => a.opportunityId === applicants.id).map((a) => {
                const p = people.find((x) => x.id === a.memberId);
                return (<div key={a.id} className="ms-session hub-space">
              <div className="ms-session-head"><div><strong>{translateUi(p?.name ?? "Member")}</strong><small>{translateUi(p?.email)}{translateUi(" \u00B7 ")}{translateUi(a.date)}</small></div>{translateUi(a.external && <span className="ws-status">{translateUi("External")}</span>)}</div>
              <p className="hub-prewrap">{translateUi(a.note)}</p>
              <DocumentLinks documents={a.documents}/>
            </div>);
            }))}
          {translateUi(!applications.some((a) => a.opportunityId === applicants.id) && <Empty>{translateUi("No applications yet.")}</Empty>)}
        </Modal>))}
    </div>);
}
/** Every application submitted through PLP, in one place, so administrators can review them in batches. */
export function ApplicationsPage() {
    useSiteLanguage();
    const { opportunities, applications, reload, loaded } = useOpportunityData();
    const [feedback, setFeedback] = useState("");
    const [people, setPeople] = useState<{
        id: string;
        name: string;
        email: string;
    }[]>([]);
    useEffect(() => { platformApi<{
        id: string;
        name: string;
        email: string;
    }[]>("/users").then(setPeople).catch(() => { }); }, []);
    const count = (o: Opportunity) => applications.filter((a) => a.opportunityId === o.id).length;
    const [viewing, setViewing] = useState<Application | null>(null);
    const [emailing, setEmailing] = useState<{ rows: Application[]; template: number } | null>(null);
    const titleOf = (id: string) => opportunities.find((o) => o.id === id)?.title ?? "Opportunity";
    const nameOf = (id: string) => people.find((p) => p.id === id)?.name ?? "Member";
    // Each decision notifies the member. Rows are saved one by one so a conflict on one never blocks the rest.
    const decide = async (rows: Application[], status: ReviewStatus, note?: string) => {
        // External applications are decided by the other organisation; they can be emailed but not accepted here.
        rows = rows.filter((a) => !a.external && (a.status !== status || (note !== undefined && note !== a.feedback)));
        if (!rows.length)
            return toast.info(translateUi("Those applications already have this decision."));
        if (rows.length > 1 && status === "rejected" && !await confirmAction({ title: `Mark ${rows.length} applications as not selected?`, description: "Each applicant is notified straight away.", confirmLabel: "Mark not selected", destructive: true }))
            return;
        let done = 0;
        for (const a of rows) {
            try {
                await platformApi(`/records/applications/${a.id}`, "PUT", { version: a.version, data: { ...a.data, status, ...(note !== undefined ? { feedback: note.trim() } : {}) } });
                done++;
            }
            catch { /* Reported below; the row stays as it was. */ }
        }
        await reload();
        setViewing(null);
        if (done)
            toast.success(translateUi(status === "approved" ? "{p0} accepted" : "{p0} marked not selected", { p0: done === 1 ? "1 application" : `${done} applications` }), { action: { label: translateUi("Email them"), onClick: () => setEmailing({ rows, template: status === "approved" ? 1 : 2 }) }, duration: 10000 });
        if (done < rows.length)
            toast.error(translateUi("{p0} could not be updated. Reload and try again.", { p0: rows.length - done }));
    };
    const waiting = applications.filter((a) => a.status === "pending" && !a.external).length;
    const [params, setParams] = useSearchParams(), tab = params.get("tab") === "Staff" ? "Staff" : "Opportunities";
    return (<div className="ws-page"><Heading title={translateUi("Applications")} description={translateUi(waiting ? "{p0} waiting for review" : "All caught up.", { p0: waiting })} action={<Link className="hub-button secondary" to="/studio?tab=Opportunities">{translateUi("Manage opportunities")}</Link>}/>
      <div className="ws-tabs" role="tablist" aria-label={translateUi("Application types")}>{(["Opportunities", "Staff"] as const).map((t) => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "active" : ""} onClick={() => setParams(t === "Staff" ? { tab: t } : {}, { replace: true })}>{translateUi(t === "Staff" ? "Staff accounts" : "Opportunities")}</button>)}</div>
      {tab === "Staff" ? <MembershipsPage section="applications"/> : <>
      <Stats items={[{ label: "Waiting", value: waiting, icon: Clock3 }, { label: "Accepted", value: applications.filter((a) => a.status === "approved" && !a.external).length, icon: CheckCircle2 }, { label: "Applied externally", value: applications.filter((a) => a.external).length, icon: ExternalLink }]}/>
      <section className="hub-panel">
      {translateUi(!loaded ? <p className="hub-caption">{translateUi("Loading applications…")}</p> : applications.length ? <RecordTable title={translateUi("applications")} rows={[...applications].sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending") || b.date.localeCompare(a.date))} searchText={(a) => `${nameOf(a.memberId)} ${titleOf(a.opportunityId)} ${reviewLabel[a.status]}`} pageSize={10}
        filters={[{ label: "Status", options: [...(Object.keys(reviewLabel) as ReviewStatus[]).map((k) => ({ label: reviewLabel[k], test: (a: Application) => !a.external && a.status === k })), { label: "Applied externally", test: (a: Application) => !!a.external }] }, { label: "Opportunity", options: opportunities.filter((o) => count(o)).map((o) => ({ label: o.title, test: (a: Application) => a.opportunityId === o.id })) }]}
        csv={{ name: "plp-applications", columns: [["Applicant", (a) => nameOf(a.memberId)], ["Email", (a) => people.find((p) => p.id === a.memberId)?.email], ["Opportunity", (a) => titleOf(a.opportunityId)], ["Status", (a) => a.external ? "Applied externally" : reviewLabel[a.status]], ["Applied", (a) => a.date], ["Documents", (a) => a.documents.map((d) => d.kind).join("; ")], ["Answer", (a) => a.note]] }}
        bulkActions={[{ label: "Send email", run: (rows) => setEmailing({ rows, template: 0 }) }, { label: "Accept", run: (rows) => decide(rows, "approved") }, { label: "Not selected", tone: "danger", run: (rows) => decide(rows, "rejected") }]}
        columns={[{ label: "Applicant", render: (a) => <><strong>{translateUi(nameOf(a.memberId))}</strong><small>{shortDate(a.date)}</small></> }, { label: "Opportunity", render: (a) => titleOf(a.opportunityId) }, { label: "Status", render: (a) => <span className={`ws-status ${a.status === "approved" ? "ws-status-issued" : a.status === "rejected" ? "ws-status-returned" : ""}`}>{translateUi(a.external ? "Applied externally" : reviewLabel[a.status])}</span> }, { label: "", render: (a) => <button className="hub-text-button" onClick={() => { setViewing(a); setFeedback(a.feedback); }}>{translateUi("View")}</button> }]}/> : <Empty>{translateUi("Applications members submit appear here.")}</Empty>)}
      </section></>}
      {translateUi(viewing && (<Modal title={translateUi(nameOf(viewing.memberId))} description={translateUi("{p0} \u00B7 {p1}", { p0: translateUi(titleOf(viewing.opportunityId)), p1: shortDate(viewing.date) })} onClose={() => setViewing(null)}>
          <dl className="ae-facts"><div><dt>{translateUi("Email")}</dt><dd>{people.find((p) => p.id === viewing.memberId)?.email ?? "—"}</dd></div><div><dt>{translateUi("Status")}</dt><dd>{translateUi(viewing.external ? "Applied externally" : reviewLabel[viewing.status])}</dd></div><div><dt>{translateUi("Submitted")}</dt><dd>{new Date(`${viewing.date}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</dd></div></dl>
          <h3 className="ae-h">{translateUi("Their answer")}</h3>
          {viewing.note ? <p className="hub-prewrap ae-answer">{viewing.note}</p> : <p className="hub-caption">{translateUi("No written answer was submitted.")}</p>}
          <h3 className="ae-h">{translateUi("Submitted documents")} <span className="ws-count">{viewing.documents.length}</span></h3>
          {viewing.documents.length ? <DocumentLinks documents={viewing.documents}/> : <p className="hub-caption">{translateUi("No documents were attached.")}</p>}
          {!viewing.external && <Field label={translateUi("Message to the applicant (optional, shown with the decision)")}><textarea rows={3} maxLength={1000} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder={translateUi("For example: next steps, or why they were not selected this time.")}/></Field>}
          <button type="button" className="hub-button secondary hub-space" onClick={() => { setEmailing({ rows: [viewing], template: viewing.status === "approved" ? 1 : viewing.status === "rejected" ? 2 : 0 }); setViewing(null); }}><Mail size={15}/>{translateUi("Email applicant")}</button>
          {translateUi(!viewing.external && <div className="hub-actions hub-dialog-actions"><button className="hub-button danger" disabled={viewing.status === "rejected" && feedback === viewing.feedback} onClick={() => void decide([viewing], "rejected", feedback)}>{translateUi("Not selected")}</button><button className="hub-button" disabled={viewing.status === "approved" && feedback === viewing.feedback} onClick={() => void decide([viewing], "approved", feedback)}>{translateUi("Accept")}</button></div>)}
        </Modal>))}
      {emailing && <ApplicantEmailDialog initial={emailing.template} onClose={() => setEmailing(null)} recipients={emailing.rows.map((a) => ({ userId: a.memberId, name: nameOf(a.memberId), email: people.find((p) => p.id === a.memberId)?.email, appliedFor: titleOf(a.opportunityId) }))}/>}
    </div>);
}
