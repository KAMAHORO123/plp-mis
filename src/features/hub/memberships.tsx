import { useEffect, useState } from "react";
import { useLiveTick } from './live';
import { Ban, CheckCircle2, XCircle, FilePenLine, GraduationCap, HeartHandshake, RotateCcw, Trash2, UserPlus, UserRoundCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { confirmAction } from "@/components/shared/confirm-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { platformApi } from "./platform-api";
import { Empty, Field, Panel } from "./ui";
import { RecordTable } from "./management-ui";
import "./workspaces.css";

type Person = { id: string; name: string; email: string; role: string; status: string; school_id: string | null; requested_role: string | null; role_review: string; created_at: string };
const roleName = (role: string) => ({ member: "Member", trainer: "Trainer", mentor: "Mentor", leader: "Club leader", admin: "Administrator" }[role] || role);
const statusName = (status: string) => ({ pending: "Awaiting approval", approved: "Active", suspended: "Suspended", rejected: "Declined" }[status] || status);
const VIEWS = ["All", "Awaiting approval", "Trainers", "Mentors", "Club leaders", "Members", "Administrators", "Suspended"] as const;
const inView = (p: Person, view: string) => view === "All" || (view === "Awaiting approval" ? p.status === "pending" : view === "Suspended" ? ["suspended", "rejected"].includes(p.status) : p.status !== "pending" && p.role === { Trainers: "trainer", Mentors: "mentor", "Club leaders": "leader", Members: "member", Administrators: "admin" }[view]);

export function MembershipsPage() {
  const [people, setPeople] = useState<Person[]>([]), [schools, setSchools] = useState<{ id: string; name: string }[]>([]), [self, setSelf] = useState("");
  const [view, setView] = useState<string>("All"), [editing, setEditing] = useState<Person | null>(null), [adding, setAdding] = useState(false);
  const [error, setError] = useState(""), [busy, setBusy] = useState(false), [loaded, setLoaded] = useState(false);
  const load = () => Promise.all([platformApi<Person[]>("/users"), platformApi<{ id: string }>("/me"), platformApi<{ id: string; name: string }[]>("/schools")]).then(([users, me, list]) => { setPeople(users); setSelf(me.id); setSchools(list); });
  const live = useLiveTick();
  useEffect(() => { load().catch((e) => setError(e.message)).finally(() => setLoaded(true)); }, [live]);
  async function save(p: Person, role: string, status: string, school_id: string | null, review = "", message?: string) {
    setBusy(true); setError("");
    try { await platformApi(`/users/${p.id}`, "PATCH", { role, status, school_id, review }); await load(); setEditing(null); toast.success(message ?? "Account updated"); return true; }
    catch (e) { toast.error((e as Error).message); return false; } finally { setBusy(false); }
  }
  const approve = (p: Person) => {
    const role = p.requested_role || p.role;
    return save(p, role, "approved", p.school_id, p.role_review, `${p.name} is approved as ${roleName(role).toLowerCase()}. Their ${roleName(role).toLowerCase()} dashboard is available at their next sign-in.`);
  };
  const decline = async (p: Person) => {
    if (await confirmAction({ title: `Decline ${p.name}'s ${roleName(p.requested_role || p.role).toLowerCase()} application?`, description: "They will not be able to sign in to a staff workspace.", confirmLabel: "Decline application", destructive: true }))
      await save(p, "member", "rejected", p.school_id, p.role_review, "Application declined");
  };
  const toggleSuspend = async (p: Person) => {
    const suspending = p.status === "approved";
    if (await confirmAction({ title: suspending ? `Suspend ${p.name}?` : `Reactivate ${p.name}?`, description: suspending ? "They are signed out immediately and cannot sign in until reactivated." : "They will be able to sign in again with their current role.", confirmLabel: suspending ? "Suspend" : "Reactivate", destructive: suspending }))
      await save(p, p.role, suspending ? "suspended" : "approved", p.school_id, p.role_review, suspending ? "Account suspended" : "Account reactivated");
  };
  const remove = async (p: Person) => {
    if (!await confirmAction({ title: `Delete ${p.name}'s account?`, description: "This permanently removes the account. Accounts with learning, attendance or authored records are kept — suspend those instead.", confirmLabel: "Delete account", destructive: true })) return;
    try { await platformApi(`/users/${p.id}`, "DELETE"); await load(); toast.success("Account deleted"); } catch (e) { toast.error((e as Error).message); }
  };
  const pending = people.filter((p) => p.status === "pending");
  return (
    <div className="ws-page">
      <header className="ws-page-header">
        <div><p className="ws-kicker">ADMINISTRATION</p><h1>Members & staff</h1><p>Approve staff applications, assign roles, and manage account access.</p></div>
        <button className="hub-button" onClick={() => setAdding(true)}><UserPlus size={16} /> Add account</button>
      </header>
      {error && <p role="alert" className="hub-access-error">{error}</p>}
      <div className="ws-stats">
        <StatCard label="Accounts" value={String(people.length)} icon={Users} />
        <StatCard label="Awaiting approval" value={String(pending.length)} icon={UserRoundCheck} />
        <StatCard label="Active trainers" value={String(people.filter((p) => p.role === "trainer" && p.status === "approved").length)} icon={GraduationCap} />
        <StatCard label="Active mentors" value={String(people.filter((p) => p.role === "mentor" && p.status === "approved").length)} icon={HeartHandshake} />
      </div>
      <Panel>
        <div className="ws-panel-title"><h2>Staff applications <span className="ws-count">{pending.length}</span></h2><span className="ws-pill">Trainers, mentors and club leaders cannot sign in until approved</span></div>
        {!loaded ? <p>Loading applications…</p> : !pending.length ? <Empty>No staff applications awaiting approval.</Empty> : (
          <div className="ws-table-wrap"><table className="ws-table"><thead><tr><th>Applicant</th><th>Requested role</th><th>Applied</th><th>Actions</th></tr></thead><tbody>
            {pending.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong><small>{p.email}</small></td>
                <td><span className="ws-status">{roleName(p.requested_role || p.role)}</span></td>
                <td>{new Date(p.created_at).toLocaleDateString()}</td>
                <td><div className="ms-row-actions">
                  <button className="hub-button" disabled={busy} onClick={() => void approve(p)}><CheckCircle2 size={15} /> Approve {roleName(p.requested_role || p.role).toLowerCase()}</button>
                  <button className="hub-button secondary" disabled={busy} onClick={() => setEditing(p)}>Review</button>
                  <button className="hub-button danger" disabled={busy} onClick={() => void decline(p)}><XCircle size={15} /> Decline</button>
                </div></td>
              </tr>
            ))}
          </tbody></table></div>
        )}
      </Panel>
      <Panel>
        <div className="ws-tabs" role="tablist" aria-label="Account filters">
          {VIEWS.map((v) => <button key={v} role="tab" aria-selected={view === v} className={view === v ? "active" : ""} onClick={() => setView(v)}>{v}<span>{people.filter((p) => inView(p, v)).length}</span></button>)}
        </div>
        <RecordTable key={view} title="members and staff" rows={people.filter((p) => inView(p, view))} searchText={(p) => `${p.name} ${p.email} ${roleName(p.role)} ${p.requested_role || ""}`} columns={[
          { label: "Name", render: (p) => <><strong>{p.name}</strong><small>{p.email}</small></> },
          { label: "Role", render: (p) => <span className="mb-role">{roleName(p.role)}{p.requested_role && p.status === "pending" && <small>requested {roleName(p.requested_role)}</small>}</span> },
          { label: "Status", render: (p) => <span className={`ws-status ${p.status === "approved" ? "ws-status-issued" : p.status === "pending" ? "" : "ws-status-returned"}`}>{statusName(p.status)}</span> },
          { label: "School", render: (p) => schools.find((s) => s.id === p.school_id)?.name ?? "—" },
          { label: "Actions", render: (p) => p.id === self ? <small>Your account</small> : (
            <div className="mb-actions">
              {p.status === "pending" && <button className="hub-record-icon hub-record-approve" disabled={busy} aria-label={`Approve ${p.name}`} title={`Approve as ${roleName(p.requested_role || p.role)}`} onClick={() => void approve(p)}><CheckCircle2 size={17} /></button>}
              <button className="hub-record-icon hub-record-edit" disabled={busy} aria-label={`Edit ${p.name}`} title="Edit role and access" onClick={() => setEditing(p)}><FilePenLine size={17} /></button>
              {["approved", "suspended", "rejected"].includes(p.status) && <button className="hub-record-icon hub-record-suspend" disabled={busy} aria-label={`${p.status === "approved" ? "Suspend" : "Reactivate"} ${p.name}`} title={p.status === "approved" ? "Suspend account" : "Reactivate account"} onClick={() => void toggleSuspend(p)}>{p.status === "approved" ? <Ban size={17} /> : <RotateCcw size={17} />}</button>}
              <button className="hub-record-icon hub-record-delete" disabled={busy} aria-label={`Delete ${p.name}`} title="Delete account" onClick={() => void remove(p)}><Trash2 size={17} /></button>
            </div>
          ) },
        ]} />
      </Panel>
      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="hub-app hub-dialog max-h-[90vh] overflow-y-auto">
          {editing && <>
            <DialogTitle>{editing.name}</DialogTitle>
            <DialogDescription>{editing.email}{editing.requested_role ? ` · requested ${roleName(editing.requested_role)}` : ""}</DialogDescription>
            <form className="hub-form hub-space" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); void save(editing, String(f.get("role")), String(f.get("status")), String(f.get("school")) || null, String(f.get("review"))); }}>
              <div className="ws-form-grid">
                <Field label="Role"><select name="role" defaultValue={editing.requested_role || editing.role}>{["member", "leader", "trainer", "mentor", "admin"].map((r) => <option key={r} value={r}>{roleName(r)}</option>)}</select></Field>
                <Field label="Account status"><select name="status" defaultValue={editing.status}>{["pending", "approved", "suspended", "rejected"].map((s) => <option key={s} value={s}>{statusName(s)}</option>)}</select></Field>
              </div>
              <Field label="School (club leaders)"><select name="school" defaultValue={editing.school_id || ""}><option value="">No school</option>{schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
              <Field label="Review note"><textarea name="review" maxLength={1000} defaultValue={editing.role_review} /></Field>
              <div className="hub-actions hub-dialog-actions"><button type="button" className="hub-button secondary" onClick={() => setEditing(null)}>Cancel</button><button className="hub-button" disabled={busy}>Save access</button></div>
            </form>
          </>}
        </DialogContent>
      </Dialog>
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="hub-app hub-dialog max-h-[90vh] overflow-y-auto">
          <DialogTitle>Add account</DialogTitle>
          <DialogDescription>The account is active immediately. Ask the person to choose “Forgot password” on the sign-in page to set their password.</DialogDescription>
          <form className="hub-form hub-space" onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setBusy(true);
            try { await platformApi("/users", "POST", { name: String(f.get("name")).trim(), email: String(f.get("email")).trim(), role: String(f.get("role")), school_id: String(f.get("school")) || null }); await load(); setAdding(false); toast.success("Account created"); }
            catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
          }}>
            <Field label="Full name"><input name="name" required maxLength={200} /></Field>
            <Field label="Email"><input name="email" type="email" required maxLength={254} /></Field>
            <div className="ws-form-grid">
              <Field label="Role"><select name="role" defaultValue="member">{["member", "leader", "trainer", "mentor", "admin"].map((r) => <option key={r} value={r}>{roleName(r)}</option>)}</select></Field>
              <Field label="School (club leaders)"><select name="school" defaultValue=""><option value="">No school</option>{schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
            </div>
            <div className="hub-actions hub-dialog-actions"><button type="button" className="hub-button secondary" onClick={() => setAdding(false)}>Cancel</button><button className="hub-button" disabled={busy}>Create account</button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
