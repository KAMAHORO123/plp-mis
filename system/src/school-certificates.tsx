import { useEffect, useState } from "react";
import { api } from "./api";
type Request = {
  id: string;
  school_id: string;
  school_name: string;
  status: string;
  note: string;
  requested_at: string;
  members: { id: string; name: string }[];
};
export function SchoolCertificates({
  role,
  schoolId,
}: {
  role: string;
  schoolId: string | null;
}) {
  const [requests, setRequests] = useState<Request[]>([]),
    [schools, setSchools] = useState<{ id: string; name: string }[]>([]),
    [members, setMembers] = useState<
      { id: string; school_id: string; data: { title: string } }[]
    >([]),
    [school, setSchool] = useState(schoolId || ""),
    [selected, setSelected] = useState<string[]>([]),
    [correction, setCorrection] = useState<Request | null>(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const load = () => api<Request[]>("/certificate-requests").then(setRequests);
  useEffect(() => {
    Promise.all([
      load(),
      api<typeof schools>("/schools").then(setSchools),
      api<typeof members>("/records/members").then(setMembers),
    ]).catch((e) => setError(e.message));
  }, []);
  return (
    <>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <form
        className="panel"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          try {
            await api(
              "/certificate-requests" + (correction ? "/" + correction.id : ""),
              correction ? "PUT" : "POST",
              correction
                ? { member_ids: selected }
                : { school_id: school, member_ids: selected },
            );
            setCorrection(null);
            setSelected([]);
            setMessage("Request submitted for administrator review.");
            await load();
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <h2>
          {correction
            ? "Correct certificate request"
            : "Request school certificates"}
        </h2>
        <p>
          Certificates recognise service as a PLP member. Select names from the
          school register.
        </p>
        <label>
          School
          <select
            value={school}
            required
            disabled={role !== "admin" || !!correction}
            onChange={(e) => {
              setSchool(e.target.value);
              setSelected([]);
            }}
          >
            <option value="">Select school</option>
            {schools
              .filter((s) => role === "admin" || s.id === schoolId)
              .map((s) => (
                <option value={s.id} key={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </label>
        {members
          .filter((m) => m.school_id === school)
          .map((m) => (
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
              {m.data.title}
            </label>
          ))}
        <button disabled={!selected.length}>Submit request</button>
        {correction && (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setCorrection(null);
              setSelected([]);
            }}
          >
            Cancel correction
          </button>
        )}
      </form>
      <div className="records">
        {requests.map((r) => (
          <article key={r.id}>
            <h2>{r.school_name}</h2>
            <p>
              <strong>
                {r.status === "returned" ? "Correction required" : r.status}
              </strong>{" "}
              · {r.members.length} members
            </p>
            <p>Requested {new Date(r.requested_at).toLocaleDateString()}</p>
            <p>{r.members.map((m) => m.name).join(", ")}</p>
            {r.note && <p>{r.note}</p>}
            {r.status === "returned" && (
              <button
                onClick={() => {
                  setCorrection(r);
                  setSchool(r.school_id);
                  setSelected(r.members.map((m) => m.id));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Correct request
              </button>
            )}
            {role === "admin" &&
              ["submitted", "corrected"].includes(r.status) && (
                <div className="actions">
                  <button
                    onClick={async () => {
                      if (
                        !confirm("Issue certificates for all selected members?")
                      )
                        return;
                      try {
                        await api(
                          "/certificate-requests/" + r.id + "/review",
                          "POST",
                          { decision: "issued", note: "" },
                        );
                        await load();
                        setMessage(
                          "Certificates issued. Open Certificates to download them.",
                        );
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    Approve and issue
                  </button>
                  <button
                    className="secondary"
                    onClick={async () => {
                      const note = prompt("What needs correcting?");
                      if (!note) return;
                      try {
                        await api(
                          "/certificate-requests/" + r.id + "/review",
                          "POST",
                          { decision: "returned", note },
                        );
                        await load();
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    Request correction
                  </button>
                </div>
              )}
          </article>
        ))}
      </div>
    </>
  );
}
