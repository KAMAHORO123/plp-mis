import { useEffect, useState } from "react";
import { api } from "./api";
export function Attendance({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false),
    [members, setMembers] = useState<{ id: string; name: string }[]>([]),
    [selected, setSelected] = useState<string[]>([]),
    [message, setMessage] = useState("");
  useEffect(() => {
    if (open)
      Promise.all([
        api<{ id: string; name: string }[]>("/school-members"),
        api<{ member_id?: string; register_member_id?: string }[]>(
          "/events/" + eventId + "/attendance",
        ),
        api<{ id: string; data: { title: string } }[]>("/records/members"),
      ])
        .then(([users, rows, register]) => {
          setMembers([
            ...users.map((u) => ({
              id: "account:" + u.id,
              name: u.name + " (account)",
            })),
            ...register.map((m) => ({
              id: "register:" + m.id,
              name: m.data.title + " (school register)",
            })),
          ]);
          setSelected(
            rows.map((r) =>
              r.member_id
                ? "account:" + r.member_id
                : "register:" + r.register_member_id,
            ),
          );
        })
        .catch((e) => setMessage(e.message));
  }, [open, eventId]);
  return (
    <>
      <button className="secondary" onClick={() => setOpen(!open)}>
        {open ? "Close attendance" : "Manage attendance and report"}
      </button>
      {open && (
        <>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api("/events/" + eventId + "/attendance", "PUT", {
                  member_ids: selected
                    .filter((id) => id.startsWith("account:"))
                    .map((id) => id.slice(8)),
                  register_member_ids: selected
                    .filter((id) => id.startsWith("register:"))
                    .map((id) => id.slice(9)),
                });
                setMessage("Attendance saved.");
              } catch (e) {
                setMessage((e as Error).message);
              }
            }}
          >
            {members.map((m) => (
              <label className="check" key={m.id}>
                <input
                  type="checkbox"
                  checked={selected.includes(m.id)}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked
                        ? [...selected, m.id]
                        : selected.filter((id) => id !== m.id),
                    )
                  }
                />
                {m.name}
              </label>
            ))}
            <button>Save attendance</button>
          </form>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api("/events/" + eventId + "/report", "POST", {
                  report: new FormData(e.currentTarget).get("report"),
                });
                setMessage(
                  "Report saved. Credits awarded once to recorded member accounts.",
                );
              } catch (e) {
                setMessage((e as Error).message);
              }
            }}
          >
            <label>
              Activity report
              <textarea
                name="report"
                minLength={20}
                maxLength={10000}
                required
              />
            </label>
            <button>Submit report</button>
          </form>
          <p role="status">{message}</p>
        </>
      )}
    </>
  );
}
