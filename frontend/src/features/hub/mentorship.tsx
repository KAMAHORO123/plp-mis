import { useState, type FormEvent, type ReactNode } from "react";
import { CalendarClock, CalendarDays, CheckCircle2, Clock3, FilePenLine, HeartHandshake, Inbox, Mail, NotebookPen, PauseCircle, PlayCircle, UserRoundCheck, Users, Video, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { confirmAction } from "@/components/shared/confirm-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { categories, type Mentor } from "./data";
import { useHub, uid, type HubState, type MentorshipEmail, type Profile, type Session } from "./store";
import { sendMentorshipEmail } from "./mentor-mail";
import { platformApi } from "./platform-api";
import { ProfilePhoto } from "./profile-photo";
import { Empty, Field, Heading, Panel, SearchBox, Tag } from "./ui";
import "./workspaces.css";

const toLocalInput = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const nowLocal = () => toLocalInput(new Date(Date.now() + 60_000));
const when = (date: string) => new Date(date).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const relative = (date: string) => {
  const days = Math.round((new Date(date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
  return days === 0 ? "Today" : days === 1 ? "Tomorrow" : days > 1 ? `In ${days} days` : `${-days} day${days === -1 ? "" : "s"} ago`;
};
const statusClass: Record<Session["status"], string> = { Requested: "", Confirmed: "ws-status-issued", Completed: "ws-status-issued", Declined: "ws-status-returned", Cancelled: "ws-status-returned" };
const isHttps = (v: string) => { try { return new URL(v).protocol === "https:"; } catch { return false; } };
const looksLikeLink = (v: string) => /^[a-z][a-z0-9+.-]*:/i.test(v);

export function mentorFor(state: HubState, profile: Profile) {
  return state.mentors.find((m) => m.email.toLowerCase() === profile.email.toLowerCase());
}

function FormDialog({ title, description, submitLabel, destructive, onClose, onSubmit, children }: { title: string; description?: string; submitLabel: string; destructive?: boolean; onClose: () => void; onSubmit: (f: FormData) => Promise<boolean | void> | boolean | void; children: ReactNode }) {
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    try { if ((await onSubmit(new FormData(e.currentTarget))) !== false) onClose(); } finally { setBusy(false); }
  };
  return (
    <Dialog open onOpenChange={(o) => { if (!o && !busy) onClose(); }}>
      <DialogContent className="hub-app hub-dialog max-h-[90vh] overflow-y-auto">
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
        <form className="hub-form hub-space" onSubmit={submit}>
          {children}
          <div className="hub-actions hub-dialog-actions">
            <button type="button" className="hub-button secondary" disabled={busy} onClick={onClose}>Cancel</button>
            <button className={`hub-button ${destructive ? "danger" : ""}`} disabled={busy}>{busy ? "Saving…" : submitLabel}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const StatusBadge = ({ status }: { status: Session["status"] }) => <span className={`ws-status ${statusClass[status]}`}>{status}</span>;
const MeetingLink = ({ link }: { link: string }) => isHttps(link) ? <a className="hub-text-link" href={link} target="_blank" rel="noreferrer">Join meeting</a> : <span>{link}</span>;

/** Sends a session change to the platform first; the screen only changes once the server has accepted it. */
function useSessionAction() {
  const { state, update } = useHub();
  return async (kind: MentorshipEmail["kind"], next: Session, note = "") => {
    const mentor = state.mentors.find((m) => m.id === next.mentorId);
    const mentee = state.profiles.find((p) => p.id === next.memberId);
    if (!mentor || !mentee) { toast.error("This session's participants could not be found. Refresh and try again."); return false; }
    try {
      const entry = await sendMentorshipEmail(kind, next, mentor, mentee, note);
      update((s) => {
        const i = s.sessions.findIndex((x) => x.id === next.id);
        if (i >= 0) s.sessions[i] = { ...next, updatedAt: new Date().toISOString() }; else s.sessions.push(next);
        s.mentorEmails.unshift(entry);
        s.mentorEmails = s.mentorEmails.slice(0, 300);
      });
      if (entry.status === "Queued") toast.success(`Saved. ${entry.toName} has been emailed.`);
      else toast.warning(`Saved, but no email was sent to ${entry.toName}: ${entry.error}`);
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    }
  };
}

export function MentorshipPage() {
  const { state, profile, update } = useHub();
  const act = useSessionAction();
  const [area, setArea] = useState("All focus areas");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("Upcoming");
  const [requesting, setRequesting] = useState<Mentor | null>(null);
  const [editing, setEditing] = useState<Session | null>(null);
  const [reflecting, setReflecting] = useState<Session | null>(null);
  const mine = state.sessions.filter((s) => s.memberId === profile.id).sort((a, b) => a.date.localeCompare(b.date));
  const mentorList = state.mentors.filter((m) => m.email.toLowerCase() !== profile.email.toLowerCase() && (area === "All focus areas" || m.area === area) && `${m.name} ${m.title} ${m.area}`.toLowerCase().includes(search.toLowerCase()));
  const shown = mine.filter((s) => view === "All" || (view === "Upcoming" ? ["Requested", "Confirmed"].includes(s.status) : !["Requested", "Confirmed"].includes(s.status)));
  const futureDate = (date: string) => { if (!date || new Date(date).getTime() <= Date.now()) { toast.error("Choose a future session time."); return false; } return true; };
  return (
    <div className="ws-page hub-mentorship-page">
      <Heading eyebrow="PLP CONNECT" title="Mentorship" description="Request a session with a PLP mentor. Your mentor is emailed and confirms the time and meeting details." />
      <div className="ws-stats">
        <StatCard label="Awaiting mentor" value={String(mine.filter((s) => s.status === "Requested").length)} icon={Inbox} />
        <StatCard label="Confirmed sessions" value={String(mine.filter((s) => s.status === "Confirmed").length)} icon={CalendarClock} />
        <StatCard label="Completed sessions" value={String(mine.filter((s) => s.status === "Completed").length)} icon={CheckCircle2} />
        <StatCard label="Available mentors" value={String(state.mentors.filter((m) => m.accepting !== false).length)} icon={Users} />
      </div>
      <Panel>
        <div className="ws-panel-title"><h2>Find your mentor</h2><span className="ws-pill">{mentorList.length} mentors</span></div>
        <div className="hub-toolbar mt-0">
          <SearchBox value={search} onChange={setSearch} placeholder="Search mentors" />
          <select aria-label="Mentor focus area" value={area} onChange={(e) => setArea(e.target.value)}>{["All focus areas", ...categories].map((c) => <option key={c}>{c}</option>)}</select>
        </div>
        <div className="hub-grid three hub-space">
          {mentorList.map((m) => (
            <div key={m.id} className="hub-mentor-card">
              <div className="hub-mentor-avatar">
                {m.avatar ? <img src={m.avatar} alt={m.name} className="hub-mentor-photo" onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }} /> : null}
                <span className="hub-mentor-initials">{m.initials}</span>
              </div>
              <Tag>{m.area}</Tag>
              <h3>{m.name}</h3>
              <p className="hub-mentor-role">{m.title}</p>
              <p>{m.bio || "Available for mentorship sessions."}</p>
              {m.accepting === false
                ? <button className="hub-button secondary" disabled>Not taking new requests</button>
                : <button className="hub-button secondary" onClick={() => setRequesting(m)}>Request a session <HeartHandshake size={16} /></button>}
            </div>
          ))}
        </div>
        {!mentorList.length && <Empty>{state.mentors.length ? "No mentors match. Choose another focus area or clear your search." : "No mentors are available yet. Approved PLP mentors will appear here."}</Empty>}
      </Panel>
      <Panel>
        <div className="ws-panel-title"><h2>My sessions <span className="ws-count">{mine.length}</span></h2></div>
        <div className="ws-tabs" role="tablist">
          {["Upcoming", "Past", "All"].map((t) => <button key={t} role="tab" aria-selected={view === t} className={view === t ? "active" : ""} onClick={() => setView(t)}>{t}</button>)}
        </div>
        <div className="hub-stack hub-space">
          {shown.map((s) => {
            const m = state.mentors.find((x) => x.id === s.mentorId);
            return (
              <div key={s.id} className="ms-session">
                <div className="ms-session-head">
                  <div><strong>{m?.name ?? "Former mentor"}</strong><small><CalendarDays size={13} /> {when(s.date)}{s.topic ? ` · ${s.topic}` : ""}</small></div>
                  <StatusBadge status={s.status} />
                </div>
                <p>{s.goal}</p>
                {s.status === "Confirmed" && s.meetingLink && <p className="ms-detail"><Video size={14} /> <MeetingLink link={s.meetingLink} /></p>}
                {s.mentorNotes && <p className="ms-detail"><strong>Mentor note:</strong> {s.mentorNotes}</p>}
                {s.declineReason && <p className="ms-detail"><strong>Reason:</strong> {s.declineReason}</p>}
                {s.reflection && <p className="ms-detail"><strong>Your takeaway:</strong> {s.reflection}</p>}
                <div className="ms-row-actions">
                  {s.status === "Requested" && <button className="hub-button secondary" onClick={() => setEditing(s)}><FilePenLine size={15} /> Edit request</button>}
                  {["Requested", "Confirmed"].includes(s.status) && <button className="hub-button danger" onClick={async () => {
                    if (await confirmAction({ title: "Cancel this session?", description: `${m?.name ?? "Your mentor"} will be notified by email.`, confirmLabel: "Cancel session", destructive: true }))
                      await act("cancelled", { ...s, status: "Cancelled" });
                  }}><XCircle size={15} /> Cancel</button>}
                  {s.status === "Completed" && <button className="hub-button secondary" onClick={() => setReflecting(s)}><FilePenLine size={15} /> {s.reflection ? "Edit takeaway" : "Add takeaway"}</button>}
                </div>
              </div>
            );
          })}
          {!shown.length && <Empty>{view === "Upcoming" ? "No upcoming sessions. Request a session with a mentor above." : "No sessions in this view yet."}</Empty>}
        </div>
      </Panel>
      {requesting && (
        <FormDialog title={`Request a session with ${requesting.name}`} description={`${requesting.name} receives your request by email and confirms a time.`} submitLabel="Send request" onClose={() => setRequesting(null)} onSubmit={async (f) => {
          const date = String(f.get("date"));
          if (!futureDate(date)) return false;
          return act("requested", { id: uid(), memberId: profile.id, mentorId: requesting.id, date, topic: String(f.get("topic")).trim(), goal: String(f.get("goal")).trim(), status: "Requested", requestedAt: new Date().toISOString() });
        }}>
          <Field label="Topic"><input name="topic" required maxLength={100} defaultValue={requesting.area} /></Field>
          <Field label="Preferred date & time"><input name="date" type="datetime-local" min={nowLocal()} required /></Field>
          <Field label="What would you like to work on?"><textarea name="goal" minLength={15} maxLength={1200} required placeholder="Share your goal and any context that helps your mentor prepare…" /></Field>
        </FormDialog>
      )}
      {editing && (
        <FormDialog title="Edit session request" description="Your mentor will be emailed about the change." submitLabel="Save changes" onClose={() => setEditing(null)} onSubmit={async (f) => {
          const date = String(f.get("date"));
          if (!futureDate(date)) return false;
          return act("updated", { ...editing, date, topic: String(f.get("topic")).trim(), goal: String(f.get("goal")).trim() });
        }}>
          <Field label="Topic"><input name="topic" required maxLength={100} defaultValue={editing.topic} /></Field>
          <Field label="Preferred date & time"><input name="date" type="datetime-local" min={nowLocal()} required defaultValue={toLocalInput(new Date(editing.date))} /></Field>
          <Field label="What would you like to work on?"><textarea name="goal" minLength={15} maxLength={1200} required defaultValue={editing.goal} /></Field>
        </FormDialog>
      )}
      {reflecting && (
        <FormDialog title="Session takeaway" description="Your takeaway is private to you." submitLabel="Save takeaway" onClose={() => setReflecting(null)} onSubmit={(f) => {
          if (!update((d) => { const x = d.sessions.find((y) => y.id === reflecting.id && y.memberId === profile.id); if (x) x.reflection = String(f.get("reflection")).trim(); })) return false;
          toast.success("Takeaway saved");
        }}>
          <Field label="What did you learn, and what will you do next?"><textarea name="reflection" required minLength={20} maxLength={2000} defaultValue={reflecting.reflection} /></Field>
        </FormDialog>
      )}
    </div>
  );
}

type MentorAction = { kind: "accept" | "decline" | "reschedule" | "complete"; session: Session } | null;
const TABS = ["Requests", "Upcoming", "Needs notes", "History", "My mentees", "Notifications"] as const;

export function MentorDashboard() {
  const { state, profile } = useHub();
  const act = useSessionAction();
  const me = mentorFor(state, profile);
  const [tab, setTab] = useState<string>("Requests");
  const [action, setAction] = useState<MentorAction>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  if (!me)
    return (
      <div className="ws-page">
        <header className="ws-page-header"><div><p className="ws-kicker">MENTOR WORKSPACE</p><h1>Mentor dashboard</h1><p>Loading your mentor account…</p></div></header>
        <Empty>If this message stays, your mentor access may still be awaiting approval or has been suspended. Contact a PLP administrator.</Empty>
      </div>
    );
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
    try { await platformApi("/mentors/me", "PUT", body); window.dispatchEvent(new Event("plp:mentorship-updated")); return true; }
    catch (e) { toast.error((e as Error).message); return false; }
  };
  const actions = (s: Session) => (
    <div className="ms-row-actions">
      {s.status === "Requested" && <button className="hub-button" onClick={() => setAction({ kind: "accept", session: s })}>Accept</button>}
      {s.status === "Confirmed" && Date.parse(s.date) <= now && <button className="hub-button" onClick={() => setAction({ kind: "complete", session: s })}><NotebookPen size={15} /> Record session</button>}
      {["Requested", "Confirmed"].includes(s.status) && Date.parse(s.date) > now && <button className="hub-button secondary" onClick={() => setAction({ kind: "reschedule", session: s })}>Reschedule</button>}
      {["Requested", "Confirmed"].includes(s.status) && <button className="hub-button danger" onClick={() => setAction({ kind: "decline", session: s })}><XCircle size={15} /> Decline</button>}
    </div>
  );
  return (
    <div className="ws-page">
      <header className="ws-page-header">
        <div>
          <p className="ws-kicker">MENTOR WORKSPACE · {me.area}</p>
          <h1>Welcome, {me.name.split(" ")[0]}</h1>
          <p>New requests are emailed to {me.email}. Accept, reschedule or decline them here, and record each session after it is held.</p>
        </div>
        <div className="hub-actions">
          <button className="hub-button secondary" onClick={async () => { if (await saveProfile({ accepting: me.accepting === false })) toast.success(me.accepting === false ? "You're accepting new requests again." : "New requests are paused. Existing sessions are unaffected."); }}>
            {me.accepting === false ? <><PlayCircle size={16} /> Resume requests</> : <><PauseCircle size={16} /> Pause new requests</>}
          </button>
          <button className="hub-button" onClick={() => setEditingProfile(true)}><FilePenLine size={16} /> Edit mentor profile</button>
        </div>
      </header>
      {me.accepting === false && <p className="hub-feedback">New requests are paused. Mentees can see your profile but cannot request a session until you resume.</p>}
      {incomplete && (
        <Panel className="ms-callout">
          <div><h2>Complete your mentor profile</h2><p>Mentees choose a mentor by headline, focus area and bio. Add yours so the right people find you.</p></div>
          <button className="hub-button" onClick={() => setEditingProfile(true)}>Complete profile</button>
        </Panel>
      )}
      <div className="ws-stats">
        <StatCard label="New requests" value={String(requests.length)} icon={Inbox} />
        <StatCard label="Upcoming sessions" value={String(upcoming.length)} icon={CalendarClock} />
        <StatCard label="Awaiting your notes" value={String(needsNotes.length)} icon={NotebookPen} />
        <StatCard label="Mentees supported" value={String(mentees.length)} icon={UserRoundCheck} />
      </div>
      <div className="ws-dashboard-grid">
        <Panel>
          <div className="ws-panel-title"><h2>Next session</h2>{next && <span className="ws-pill">{relative(next.date)}</span>}</div>
          {next ? (
            <div className="ms-next">
              <strong>{mentee(next)?.name ?? "Mentee"}</strong>
              <span><Clock3 size={14} /> {when(next.date)}</span>
              <p><b>{next.topic || "General mentorship"}</b> — {next.goal}</p>
              {next.meetingLink && <p className="ms-detail"><Video size={14} /> <MeetingLink link={next.meetingLink} /></p>}
              <div className="hub-actions"><button className="hub-button secondary" onClick={() => setAction({ kind: "reschedule", session: next })}>Reschedule</button></div>
            </div>
          ) : <Empty>{requests.length ? `You have ${requests.length} request${requests.length === 1 ? "" : "s"} to answer.` : "No confirmed sessions yet."}</Empty>}
        </Panel>
        <Panel>
          <div className="ws-panel-title"><h2>This week</h2><span className="ws-pill">{week.length} session{week.length === 1 ? "" : "s"}</span></div>
          {week.length ? (
            <ul className="ms-agenda">{week.map((s) => <li key={s.id}><span>{new Date(s.date).toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}<small>{new Date(s.date).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</small></span><div><strong>{mentee(s)?.name}</strong><small>{s.topic || "General mentorship"}</small></div></li>)}</ul>
          ) : <Empty>Nothing scheduled in the next 7 days.</Empty>}
        </Panel>
      </div>
      <Panel>
        <div className="ws-tabs" role="tablist">
          {TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t}<span>{counts[t]}</span></button>)}
        </div>
        {tab === "Notifications" ? (
          emails.length ? (
            <div className="ws-table-wrap hub-space"><table className="ws-table"><thead><tr><th>Recipient</th><th>Subject</th><th>Sent</th><th>Delivery</th></tr></thead><tbody>
              {emails.map((e) => <tr key={e.id}><td><strong>{e.toName}</strong><small>{e.to}</small></td><td>{e.subject}</td><td>{new Date(e.sentAt).toLocaleString()}</td><td><span className={`ws-status ${e.status === "Queued" ? "ws-status-issued" : "ws-status-returned"}`}><Mail size={12} /> {e.status === "Queued" ? "Emailed" : "Not emailed"}</span>{e.error && <small>{e.error}</small>}</td></tr>)}
            </tbody></table></div>
          ) : <Empty>Emails you send to mentees from this device are listed here.</Empty>
        ) : tab === "My mentees" ? (
          mentees.length ? (
            <div className="ws-table-wrap hub-space"><table className="ws-table"><thead><tr><th>Mentee</th><th>Sessions</th><th>Last session</th><th>Next session</th></tr></thead><tbody>
              {mentees.map((m) => <tr key={m.id}><td><strong>{m.person?.name ?? "Former member"}</strong><small>{m.person?.email}</small></td><td>{m.completed} held · {m.total} total</td><td>{m.last ? when(m.last.date) : "—"}{m.last?.mentorNotes && <small>{m.last.mentorNotes}</small>}</td><td>{m.next ? when(m.next.date) : "—"}</td></tr>)}
            </tbody></table></div>
          ) : <Empty>People you mentor will be listed here after you accept their first request.</Empty>
        ) : rows.length ? (
          <div className="ws-table-wrap hub-space">
            <table className="ws-table">
              <thead><tr><th>Mentee</th><th>Session time</th><th>Topic & goal</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {rows.map((s) => {
                  const p = mentee(s);
                  return (
                    <tr key={s.id}>
                      <td><strong>{p?.name ?? "Former member"}</strong><small>{p?.email}</small></td>
                      <td><span className="ms-when"><Clock3 size={13} />{when(s.date)}</span><small>{relative(s.date)}{s.requestedAt ? ` · requested ${new Date(s.requestedAt).toLocaleDateString()}` : ""}</small></td>
                      <td><strong>{s.topic || "General mentorship"}</strong><small className="ms-goal">{s.goal}</small>{s.meetingLink && s.status === "Confirmed" && <small>Meeting: {s.meetingLink}</small>}{s.declineReason && <small>Reason: {s.declineReason}</small>}{s.mentorNotes && s.status === "Completed" && <small>Notes: {s.mentorNotes}</small>}</td>
                      <td><StatusBadge status={s.status} /></td>
                      <td>{["Requested", "Confirmed"].includes(s.status) ? actions(s) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>{{ Requests: "No new requests. They appear here and in your email inbox.", Upcoming: "No confirmed sessions ahead. Accept a request to schedule one.", "Needs notes": "No sessions waiting for notes. After a confirmed session's time passes, record it here.", History: "Completed, declined and cancelled sessions will appear here." }[tab]}</Empty>
        )}
      </Panel>
      {action?.kind === "accept" && (
        <FormDialog title="Accept session request" description={`Confirm ${when(action.session.date)} with ${mentee(action.session)?.name}. They are emailed the meeting details.`} submitLabel="Confirm session" onClose={() => setAction(null)} onSubmit={(f) => {
          const link = String(f.get("link")).trim(), note = String(f.get("note")).trim();
          if (looksLikeLink(link) && !isHttps(link)) { toast.error("Use a secure https:// meeting link, or type the venue."); return false; }
          return act("confirmed", { ...action.session, status: "Confirmed", meetingLink: link }, note);
        }}>
          <Field label="Meeting link or venue"><input name="link" required maxLength={300} placeholder="https://meet.google.com/… or PLP office, Kigali" /></Field>
          <Field label="Note to mentee (optional)"><textarea name="note" maxLength={1000} placeholder="Anything they should prepare?" /></Field>
        </FormDialog>
      )}
      {action?.kind === "reschedule" && (
        <FormDialog title="Propose a new time" description={`${mentee(action.session)?.name} is emailed the new time.`} submitLabel="Reschedule" onClose={() => setAction(null)} onSubmit={(f) => {
          const date = String(f.get("date"));
          if (new Date(date).getTime() <= Date.now()) { toast.error("Choose a future time."); return false; }
          if (sessions.some((x) => x.id !== action.session.id && Math.abs(Date.parse(x.date) - Date.parse(date)) < 3600000 && ["Requested", "Confirmed"].includes(x.status))) { toast.error("You already have a session within an hour of that time."); return false; }
          return act("rescheduled", { ...action.session, status: "Confirmed", date: new Date(date).toISOString() }, String(f.get("note")).trim());
        }}>
          <Field label="New date & time"><input name="date" type="datetime-local" min={nowLocal()} required defaultValue={toLocalInput(new Date(action.session.date))} /></Field>
          {action.session.status === "Requested" && <p className="hub-caption">Rescheduling a request also confirms it at the new time.</p>}
          <Field label="Message (optional)"><textarea name="note" maxLength={1000} /></Field>
        </FormDialog>
      )}
      {action?.kind === "decline" && (
        <FormDialog destructive title={action.session.status === "Confirmed" ? "Cancel confirmed session" : "Decline session request"} description="Tell the mentee why, so they can request another time or mentor." submitLabel={action.session.status === "Confirmed" ? "Cancel session" : "Decline request"} onClose={() => setAction(null)} onSubmit={(f) => {
          const reason = String(f.get("reason")).trim();
          return act("declined", { ...action.session, status: "Declined", declineReason: reason }, reason);
        }}>
          <Field label="Reason"><textarea name="reason" required minLength={10} maxLength={1000} /></Field>
        </FormDialog>
      )}
      {action?.kind === "complete" && (
        <FormDialog title="Record session" description={`Your notes are shared with ${mentee(action.session)?.name} by email.`} submitLabel="Save and complete" onClose={() => setAction(null)} onSubmit={(f) => {
          const notes = String(f.get("notes")).trim();
          return act("completed", { ...action.session, status: "Completed", mentorNotes: notes }, notes);
        }}>
          <Field label="What you discussed and agreed next steps"><textarea name="notes" required minLength={20} maxLength={2000} rows={6} /></Field>
        </FormDialog>
      )}
      {editingProfile && (
        <FormDialog title="Your mentor profile" description="Mentees see this when choosing a mentor." submitLabel="Save profile" onClose={() => setEditingProfile(false)} onSubmit={async (f) => {
          // The photo is saved by its own uploader; keep any older link-based photo only if no upload exists.
          const avatar = me.avatar?.startsWith("/api/avatars/") ? "" : me.avatar ?? "";
          if (!await saveProfile({ title: String(f.get("title")).trim(), area: String(f.get("area")), bio: String(f.get("bio")).trim(), avatar, accepting: f.get("accepting") === "on" })) return false;
          toast.success("Mentor profile saved");
        }}>
          <Field label="Headline"><input name="title" required minLength={3} maxLength={100} defaultValue={me.title === "PLP mentor" ? "" : me.title} placeholder="e.g. Career coach for first-time job seekers" /></Field>
          <Field label="Focus area"><select name="area" defaultValue={me.area}>{categories.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Short bio"><textarea name="bio" required minLength={20} maxLength={600} rows={4} defaultValue={me.bio} placeholder="Your experience and how you like to help mentees." /></Field>
          <div className="hub-field"><span>Profile picture</span><ProfilePhoto size={72} /></div>
          <label className="hub-check"><input type="checkbox" name="accepting" defaultChecked={me.accepting !== false} /> Accepting new session requests</label>
        </FormDialog>
      )}
    </div>
  );
}

