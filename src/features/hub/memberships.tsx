import { demoSchools } from "./school-data";
import { useState } from "react";
import { toast } from "sonner";
import { clubs, roles } from "./data";
import { useHub, uid, type Profile } from "./store";
import { Field, Heading, Panel, Tag, Empty, downloadText } from "./ui";
export function MembershipsPage() {
  const { state, profile, update } = useHub();
  const [filter, setFilter] = useState("Approved");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [inviteUrl, setInviteUrl] = useState("");
  const admin = profile.role === "Administrator";
  const managedClubs = clubs.filter(
    (c) => admin || profile.managedClubIds.includes(c.id),
  );
  function review(member: Profile, status: Profile["membership"]) {
    const note = notes[member.id]?.trim() || "";
    if ((status === "Rejected" || status === "Suspended") && !note) {
      toast.error("Add feedback so the member understands the next step.");
      return;
    }
    if (
      update((s) => {
        const p = s.profiles.find((x) => x.id === member.id)!;
        p.membership = status;
        p.reviewNote =
          note ||
          "Your PLP membership has been approved. Welcome to the community.";
      })
    )
      toast.success(`Membership ${status.toLowerCase()}`);
  }
  return (
    <>
      <Heading
        eyebrow={admin ? "WELCOME THE NEXT GENERATION" : "GROW YOUR COMMUNITY"}
        title={admin ? "Member management" : "Club invitations"}
        description={
          admin
            ? "Members join automatically. Manage existing accounts and club invitations."
            : "Invite members to the clubs you are assigned to lead."
        }
      />
      {admin && (
        <>
          <div className="hub-chips">
            {["Approved", "Suspended"].map((x) => (
              <button
                key={x}
                className={filter === x ? "active" : ""}
                onClick={() => setFilter(x)}
              >
                {x} · {state.profiles.filter((p) => p.membership === x).length}
              </button>
            ))}
          </div>
          <div className="hub-stack">
            {state.profiles
              .filter((p) => p.membership === filter)
              .map((p) => {
                const request = state.membershipRequests.find(
                  (r) => r.memberId === p.id,
                );
                return (
                  <Panel key={p.id}>
                    <div className="hub-row">
                      <div>
                        <h2>{p.name}</h2>
                        <p>
                          {p.email || "Existing preview profile"} · {p.role}
                        </p>
                      </div>
                      <Tag>{p.membership}</Tag>
                    </div>
                    <p className="hub-caption">
                      Joined {request?.submittedAt || p.joined} ·{" "}
                      {request?.entry || p.bio || "Sample account"}
                    </p>
                    {request && (
                      <p className="hub-prewrap">{request.motivation}</p>
                    )}
                    {p.reviewNote && (
                      <p className="hub-caption">
                        Previous feedback: {p.reviewNote}
                      </p>
                    )}
                    {p.id !== profile.id && <form className="hub-form hub-space" onSubmit={e=>{
                      e.preventDefault(); const f=new FormData(e.currentTarget);const role=String(f.get("staffRole")) as Profile["role"];const schoolId=String(f.get("schoolId"));
                      if (role === "School coordinator" && !schoolId) {toast.error("Assign a school to this coordinator.");return;}
                      if(update(s=>{const target=s.profiles.find(x=>x.id===p.id)!;target.role=role;target.schoolId=schoolId||undefined;target.requestedRole=undefined;target.managedClubIds=role==="Club leader"?f.getAll("managedClub").map(String):[];}))toast.success("Staff assignment updated");
                    }}>
                      {p.requestedRole && <p className="hub-feedback">Requested role: {p.requestedRole}. Verify the assignment before granting staff access.</p>}
                      <Field label={`Role for ${p.name}`}><select name="staffRole" defaultValue={p.role}>{roles.map(role=><option key={role}>{role}</option>)}</select></Field>
                      <fieldset className="hub-managed-clubs"><legend>Assigned clubs for {p.name} (club leaders only)</legend>{clubs.map(c=><label className="hub-check" key={c.id}><input type="checkbox" name="managedClub" value={c.id} defaultChecked={p.managedClubIds.includes(c.id)}/>{c.name}</label>)}</fieldset>
                      <Field label={`School for ${p.name}`}><select name="schoolId" defaultValue={p.schoolId??""}><option value="">No school assignment</option>{demoSchools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
                      <button className="hub-button secondary">Save role assignment</button>
                    </form>}
                    {p.id !== profile.id && (
                      <>
                        <Field label={`Review feedback for ${p.name}`}>
                          <textarea
                            value={notes[p.id] || ""}
                            onChange={(e) =>
                              setNotes({ ...notes, [p.id]: e.target.value })
                            }
                            maxLength={1000}
                            placeholder="Explain the decision or the next step…"
                          />
                        </Field>
                        <div className="hub-actions">
                          {p.membership !== "Approved" && (
                            <button
                              className="hub-button"
                              onClick={() => review(p, "Approved")}
                            >
                              {p.membership === "Suspended"
                                ? "Restore membership"
                                : "Restore membership"}
                            </button>
                          )}
                          {p.membership === "Approved" && (
                            <button
                              className="hub-button secondary"
                              onClick={() => review(p, "Suspended")}
                            >
                              Pause membership
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </Panel>
                );
              })}
            {!state.profiles.some((p) => p.membership === filter) && (
              <Empty>
                No {filter.toLowerCase()} memberships.
              </Empty>
            )}
          </div>
        </>
      )}
      <Panel className="hub-space">
        <h2>Invite someone to a club</h2>
        <p>
          An invitation from an approved leader allows the recipient to join the
          assigned club after creating their profile.
        </p>
        {managedClubs.length ? (
          <form
            className="hub-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const email = String(f.get("email")).trim().toLowerCase();
              const clubId = String(f.get("clubId"));
              if (state.profiles.some((p) => p.email.toLowerCase() === email)) {
                toast.error(
                  "This email already has a profile. Administrators can manage its membership.",
                );
                return;
              }
              if (
                state.invitations.some(
                  (i) => i.email === email && !i.usedBy && !i.revoked,
                )
              ) {
                toast.error(
                  "An active invitation already exists for this email.",
                );
                return;
              }
              const code = uid();
              if (
                update((s) => {
                  s.invitations.push({
                    id: uid(),
                    code,
                    email,
                    clubId,
                    createdBy: profile.id,
                  });
                })
              ) {
                setInviteUrl(`${window.location.origin}/join?invite=${code}`);
                toast.success(
                  "Local invitation created. No email has been sent.",
                );
              }
            }}
          >
            <Field label="Invitee email">
              <input name="email" type="email" required />
            </Field>
            <Field label="Club">
              <select name="clubId">
                {managedClubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <button className="hub-button">Create invitation</button>
          </form>
        ) : (
          <Empty>
            No clubs have been assigned to you. An administrator can assign a
            club.
          </Empty>
        )}
        {inviteUrl && (
          <div className="hub-code-box hub-space">
            <h3>Invitation ready</h3>
            <p>
              This preview invitation works only in this browser. No email was
              sent.
            </p>
            <code data-testid="invitation-url">{inviteUrl}</code>
            <button
              className="hub-button secondary"
              onClick={() => downloadText("plp-invitation.txt", inviteUrl)}
            >
              Download invitation
            </button>
          </div>
        )}
      </Panel>
      <h2 className="hub-section-title">Invitation history</h2>
      <div className="hub-stack">
        {state.invitations
          .filter((i) => admin || i.createdBy === profile.id)
          .map((i) => (
            <Panel key={i.id}>
              <div className="hub-row">
                <div>
                  <h3>{i.email}</h3>
                  <p>{clubs.find((c) => c.id === i.clubId)?.name}</p>
                </div>
                <Tag>
                  {i.usedBy
                    ? "Accepted"
                    : i.revoked
                      ? "Revoked"
                      : "Awaiting acceptance"}
                </Tag>
              </div>
              {!i.usedBy && !i.revoked && (
                <button
                  className="hub-text-button"
                  onClick={() =>
                    update((s) => {
                      s.invitations.find((x) => x.id === i.id)!.revoked = true;
                    })
                  }
                >
                  Revoke invitation
                </button>
              )}
            </Panel>
          ))}
      </div>
    </>
  );
}
