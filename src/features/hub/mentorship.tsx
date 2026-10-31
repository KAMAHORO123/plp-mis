import { RecordTable, usePaged, Pager } from "./management-ui";
import { CalendarDownload, DueBadge } from "./session-calendar";
import { translateUi, useSiteLanguage } from '../../i18n/language';
import { useState, type FormEvent, type ReactNode } from "react";
import { CalendarClock, CheckCircle2, Clock3, FilePenLine, HeartHandshake, Inbox, NotebookPen, PauseCircle, PlayCircle, UserRoundCheck, Users, Video, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { confirmAction } from "@/components/shared/confirm-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { categories, type Mentor } from "./data";
import { useHub, uid, type HubState, type MentorshipEmail, type Profile, type Session } from "./store";
import { sendMentorshipEmail } from "./mentor-mail";
import { platformApi } from "./platform-api";
import { ProfilePhoto } from "./profile-photo";
import { Empty, Field, Heading, Panel, SearchBox, Tag, greeting, dashboardSubtitle } from "./ui";
import "./workspaces.css";
const toLocalInput = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const nowLocal = () => toLocalInput(new Date(Date.now() + 60000));
const when = (date: string) => new Date(date).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const relative = (date: string) => {
    const days = Math.round((new Date(date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
    return days === 0 ? "Today" : days === 1 ? "Tomorrow" : days > 1 ? `In ${days} days` : `${-days} day${days === -1 ? "" : "s"} ago`;
};
const statusClass: Record<Session["status"], string> = { Requested: "", Confirmed: "ws-status-issued", Completed: "ws-status-issued", Declined: "ws-status-returned", Cancelled: "ws-status-returned" };
const isHttps = (v: string) => { try {
    return new URL(v).protocol === "https:";
}
catch {
    return false;
} };
const looksLikeLink = (v: string) => /^[a-z][a-z0-9+.-]*:/i.test(v);
const sessionFilters = [
  { label: 'Status', options: ['Requested','Confirmed','Completed','Declined','Cancelled'].map(status => ({label: status,test:(s:Session)=>s.status===status})) },
  { label: 'Format', options: ['Online','In person','Visit'].map(kind => ({label:kind,test:(s:Session)=>(s.sessionType||'Online')===kind})) },
  { label: 'Time', options: [{label:'Next 7 days',test:(s:Session)=>Date.parse(s.date)>Date.now()&&Date.parse(s.date)<Date.now()+7*86400000},{label:'Next 30 days',test:(s:Session)=>Date.parse(s.date)>Date.now()&&Date.parse(s.date)<Date.now()+30*86400000}] }
];
const sessionFields = (f:FormData) => ({sessionType:String(f.get('sessionType')||'Online') as Session['sessionType'],location:String(f.get('location')||'').trim(),meetingLink:String(f.get('meetingLink')||'').trim()});
function SessionFields({session, initialType = "Online"}:{session?:Session; initialType?:Session["sessionType"]}) {
  return <><Field label={translateUi('Session format')}><select name="sessionType" aria-label={translateUi("Session format")} defaultValue={session?.sessionType||initialType}>{["Online","In person","Visit"].map(value=><option key={value} value={value}>{translateUi(value)}</option>)}</select></Field>
    <Field label={translateUi('Google Meet or HTTPS link (optional)')}><input name="meetingLink" type="url" pattern="https://.*" maxLength={300} defaultValue={isHttps(session?.meetingLink||'')?session?.meetingLink:''} placeholder="https://meet.google.com/…"/></Field>
    <Field label={translateUi('Location or visit address (optional)')}><input name="location" maxLength={300} defaultValue={session?.location||(!isHttps(session?.meetingLink||'')?session?.meetingLink:'')} placeholder={translateUi('Office, school or meeting point')}/></Field>
    <p className="hub-caption">{translateUi('Visits are confirmed by the mentor. Meeting details can be agreed later.')}</p></>;
}
export function mentorFor(state: HubState, profile: Profile) {
    return state.mentors.find((m) => m.email.toLowerCase() === profile.email.toLowerCase());
}
function FormDialog({ title, description, submitLabel, destructive, onClose, onSubmit, children }: {
    title: string;
    description?: string;
    submitLabel: string;
    destructive?: boolean;
    onClose: () => void;
    onSubmit: (f: FormData) => Promise<boolean | void> | boolean | void;
    children: ReactNode;
}) {
    useSiteLanguage();
    const [busy, setBusy] = useState(false);
    const submit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setBusy(true);
        try {
            if ((await onSubmit(new FormData(e.currentTarget))) !== false)
                onClose();
        }
        finally {
            setBusy(false);
        }
    };
    return (<Dialog open onOpenChange={(o) => { if (!o && !busy)
        onClose(); }}>
      <DialogContent className="hub-app hub-dialog max-h-[90vh] overflow-y-auto">
        <DialogTitle>{translateUi(title)}</DialogTitle>
        {translateUi(description && <DialogDescription>{translateUi(description)}</DialogDescription>)}
        <form className="hub-form hub-space" onSubmit={submit}>
          {translateUi(children)}
          <div className="hub-actions hub-dialog-actions">
            <button type="button" className="hub-button secondary" disabled={busy} onClick={onClose}>{translateUi("Cancel")}</button>
            <button className={`hub-button ${destructive ? "danger" : ""}`} disabled={busy}>{translateUi(busy ? "Saving…" : submitLabel)}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>);
}
const StatusBadge = ({ status }: {
    status: Session["status"];
}) => {
    useSiteLanguage();
    return <span className={`ws-status ${statusClass[status]}`}>{translateUi(status)}</span>;
};
const MeetingLink = ({ link }: {
    link: string;
}) => {
    useSiteLanguage();
    return isHttps(link) ? <a className="hub-text-link" href={link} target="_blank" rel="noreferrer">{translateUi("Join meeting")}</a> : <span>{translateUi(link)}</span>;
};
/** Sends a session change to the platform first; the screen only changes once the server has accepted it. */
function useSessionAction() {
    const { state, update } = useHub();
    return async (kind: MentorshipEmail["kind"], next: Session, note = "") => {
        const mentor = state.mentors.find((m) => m.id === next.mentorId);
        const mentee = state.profiles.find((p) => p.id === next.memberId);
        if (!mentor || !mentee) {
            toast.error(translateUi("This session's participants could not be found. Refresh and try again."));
            return false;
        }
        try {
            const entry = await sendMentorshipEmail(kind, next, mentor, mentee, note);
            update((s) => {
                const i = s.sessions.findIndex((x) => x.id === next.id);
                if (i >= 0)
                    s.sessions[i] = { ...next, updatedAt: new Date().toISOString() };
                else
                    s.sessions.push(next);
                s.mentorEmails.unshift(entry);
                s.mentorEmails = s.mentorEmails.slice(0, 300);
            });
            if (entry.status === "Queued")
                toast.success(translateUi("Saved. Email queued for {p0}.", { p0: translateUi(entry.toName) }));
            else
                toast.warning(translateUi("Saved, but no email was sent to {p0}: {p1}", { p0: translateUi(entry.toName), p1: translateUi(entry.error) }));
            return true;
        }
        catch (e) {
            toast.error(translateUi((e as Error).message));
            return false;
        }
    };
}
export function MentorshipPage() {
    useSiteLanguage();
    const { state, profile, update } = useHub();
    const act = useSessionAction();
    const [area, setArea] = useState("All focus areas");
    const [search, setSearch] = useState("");
    const [view, setView] = useState("Upcoming");
    const [requestFormat, setRequestFormat] = useState<Session["sessionType"]>("Online");
    const [requesting, setRequesting] = useState<Mentor | null>(null);
    const [editing, setEditing] = useState<Session | null>(null);
    const [reflecting, setReflecting] = useState<Session | null>(null);
    const mine = state.sessions.filter((s) => s.memberId === profile.id).sort((a, b) => a.date.localeCompare(b.date));
    const mentorList = state.mentors.filter((m) => m.email.toLowerCase() !== profile.email.toLowerCase() && (area === "All focus areas" || m.area === area) && `${m.name} ${m.title} ${m.area}`.toLowerCase().includes(search.toLowerCase()));
    const shown = mine.filter((s) => { const upcoming = ["Requested", "Confirmed"].includes(s.status) && Date.parse(s.date) > Date.now(); return view === "All" || (view === "Upcoming" ? upcoming : !upcoming); });
    const mentorPage = usePaged(mentorList, 6, `${search}|${area}`);
    const sessionPage = usePaged(shown, 5, view);
    const futureDate = (date: string) => { if (!date || new Date(date).getTime() <= Date.now()) {
        toast.error(translateUi("Choose a future session time."));
        return false;
    } return true; };
    return (<div className="ws-page hub-mentorship-page">
      <Heading eyebrow="PLP CONNECT" title={translateUi("Mentorship")} description={translateUi("Request a session with a PLP mentor. Your mentor is emailed and confirms the time and meeting details.")}/>
      <div className="ws-stats">
        <StatCard label={translateUi("Awaiting mentor")} value={String(mine.filter((s) => s.status === "Requested").length)} icon={Inbox}/>
        <StatCard label={translateUi("Confirmed sessions")} value={String(mine.filter((s) => s.status === "Confirmed").length)} icon={CalendarClock}/>
        <StatCard label={translateUi("Completed sessions")} value={String(mine.filter((s) => s.status === "Completed").length)} icon={CheckCircle2}/>
        <StatCard label={translateUi("Available mentors")} value={String(state.mentors.filter((m) => m.accepting !== false).length)} icon={Users}/>
      </div>

      <Panel>
        <div className="ws-panel-title"><h2>{translateUi("Find your mentor")}</h2><span className="ws-pill">{translateUi(mentorList.length)}{translateUi(" mentors")}</span></div>
        <div className="hub-toolbar mt-0">
          <SearchBox value={search} onChange={setSearch} placeholder={translateUi("Search mentors")}/>
          <select aria-label={translateUi("Mentor focus area")} value={area} onChange={(e) => setArea(e.target.value)}>{translateUi(["All focus areas", ...categories].map((c) => <option key={c} value={c}>{translateUi(c)}</option>))}</select>
        </div>
        <div className="hub-grid three hub-space">
          {translateUi(mentorPage.items.map((m) => (<div key={m.id} className="hub-mentor-card">
              <div className="hub-mentor-avatar">
                {translateUi(m.avatar ? <img data-zoom tabIndex={0} role="button" src={m.avatar} alt={translateUi(m.name)} className="hub-mentor-photo" onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }}/> : null)}
                <span className="hub-mentor-initials">{translateUi(m.initials)}</span>
              </div>
              <Tag>{translateUi(m.area)}</Tag>
              <h3>{translateUi(m.name)}</h3>
              <p className="hub-mentor-role">{translateUi(m.title)}</p>
              <p>{translateUi(m.bio || "Available for mentorship sessions.")}</p>
              {translateUi(m.accepting === false
                ? <button className="hub-button secondary" disabled>{translateUi("Not taking new requests")}</button>
                : <div className="hub-actions"><button className="hub-button secondary" onClick={() => { setRequestFormat("Online"); setRequesting(m); }}>{translateUi("Request a session ")}<HeartHandshake size={16}/></button><button className="hub-text-button" onClick={() => { setRequestFormat("Visit"); setRequesting(m); }}>{translateUi("Request a visit")}</button></div>)}
            </div>)))}
        </div>
        <Pager {...mentorPage}/>
        {translateUi(!mentorList.length && <Empty>{translateUi(state.mentors.length ? "No mentors match. Choose another focus area or clear your search." : "No mentors are available yet. Approved PLP mentors will appear here.")}</Empty>)}
      </Panel>
      <Panel className="ms-sessions">
        <div className="ms-sessions-head">
          <div><h2>{translateUi("My sessions")} <span className="ws-count">{mine.length}</span></h2><p className="hub-caption">{translateUi("Confirmed sessions include reminders 24 hours and 1 hour before the start, in notifications and email.")}</p></div>
          <div className="ms-segment" role="tablist">{["Upcoming", "Past", "All"].map((t) => <button key={t} role="tab" aria-selected={view === t} className={view === t ? "active" : ""} onClick={() => setView(t)}>{translateUi(t)}</button>)}</div>
        </div>
        {sessionPage.items.length ? <ul className="ms-session-list">{sessionPage.items.map((s) => { const d = new Date(s.date), mentor = state.mentors.find((m) => m.id === s.mentorId), note = s.mentorNotes || s.declineReason || s.reflection; return <li key={s.id} className={`ms-session is-${s.status.toLowerCase()}`}>
            <time className="ms-date" dateTime={s.date}><small>{d.toLocaleDateString(undefined, { month: "short" })}</small><b>{d.getDate()}</b><small>{d.toLocaleDateString(undefined, { weekday: "short" })}</small></time>
            <div className="ms-body">
              <div className="ms-title"><strong>{s.topic || translateUi("Mentorship")}</strong><StatusBadge status={s.status}/><DueBadge date={s.date}/></div>
              <p className="ms-meta"><span><Users size={13}/>{mentor?.name ?? translateUi("Mentor")}</span><span><Clock3 size={13}/>{d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span><span>{s.sessionType === "Online" || !s.sessionType ? <Video size={13}/> : <UserRoundCheck size={13}/>}{translateUi(s.sessionType || "Online")}{s.location ? ` · ${s.location}` : ""}</span></p>
              {s.goal && <p className="ms-goal">{s.goal}</p>}
              {note && <p className="ms-note">{note}</p>}
            </div>
            <div className="ms-side">
              {s.meetingLink && s.status === "Confirmed" && <MeetingLink link={s.meetingLink}/>}
              <div className="ms-row-actions">
                {s.status === 'Requested' && <button className="hub-text-button" onClick={()=>setEditing(s)}><FilePenLine size={14}/>{translateUi('Edit')}</button>}
                {s.status==='Confirmed' && <CalendarDownload session={s}/>}
                {s.status==='Completed' && <button className="hub-text-button" onClick={()=>setReflecting(s)}><NotebookPen size={14}/>{translateUi(s.reflection?'Edit takeaway':'Add takeaway')}</button>}
                {['Requested','Confirmed'].includes(s.status) && <button className="hub-text-button ms-cancel" onClick={async()=>{if(await confirmAction({title:'Cancel this session?',description:'Your mentor will be notified.',confirmLabel:'Cancel session',destructive:true})) await act('cancelled',{...s,status:'Cancelled'});}}>{translateUi('Cancel')}</button>}
              </div>
            </div>
          </li>; })}</ul> : <Empty>{translateUi(view === "Upcoming" ? "No upcoming sessions. Request one from a mentor above." : "No sessions here yet.")}</Empty>}
        <Pager {...sessionPage}/>
      </Panel>
      {translateUi(requesting && (<FormDialog title={translateUi("Request a session with {p0}", { p0: translateUi(requesting.name) })} description={translateUi("{p0} receives your request by email and confirms a time.", { p0: translateUi(requesting.name) })} submitLabel="Send request" onClose={() => setRequesting(null)} onSubmit={async (f) => {
                const date = String(f.get("date"));
                if (!futureDate(date))
                    return false;
                return act("requested", { id: uid(), memberId: profile.id, mentorId: requesting.id, date, topic: String(f.get("topic")).trim(), goal: String(f.get("goal")).trim(), ...sessionFields(f), status: "Requested", requestedAt: new Date().toISOString() });
            }}>
          <Field label={translateUi("Topic")}><input name="topic" required maxLength={100} defaultValue={requesting.area}/></Field>
          <Field label={translateUi("Preferred date & time")}><input name="date" type="datetime-local" min={nowLocal()} required/></Field>
          <SessionFields initialType={requestFormat}/>
          <Field label={translateUi("What would you like to work on?")}><textarea name="goal" minLength={15} maxLength={1200} required placeholder={translateUi("Share your goal and any context that helps your mentor prepare\u2026")}/></Field>
        </FormDialog>))}
      {translateUi(editing && (<FormDialog title={translateUi("Edit session request")} description={translateUi("Your mentor will be emailed about the change.")} submitLabel="Save changes" onClose={() => setEditing(null)} onSubmit={async (f) => {
                const date = String(f.get("date"));
                if (!futureDate(date))
                    return false;
                return act("updated", { ...editing, date, topic: String(f.get("topic")).trim(), goal: String(f.get("goal")).trim(), ...sessionFields(f) });
            }}>
          <Field label={translateUi("Topic")}><input name="topic" required maxLength={100} defaultValue={editing.topic}/></Field>
          <Field label={translateUi("Preferred date & time")}><input name="date" type="datetime-local" min={nowLocal()} required defaultValue={toLocalInput(new Date(editing.date))}/></Field>
          <SessionFields session={editing ?? undefined}/>
          <Field label={translateUi("What would you like to work on?")}><textarea name="goal" minLength={15} maxLength={1200} required defaultValue={editing.goal}/></Field>
        </FormDialog>))}
      {translateUi(reflecting && (<FormDialog title={translateUi("Session takeaway")} description={translateUi("Your takeaway is private to you.")} submitLabel="Save takeaway" onClose={() => setReflecting(null)} onSubmit={(f) => {
                if (!update((d) => { const x = d.sessions.find((y) => y.id === reflecting.id && y.memberId === profile.id); if (x)
                    x.reflection = String(f.get("reflection")).trim(); }))
                    return false;
                toast.success(translateUi("Takeaway saved"));
            }}>
          <Field label={translateUi("What did you learn, and what will you do next?")}><textarea name="reflection" required minLength={20} maxLength={2000} defaultValue={reflecting.reflection}/></Field>
        </FormDialog>))}
    </div>);
}
type MentorAction = {
    kind: "accept" | "decline" | "reschedule" | "complete";
    session: Session;
} | null;
// Session emails are tracked per browser, so the mentor relies on the notification bell instead of a separate log.
const TABS = ["Requests", "Upcoming", "Needs notes", "History", "My mentees"] as const;
export function MentorDashboard() {
    useSiteLanguage();
    const { state, profile } = useHub();
    const act = useSessionAction();
    const me = mentorFor(state, profile);
    const [tab, setTab] = useState<string>("Requests");
    const [action, setAction] = useState<MentorAction>(null);
    const [editingProfile, setEditingProfile] = useState(false);
    if (!me)
        return (<div className="ws-page">
        <header className="ws-page-header"><div><p className="ws-kicker">{translateUi("MENTOR WORKSPACE")}</p><h1>{translateUi("Mentor dashboard")}</h1><p>{translateUi("Loading your mentor account\u2026")}</p></div></header>
        <Empty>{translateUi("If this message stays, your mentor access may still be awaiting approval or has been suspended. Contact a PLP administrator.")}</Empty>
      </div>);
    const now = Date.now();
    const sessions = state.sessions.filter((s) => s.mentorId === me.id).sort((a, b) => a.date.localeCompare(b.date));
    const requests = sessions.filter((s) => s.status === "Requested");
    const upcoming = sessions.filter((s) => s.status === "Confirmed" && Date.parse(s.date) > now);
    const needsNotes = sessions.filter((s) => s.status === "Confirmed" && Date.parse(s.date) <= now);
    const history = sessions.filter((s) => ["Completed", "Declined", "Cancelled"].includes(s.status)).reverse();
    const week = upcoming.filter((s) => Date.parse(s.date) - now < 7 * 86400000);
    const next = upcoming[0];
    const emails = state.mentorEmails.filter((e) => sessions.some((s) => s.id === e.sessionId));
    const mentee = (s: Session) => state.profiles.find((p) => p.id === s.memberId);
    const mentees = [...new Set(sessions.filter((s) => s.status !== "Cancelled").map((s) => s.memberId))].map((id) => {
        const rows = sessions.filter((s) => s.memberId === id);
        return { id, person: state.profiles.find((p) => p.id === id), total: rows.length, completed: rows.filter((s) => s.status === "Completed").length, next: rows.find((s) => s.status === "Confirmed" && Date.parse(s.date) > now), last: [...rows].reverse().find((s) => s.status === "Completed") };
    });
    const incomplete = !me.bio || me.title === "PLP mentor";
    const counts: Record<string, number> = { Requests: requests.length, Upcoming: upcoming.length, "Needs notes": needsNotes.length, History: history.length, "My mentees": mentees.length, Notifications: emails.length };
    const rows = tab === "Requests" ? requests : tab === "Upcoming" ? upcoming : tab === "Needs notes" ? needsNotes : history;
    const saveProfile = async (patch: Partial<Mentor>) => {
        const stored = me.avatar?.startsWith("/api/avatars/") ? "" : me.avatar ?? "";
        const body = { title: patch.title ?? me.title, area: patch.area ?? me.area, bio: patch.bio ?? me.bio, avatar: patch.avatar ?? stored, accepting: patch.accepting ?? me.accepting ?? true };
        try {
            await platformApi("/mentors/me", "PUT", body);
            window.dispatchEvent(new Event("plp:mentorship-updated"));
            return true;
        }
        catch (e) {
            toast.error(translateUi((e as Error).message));
            return false;
        }
    };
    const actions = (s: Session) => (<div className="ms-row-actions">
      {translateUi(s.status === "Requested" && <button className="hub-button" onClick={() => setAction({ kind: "accept", session: s })}>{translateUi("Accept")}</button>)}
      {translateUi(s.status === "Confirmed" && Date.parse(s.date) <= now && <button className="hub-button" onClick={() => setAction({ kind: "complete", session: s })}><NotebookPen size={15}/>{translateUi(" Record session")}</button>)}
      {translateUi(["Requested", "Confirmed"].includes(s.status) && Date.parse(s.date) > now && <button className="hub-button secondary" onClick={() => setAction({ kind: "reschedule", session: s })}>{translateUi("Reschedule")}</button>)}
      {translateUi(["Requested", "Confirmed"].includes(s.status) && <button className="hub-button danger" onClick={() => setAction({ kind: "decline", session: s })}><XCircle size={15}/>{translateUi(" Decline")}</button>)}
    </div>);
    return (<div className="ws-page">
      <header className="ws-page-header ws-hero">
        <div>
          <h1>{greeting(me.name)}</h1>
          <p>{dashboardSubtitle("Mentor workspace")}</p>

        </div>
        <div className="hub-actions">
          <button className="hub-button secondary" onClick={async () => { if (await saveProfile({ accepting: me.accepting === false }))
        toast.success(translateUi(me.accepting === false ? "You're accepting new requests again." : "New requests are paused. Existing sessions are unaffected.")); }}>
            {translateUi(me.accepting === false ? <><PlayCircle size={16}/>{translateUi(" Resume requests")}</> : <><PauseCircle size={16}/>{translateUi(" Pause new requests")}</>)}
          </button>
          <button className="hub-button" onClick={() => setEditingProfile(true)}><FilePenLine size={16}/>{translateUi(" Edit mentor profile")}</button>
        </div>
      </header>
      {translateUi(me.accepting === false && <p className="hub-feedback">{translateUi("New requests are paused. Mentees can see your profile but cannot request a session until you resume.")}</p>)}
      {translateUi(incomplete && (<Panel className="ms-callout">
          <div><h2>{translateUi("Complete your mentor profile")}</h2><p>{translateUi("Add a headline and bio so mentees can find you.")}</p></div>
          <button className="hub-button" onClick={() => setEditingProfile(true)}>{translateUi("Complete profile")}</button>
        </Panel>))}
      <div className="ws-stats">
        <StatCard label={translateUi("New requests")} value={String(requests.length)} icon={Inbox}/>
        <StatCard label={translateUi("Upcoming sessions")} value={String(upcoming.length)} icon={CalendarClock}/>
        <StatCard label={translateUi("Awaiting your notes")} value={String(needsNotes.length)} icon={NotebookPen}/>
        <StatCard label={translateUi("Mentees supported")} value={String(mentees.length)} icon={UserRoundCheck}/>
      </div>
      <div className="ws-dashboard-grid">
        <Panel>
          <div className="ws-panel-title"><h2>{translateUi("Next session")}</h2>{translateUi(next && <span className="ws-pill">{translateUi(relative(next.date))}</span>)}</div>
          {translateUi(next ? (<div className="ms-next">
              <strong>{translateUi(mentee(next)?.name ?? "Mentee")}</strong>
              <span><Clock3 size={14}/> {translateUi(when(next.date))}</span>
              <p><b>{translateUi(next.topic || "General mentorship")}</b>{translateUi(" \u2014 ")}{translateUi(next.goal)}</p>
              {translateUi(next.meetingLink && <p className="ms-detail"><Video size={14}/> <MeetingLink link={next.meetingLink}/></p>)}
              <div className="hub-actions"><button className="hub-button secondary" onClick={() => setAction({ kind: "reschedule", session: next })}>{translateUi("Reschedule")}</button></div>
            </div>) : <Empty>{translateUi(requests.length ? `You have ${requests.length} request${requests.length === 1 ? "" : "s"} to answer.` : "No confirmed sessions yet.")}</Empty>)}
        </Panel>
        <Panel>
          <div className="ws-panel-title"><h2>{translateUi("This week")}</h2><span className="ws-pill">{translateUi(week.length)}{translateUi(" session")}{translateUi(week.length === 1 ? "" : "s")}</span></div>
          {translateUi(week.length ? (<ul className="ms-agenda">{translateUi(week.map((s) => <li key={s.id}><span>{translateUi(new Date(s.date).toLocaleDateString(undefined, { weekday: "short", day: "numeric" }))}<small>{translateUi(new Date(s.date).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }))}</small></span><div><strong>{translateUi(mentee(s)?.name)}</strong><small>{translateUi(s.topic || "General mentorship")}</small></div></li>))}</ul>) : <Empty>{translateUi("Nothing scheduled in the next 7 days.")}</Empty>)}
        </Panel>
      </div>

      <Panel>
        <div className="ws-tabs" role="tablist">
          {translateUi(TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{translateUi(t)}<span>{translateUi(counts[t])}</span></button>))}
        </div>
        {tab === 'Notifications' ? <RecordTable title="session emails" rows={emails} searchText={e=>`${e.toName} ${e.to} ${e.subject} ${e.status}`} filters={[{label:'Delivery',options:[{label:'Queued',test:(e:MentorshipEmail)=>e.status==='Queued'},{label:'Not emailed',test:(e:MentorshipEmail)=>e.status!=='Queued'}]}]} columns={[
          {label:'Recipient',render:e=><><strong>{e.toName}</strong><small>{e.to}</small></>},{label:'Subject',render:e=>e.subject},{label:'Date',render:e=>when(e.sentAt)},{label:'Delivery',render:e=><span>{e.status==='Queued'?'Queued':'Not emailed'}<small>{e.error}</small></span>}
        ]}/> : tab === 'My mentees' ? <RecordTable title="mentees" rows={mentees} searchText={m=>`${m.person?.name} ${m.person?.email}`} filters={[{label:'Sessions',options:[{label:'Has a session coming up',test:(m:{next?:unknown})=>!!m.next},{label:'No session booked',test:(m:{next?:unknown})=>!m.next}]}]} columns={[
          {label:'Mentee',render:m=><><strong>{m.person?.name||'Former member'}</strong><small>{m.person?.email}</small></>},{label:'Sessions',render:m=>`${m.completed} completed · ${m.total} total`},{label:'Last session',render:m=>m.last?when(m.last.date):'—'},{label:'Next session',render:m=>m.next?when(m.next.date):'—'}
        ]}/> : <RecordTable key={tab} title="mentor sessions" rows={rows} searchText={s=>`${mentee(s)?.name} ${mentee(s)?.email} ${s.topic} ${s.goal} ${s.location||''}`} filters={sessionFilters} columns={[
          {label:'Mentee',render:s=><><strong>{mentee(s)?.name||'Former member'}</strong><small>{mentee(s)?.email}</small></>},
          {label:'When',render:s=><>{when(s.date)}<DueBadge date={s.date}/>{s.status==='Confirmed'&&<CalendarDownload session={s}/>}</>},
          {label:'Session details',render:s=><><strong>{s.topic||'Mentorship'}</strong><small>{s.goal}</small><small>{translateUi(s.sessionType||'Online')}{s.location?` · ${s.location}`:''}</small>{s.meetingLink&&<MeetingLink link={s.meetingLink}/>}<small>{s.mentorNotes||s.declineReason}</small></>},
          {label:'Status',render:s=><StatusBadge status={s.status}/>},{label:'Actions',render:s=>actions(s)}
        ]}/>}
      </Panel>
      {translateUi(action?.kind === "accept" && (<FormDialog title={translateUi("Accept session request")} description={translateUi("Confirm {p0} with {p1}. They are emailed the meeting details.", { p0: translateUi(when(action.session.date)), p1: translateUi(mentee(action.session)?.name) })} submitLabel="Confirm session" onClose={() => setAction(null)} onSubmit={(f) => {
                const link = String(f.get("meetingLink") || "").trim(), note = String(f.get("note")).trim();
                if (looksLikeLink(link) && !isHttps(link)) {
                    toast.error(translateUi("Use a secure https:// meeting link, or type the venue."));
                    return false;
                }
                return act("confirmed", { ...action.session, status: "Confirmed", ...sessionFields(f), meetingLink: link }, note);
            }}>
          <SessionFields session={action.session}/>
          <Field label={translateUi("Note to mentee (optional)")}><textarea name="note" maxLength={1000} placeholder={translateUi("Anything they should prepare?")}/></Field>
        </FormDialog>))}
      {translateUi(action?.kind === "reschedule" && (<FormDialog title={translateUi("Reschedule session")} description={translateUi("{p0} is emailed the new time.", { p0: translateUi(mentee(action.session)?.name) })} submitLabel="Reschedule" onClose={() => setAction(null)} onSubmit={(f) => {
                const date = String(f.get("date"));
                if (new Date(date).getTime() <= Date.now()) {
                    toast.error(translateUi("Choose a future time."));
                    return false;
                }
                if (sessions.some((x) => x.id !== action.session.id && Math.abs(Date.parse(x.date) - Date.parse(date)) < 3600000 && ["Requested", "Confirmed"].includes(x.status))) {
                    toast.error(translateUi("You already have a session within an hour of that time."));
                    return false;
                }
                return act("rescheduled", { ...action.session, status: "Confirmed", date: new Date(date).toISOString(), ...sessionFields(f) }, String(f.get("note")).trim());
            }}>
          <Field label={translateUi("New date & time")}><input name="date" type="datetime-local" min={nowLocal()} required defaultValue={toLocalInput(new Date(action.session.date))}/></Field>
          {translateUi(action.session.status === "Requested" && <p className="hub-caption">{translateUi("Rescheduling a request also confirms it at the new time.")}</p>)}
          <SessionFields session={action.session}/>
          <Field label={translateUi("Message (optional)")}><textarea name="note" maxLength={1000}/></Field>
        </FormDialog>))}
      {translateUi(action?.kind === "decline" && (<FormDialog destructive title={translateUi(action.session.status === "Confirmed" ? "Cancel confirmed session" : "Decline session request")} description={translateUi("Tell the mentee why, so they can request another time or mentor.")} submitLabel={action.session.status === "Confirmed" ? "Cancel session" : "Decline request"} onClose={() => setAction(null)} onSubmit={(f) => {
                const reason = String(f.get("reason")).trim();
                return act("declined", { ...action.session, status: "Declined", declineReason: reason }, reason);
            }}>
          <Field label={translateUi("Reason")}><textarea name="reason" required minLength={10} maxLength={1000}/></Field>
        </FormDialog>))}
      {translateUi(action?.kind === "complete" && (<FormDialog title={translateUi("Record session")} description={translateUi("Your notes are shared with {p0} by email.", { p0: translateUi(mentee(action.session)?.name) })} submitLabel="Save and complete" onClose={() => setAction(null)} onSubmit={(f) => {
                const notes = String(f.get("notes")).trim();
                return act("completed", { ...action.session, status: "Completed", mentorNotes: notes }, notes);
            }}>
          <Field label={translateUi("What you discussed and agreed next steps")}><textarea name="notes" required minLength={20} maxLength={2000} rows={6}/></Field>
        </FormDialog>))}
      {translateUi(editingProfile && (<FormDialog title={translateUi("Your mentor profile")} description={translateUi("Mentees see this when choosing a mentor.")} submitLabel="Save profile" onClose={() => setEditingProfile(false)} onSubmit={async (f) => {
                // The photo is saved by its own uploader; keep any older link-based photo only if no upload exists.
                const avatar = me.avatar?.startsWith("/api/avatars/") ? "" : me.avatar ?? "";
                if (!await saveProfile({ title: String(f.get("title")).trim(), area: String(f.get("area")), bio: String(f.get("bio")).trim(), avatar, accepting: f.get("accepting") === "on" }))
                    return false;
                toast.success(translateUi("Mentor profile saved"));
            }}>
          <div className="pp-dialog-row"><ProfilePhoto size={64}/></div>
          <Field label={translateUi("Headline")}><input name="title" required minLength={3} maxLength={100} defaultValue={me.title === "PLP mentor" ? "" : me.title} placeholder={translateUi("e.g. Career coach for first-time job seekers")}/></Field>
          <Field label={translateUi("Focus area")}><select name="area" defaultValue={me.area}>{translateUi(categories.map((c) => <option key={c} value={c}>{translateUi(c)}</option>))}</select></Field>
          <Field label={translateUi("Short bio")}><textarea name="bio" required minLength={20} maxLength={600} rows={4} defaultValue={me.bio} placeholder={translateUi("Your experience and how you like to help mentees.")}/></Field>
          <label className="hub-check"><input type="checkbox" name="accepting" defaultChecked={me.accepting !== false}/>{translateUi(" Accepting new session requests")}</label>
        </FormDialog>))}
    </div>);
}
