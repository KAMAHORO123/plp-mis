import { EmailVerificationPage } from "./verification-page";
import { ForgotPassword } from "./auth-options";
import { Attendance } from "./attendance";
import { AuthShell, PasswordField } from "./auth-shell";
import { SchoolCertificates } from "./school-certificates";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Link,
  Routes,
  Route,
  useParams,
} from "react-router-dom";
import { FilePenLine, Trash2, Menu, X } from "lucide-react";
import { api } from "./api";
import "./style.css";
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  school_id: string | null;
};
type Data = {
  url?: string;
  status?: string;
  feedback?: string;
  reference_id?: string;
  activity_type?: string;
  report?: string;
  school_id?: string;
  school_ids?: string[];
  email?: string;
  attachments?: string[];
  title: string;
  description: string;
  published?: boolean;
  date?: string;
  lessons?: { title: string; content: string }[];
  question?: string;
  options?: string[];
  answer?: number;
  assignment?: string;
};
type RecordItem = {
  id: string;
  kind: string;
  data: Data;
  version: number;
  owner_id: string;
  school_id: string | null;
};
type Certificate = {
  id: string;
  recipient: string;
  programme: string;
  issued_at: string;
  revoked_at: string | null;
};
const sections = [
  "events",
  "courses",
  "materials",
  "opportunities",
  "members",
  "applications",
  "mentorship",
  "proofs",
];
const labels: Record<string, string> = {
  events: "Events",
  courses: "Learning",
  materials: "Resources",
  opportunities: "Opportunities",
  members: "School members",
  applications: "Applications",
  mentorship: "Mentorship",
  projects: "Projects",
  proofs: "Learning evidence",
  posts: "Community discussions",
  certificates: "Certificates",
  users: "Membership approvals",
  schools: "Schools",
  announcement: "Website banner",
  audit: "Audit history",
  account: "Account security",
  files: "My files",
  credits: "My credits",
  overview: "Overview",
  reports: "Reports",
  requests: "School certificates",
};
function App() {
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    api<User>("/me")
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  if (loading)
    return <main className="app-loading">Loading your workspace…</main>;
  return (
    <>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path="/reset" element={<ResetPassword />} />
        <Route path="/verify/:id" element={<Verify />} />
        <Route
          path="*"
          element={
            user ? (
              <Workspace
                user={user}
                logout={async () => {
                  await api("/auth/logout", "POST");
                  setUser(null);
                }}
              />
            ) : (
              <Access
                onLogin={async () => setUser(await api<User>("/me"))}
                error={error}
                setError={setError}
              />
            )
          }
        />
      </Routes>
    </>
  );
}
function ResetPassword() {
  const [token] = useState(() => window.location.hash.slice(1)),
    [message, setMessage] = useState(""),
    [done, setDone] = useState(false);
  useEffect(() => {
    history.replaceState(null, "", location.pathname);
  }, []);
  return (
    <AuthShell
      title="Choose a new password"
      intro="Your new password signs you out of every other device."
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api("/auth/reset", "POST", {
              token,
              password: new FormData(e.currentTarget).get("password"),
            });
            setDone(true);
            setMessage("Password updated. You can sign in.");
          } catch (e) {
            setMessage((e as Error).message);
          }
        }}
      >
        <PasswordField
          label="New password"
          name="password"
          autoComplete="new-password"
          hint="Use at least 12 characters."
        />
        <p role="status">
          {message ||
            (!token
              ? "Use Forgot password to request a new recovery link."
              : "")}
        </p>
        <button type="submit" disabled={done || !token}>
          Reset password
        </button>
      </form>
      <p className="auth-footnote">
        {done ? (
          <a href="/sign-in">Return to sign in</a>
        ) : (
          <Link to="/forgot-password">Request another recovery link</Link>
        )}
      </p>
    </AuthShell>
  );
}
function Access({
  onLogin,
  error,
  setError,
}: {
  onLogin: () => Promise<void>;
  error: string;
  setError: (s: string) => void;
}) {
  const [register, setRegister] = useState(
      window.location.pathname === "/join",
    ),
    [busy, setBusy] = useState(false),
    [reset] = useState(
      () => new URLSearchParams(window.location.search).get("reset") === "1",
    );
  function choose(join: boolean) {
    setRegister(join);
    setError("");
    history.replaceState(null, "", join ? "/join" : "/sign-in");
  }
  return (
    <AuthShell
      title={register ? "Create your account" : "Log in to your account"}
      intro={
        register
          ? "Create an account, then verify your email with a 6-digit code to get started."
          : "Enter your credentials to access your PLP Hub."
      }
    >
      <form
        key={register ? "join" : "sign-in"}
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          const f = new FormData(e.currentTarget);
          if (register && f.get("password") !== f.get("confirm"))
            return setError("The two passwords do not match.");
          setBusy(true);
          try {
            const authResult = await api<{pendingApproval?:boolean}>(register ? "/auth/register" : "/auth/login", "POST", {
              email: f.get("email"),
              password: f.get("password"),
              ...(register ? { name: f.get("name") } : {}),
            });
            if (authResult.pendingApproval) { setError("Your staff application is awaiting administrator approval."); return; }
            if (register) {
              sessionStorage.setItem(
                "plp-verification-email",
                String(f.get("email")),
              );
              window.location.assign("/verify-email");
            } else await onLogin();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {reset && !register && !error && (
          <p role="status">Password updated. Log in with your new password.</p>
        )}
        {register && (
          <label>
            Full name
            <input
              name="name"
              required
              maxLength={200}
              autoComplete="name"
              placeholder="Enter your full name"
            />
          </label>
        )}
        <label>
          Email address
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            placeholder="Enter your email"
          />
        </label>
        <PasswordField
          label="Password"
          name="password"
          autoComplete={register ? "new-password" : "current-password"}
        />
        {register && (
          <PasswordField
            label="Confirm password"
            name="confirm"
            autoComplete="new-password"
          />
        )}
        {!register && (
          <div className="auth-row">
            <Link className="forgot-link" to="/forgot-password">
              Forgot password?
            </Link>
          </div>
        )}
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={busy}>
          {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
        </button>
      </form>
      <p className="auth-footnote">
        {register ? "Already have an account? " : "Don’t have an account yet? "}
        <a
          href={register ? "/sign-in" : "/join"}
          onClick={(e) => {
            e.preventDefault();
            choose(!register);
          }}
        >
          {register ? "Log in here" : "Sign up here"}
        </a>
      </p>
    </AuthShell>
  );
}
function Workspace({
  user,
  logout,
}: {
  user: User;
  logout: () => Promise<void>;
}) {
  const [section, setSection] = useState("overview"),
    [open, setOpen] = useState(false),
    [error, setError] = useState("");
  const available = [
    "overview",
    ...sections.filter(
      (s) => s !== "members" || ["admin", "leader"].includes(user.role),
    ),
    "certificates",
    ...(["admin", "leader"].includes(user.role) ? ["requests", "reports"] : []),
    "account",
    "files",
    "credits",
    ...(user.role === "admin"
      ? ["users", "schools", "announcement", "audit"]
      : []),
  ];
  return (
    <div className="workspace">
      <aside className={open ? "open" : ""}>
        <img src="/logo.svg" alt="PLP" />
        <nav id="workspace-navigation" aria-label="Workspace">
          {available.map((s) => (
            <button
              key={s}
              className={section === s ? "selected" : ""}
              onClick={() => {
                setSection(s);
                setOpen(false);
              }}
            >
              {labels[s]}
            </button>
          ))}
        </nav>
      </aside>
      <div className="content">
        <header>
          <button
            className="menu secondary"
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="workspace-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
          <div>
            <strong>{user.name}</strong>
            <small>{user.role}</small>
          </div>
          <button
            className="secondary"
            onClick={() => {
              if (!window.confirm("Are you sure you want to sign out?")) return;
              void logout().catch((e) => setError(e.message));
            }}
          >
            Sign out
          </button>
        </header>
        {error && <p role="alert">{error}</p>}
        <main>
          <div className="page-title">
            <span>PEACE · LEARNING · COMMUNITY</span>
            <h1>{labels[section]}</h1>
          </div>
          {section === "overview" ? (
            <Overview />
          ) : sections.includes(section) ? (
            <Records key={section} kind={section} user={user} />
          ) : section === "requests" ? (
            <SchoolCertificates role={user.role} schoolId={user.school_id} />
          ) : section === "certificates" ? (
            <Certificates user={user} />
          ) : section === "credits" ? (
            <Credits />
          ) : section === "reports" ? (
            <Reports />
          ) : section === "files" ? (
            <Files />
          ) : section === "account" ? (
            <Account logout={logout} />
          ) : (
            <Administration key={section} section={section} />
          )}
        </main>
      </div>
    </div>
  );
}
function Overview() {
  const [data, setData] = useState<{
      courses: number;
      events: number;
      completed: number;
      certificates: number;
      trend: { month: string; total: number }[];
    } | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    api<NonNullable<typeof data>>("/overview")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p>Loading your overview…</p>;
  const stats = [
    ["Published courses", data.courses],
    ["Upcoming events", data.events],
    ["Completed learning", data.completed],
    ["Active certificates", data.certificates],
  ];
  return (
    <>
      <div className="records">
        {stats.map(([label, value]) => (
          <article key={label}>
            <small>{label}</small>
            <h2 className="metric">{value}</h2>
          </article>
        ))}
      </div>
      <section className="panel">
        <h2>Learning recognised</h2>
        <p>
          Certificates issued over the last twelve months. Your role determines
          which records you can see.
        </p>
        {data.trend.length ? (
          <div className="trend">
            {data.trend.map((r) => (
              <div key={r.month}>
                <span>{r.month}</span>
                <meter
                  min={0}
                  max={Math.max(...data.trend.map((r) => r.total), 1)}
                  value={r.total}
                />
                <strong>{r.total}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p>
            Certificate activity will appear here as members complete their
            learning.
          </p>
        )}
      </section>
    </>
  );
}
function Records({ kind, user }: { kind: string; user: User }) {
  const [items, setItems] = useState<RecordItem[]>([]),
    [editing, setEditing] = useState<RecordItem | null | undefined>(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState(""),
    [course, setCourse] = useState<RecordItem | null>(null);
  const load = () => api<RecordItem[]>("/records/" + kind).then(setItems);
  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, [kind]);
  const canEdit = (r?: RecordItem) =>
    user.role === "admin" ||
    (["applications", "mentorship", "projects", "proofs", "posts"].includes(
      kind,
    ) &&
      (!r || r.owner_id === user.id)) ||
    (kind === "courses" &&
      user.role === "trainer" &&
      (!r || r.owner_id === user.id)) ||
    (["events", "members"].includes(kind) &&
      user.role === "leader" &&
      !!user.school_id &&
      (!r || r.school_id === user.school_id));
  return (
    <>
      {error && <p role="alert">{error}</p>}
      <div className="toolbar">
        <input
          aria-label="Search records"
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {canEdit() && (
          <button onClick={() => setEditing(null)}>
            Create {kind === "courses" ? "course" : "record"}
          </button>
        )}
      </div>
      {editing === null && kind === "courses" && user.role === "admin" ? (
        <AssignCourse
          cancel={() => setEditing(undefined)}
          saved={async () => {
            setEditing(undefined);
            await load();
          }}
        />
      ) : (
        editing !== undefined && (
          <RecordForm
            kind={kind}
            record={editing}
            admin={user.role === "admin"}
            busy={busy}
            cancel={() => setEditing(undefined)}
            save={async (data) => {
              setBusy(true);
              setError("");
              try {
                await api(
                  "/records/" + kind + (editing ? "/" + editing.id : ""),
                  editing ? "PUT" : "POST",
                  editing ? { version: editing.version, data } : data,
                );
                setEditing(undefined);
                await load();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          />
        )
      )}
      <div className="records">
        {items
          .filter((r) =>
            r.data.title.toLowerCase().includes(query.toLowerCase()),
          )
          .map((r) => (
            <article key={r.id}>
              <h2>{r.data.title}</h2>
              <p>{r.data.description}</p>
              {r.data.status && (
                <p>
                  <strong>{r.data.status}</strong>
                </p>
              )}
              {r.data.feedback && <p>{r.data.feedback}</p>}
              {r.data.url && (
                <a
                  className="download"
                  href={r.data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open link
                </a>
              )}
              {r.data.attachments?.map((id, i) => (
                <a key={id} className="download" href={"/api/files/" + id}>
                  Download attachment {i + 1}
                </a>
              ))}
              {r.data.date && <p>{r.data.date}</p>}
              {r.data.report && (
                <details>
                  <summary>Activity report</summary>
                  <p>{r.data.report}</p>
                </details>
              )}
              {kind === "courses" && (
                <p>{r.data.published ? "Published" : "Draft"}</p>
              )}
              {kind === "events" && canEdit(r) && <Attendance eventId={r.id} />}
              {kind === "materials" &&
                user.role === "leader" &&
                user.school_id && (
                  <MaterialCompletion id={r.id} school={user.school_id} />
                )}
              <div className="actions">
                {kind === "courses" && r.data.published && (
                  <button onClick={() => setCourse(r)}>Start learning</button>
                )}
                {kind === "courses" && user.role === "admin" && (
                  <button
                    className="secondary"
                    onClick={async () => {
                      try {
                        await api("/records/courses/" + r.id, "PUT", {
                          version: r.version,
                          data: { ...r.data, published: !r.data.published },
                        });
                        await load();
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    {r.data.published ? "Unpublish" : "Publish"}
                  </button>
                )}
                {canEdit(r) && (
                  <>
                    {!(kind === "courses" && user.role === "admin") && (
                      <button
                        className="icon secondary"
                        aria-label={`Edit ${r.data.title}`}
                        onClick={() => setEditing(r)}
                      >
                        <FilePenLine size={18} />
                      </button>
                    )}
                    <button
                      className="icon danger"
                      aria-label={`Delete ${r.data.title}`}
                      onClick={async () => {
                        if (!confirm("Delete this record?")) return;
                        try {
                          await api("/records/" + kind + "/" + r.id, "DELETE");
                          await load();
                        } catch (e) {
                          setError((e as Error).message);
                        }
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
      </div>
      {!items.length && <p>No records yet.</p>}
      {course && <Learning course={course} close={() => setCourse(null)} />}
    </>
  );
}
function AssignCourse({
  cancel,
  saved,
}: {
  cancel: () => void;
  saved: () => Promise<void>;
}) {
  const [trainers, setTrainers] = useState<User[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    api<User[]>("/users")
      .then((rows) =>
        setTrainers(
          rows.filter((u) => u.role === "trainer" && u.status === "approved"),
        ),
      )
      .catch((e) => setError(e.message));
  }, []);
  return (
    <form
      className="panel"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        try {
          await api("/course-assignments", "POST", {
            title: f.get("title"),
            trainer_id: f.get("trainer"),
          });
          await saved();
        } catch (e) {
          setError((e as Error).message);
        }
      }}
    >
      <h2>Assign a course</h2>
      <p>
        The trainer prepares the lessons and assessment. You publish the
        completed draft.
      </p>
      <label>
        Course name
        <input name="title" required maxLength={200} />
      </label>
      <label>
        Trainer
        <select name="trainer" required>
          <option value="">Select trainer</option>
          {trainers.map((t) => (
            <option value={t.id} key={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      {error && <p role="alert">{error}</p>}
      <button>Assign course</button>
      <button type="button" className="secondary" onClick={cancel}>
        Cancel
      </button>
    </form>
  );
}
function RecordForm({
  kind,
  record,
  admin,
  busy,
  cancel,
  save,
}: {
  kind: string;
  record: RecordItem | null;
  admin: boolean;
  busy: boolean;
  cancel: () => void;
  save: (data: Data) => Promise<void>;
}) {
  const [schools, setSchools] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  useEffect(() => {
    if (admin && ["members", "materials"].includes(kind))
      api<Array<{ id: string; name: string }>>("/schools")
        .then(setSchools)
        .catch((e) => setUploadError(e.message));
  }, [admin, kind]);
  const [schoolIds, setSchoolIds] = useState<string[]>(
    record?.data.school_ids || [],
  );
  const [attachments, setAttachments] = useState<string[]>(
    record?.data.attachments || [],
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [lessons, setLessons] = useState(
    record?.data.lessons || [{ title: "", content: "" }],
  );
  return (
    <form
      className="panel"
      key={record?.id || "new"}
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const data: Data = {
          title: String(f.get("title")),
          description: String(f.get("description")),
        };
        if (kind === "events") {
          data.date = String(f.get("date"));
          data.activity_type = String(f.get("activity_type"));
          if (record?.data.report) data.report = record.data.report;
        }
        if (kind === "courses") {
          Object.assign(data, {
            published: admin
              ? f.get("published") === "on"
              : record?.data.published || false,
            lessons,
            question: String(f.get("question")),
            options: [String(f.get("option0")), String(f.get("option1"))],
            answer: Number(f.get("answer")),
          });
        }
        if (kind === "members") {
          const school = f.get("school");
          if (school) data.school_id = String(school);
          const email = f.get("email");
          if (email) data.email = String(email);
        }
        if (kind === "materials") data.school_ids = schoolIds;
        if (["applications", "proofs", "mentorship"].includes(kind)) {
          data.status = admin
            ? String(f.get("status") || "pending")
            : record?.data.status || "pending";
          data.feedback = admin
            ? String(f.get("feedback") || "")
            : record?.data.feedback || "";
        }
        if (f.get("url")) data.url = String(f.get("url"));
        data.attachments = attachments;
        void save(data);
      }}
    >
      <h2>
        {record ? "Update" : "Create"}{" "}
        {kind === "courses" ? "course" : "record"}
      </h2>
      <label>
        Title
        <input
          name="title"
          defaultValue={record?.data.title}
          required
          maxLength={200}
        />
      </label>
      {kind === "members" && (
        <>
          <label>
            Email (optional)
            <input
              name="email"
              type="email"
              defaultValue={record?.data.email}
            />
          </label>
          {admin && (
            <label>
              School
              <select
                name="school"
                required
                defaultValue={record?.school_id || ""}
                disabled={!!record}
              >
                <option value="">Select school</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </>
      )}
      {kind === "materials" && admin && (
        <fieldset>
          <legend>Assigned schools</legend>
          <p>Leave all unchecked to share with every school.</p>
          {schools.map((s) => (
            <label className="check" key={s.id}>
              <input
                type="checkbox"
                checked={schoolIds.includes(s.id)}
                onChange={(e) =>
                  setSchoolIds(
                    e.target.checked
                      ? [...schoolIds, s.id]
                      : schoolIds.filter((id) => id !== s.id),
                  )
                }
              />
              {s.name}
            </label>
          ))}
        </fieldset>
      )}
      {["materials", "opportunities", "proofs"].includes(kind) && (
        <label>
          Resource link (optional)
          <input
            name="url"
            type="url"
            placeholder="https://"
            pattern="https://.*"
            defaultValue={record?.data.url}
          />
        </label>
      )}
      {["applications", "proofs", "mentorship"].includes(kind) && admin && (
        <>
          <label>
            Review status
            <select
              name="status"
              defaultValue={record?.data.status || "pending"}
            >
              {[
                "pending",
                "approved",
                "returned",
                "rejected",
                "completed",
                "cancelled",
              ].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          <label>
            Feedback
            <textarea
              name="feedback"
              defaultValue={record?.data.feedback}
              maxLength={2000}
            />
          </label>
        </>
      )}
      <label>
        Description
        <textarea
          name="description"
          defaultValue={record?.data.description}
          maxLength={10000}
        />
      </label>
      {kind === "events" && (
        <label>
          Activity type
          <select
            name="activity_type"
            defaultValue={record?.data.activity_type || "Meeting"}
          >
            {["Meeting", "Volunteering", "Challenge", "Recruitment"].map(
              (t) => (
                <option key={t}>{t}</option>
              ),
            )}
          </select>
        </label>
      )}
      {kind === "events" && (
        <label>
          Date
          <input
            type="date"
            name="date"
            defaultValue={record?.data.date}
            required
          />
        </label>
      )}
      {kind === "courses" && (
        <>
          {lessons.map((lesson, i) => (
            <fieldset key={i}>
              <legend>Lesson {i + 1}</legend>
              <label>
                Lesson title
                <input
                  required
                  value={lesson.title}
                  onChange={(e) =>
                    setLessons(
                      lessons.map((l, j) =>
                        j === i ? { ...l, title: e.target.value } : l,
                      ),
                    )
                  }
                />
              </label>
              <label>
                Lesson content
                <textarea
                  required
                  value={lesson.content}
                  onChange={(e) =>
                    setLessons(
                      lessons.map((l, j) =>
                        j === i ? { ...l, content: e.target.value } : l,
                      ),
                    )
                  }
                />
              </label>
            </fieldset>
          ))}
          <button
            type="button"
            className="secondary"
            onClick={() => setLessons([...lessons, { title: "", content: "" }])}
          >
            Add lesson
          </button>
          <label>
            Assessment question
            <input
              name="question"
              required
              defaultValue={record?.data.question}
            />
          </label>
          {[0, 1].map((i) => (
            <label key={i}>
              Answer option {i + 1}
              <input
                name={"option" + i}
                required
                defaultValue={record?.data.options?.[i]}
              />
            </label>
          ))}
          <label>
            Correct answer
            <select name="answer" defaultValue={record?.data.answer || 0}>
              <option value={0}>Option 1</option>
              <option value={1}>Option 2</option>
            </select>
          </label>
          {admin && (
            <label className="check">
              <input
                type="checkbox"
                name="published"
                defaultChecked={record?.data.published}
              />
              Published
            </label>
          )}
        </>
      )}
      <label>
        Attach a PDF or image (up to 10 MB)
        <input
          type="file"
          accept="application/pdf,image/png,image/jpeg"
          disabled={uploading || attachments.length >= 10}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploadError("");
            if (file.size > 10485760) {
              setUploadError("Choose a file smaller than 10 MB.");
              return;
            }
            setUploading(true);
            try {
              const response = await fetch("/api/files", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                  "Content-Type": file.type,
                  "X-File-Name": file.name.replace(/[^a-zA-Z0-9._ -]/g, "_"),
                },
                body: file,
              });
              const result = await response.json();
              if (!response.ok) throw Error(result.error || "Upload failed");
              setAttachments([...attachments, result.id]);
            } catch (e) {
              setUploadError((e as Error).message);
            } finally {
              setUploading(false);
            }
          }}
        />
      </label>
      {uploading && <p role="status">Uploading…</p>}
      {uploadError && <p role="alert">{uploadError}</p>}
      {attachments.map((id, i) => (
        <div className="actions" key={id}>
          <a href={"/api/files/" + id}>Attachment {i + 1}</a>
          <button
            type="button"
            className="secondary"
            onClick={() => setAttachments(attachments.filter((a) => a !== id))}
          >
            Remove attachment
          </button>
        </div>
      ))}
      <div className="actions">
        <button disabled={busy || uploading}>Save</button>
        <button type="button" className="secondary" onClick={cancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
function Learning({
  course,
  close,
}: {
  course: RecordItem;
  close: () => void;
}) {
  const [enrollment, setEnrollment] = useState<{
      id: string;
      lessons: number[];
      passed: boolean;
    } | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    api("/enrollments", "POST", { course_id: course.id })
      .then(() =>
        api<
          Array<{
            id: string;
            course_id: string;
            lessons: number[];
            passed: boolean;
          }>
        >("/enrollments"),
      )
      .then((rows) =>
        setEnrollment(rows.find((e) => e.course_id === course.id) || null),
      )
      .catch((e) => setError(e.message));
  }, [course.id]);
  return (
    <section className="panel" aria-label="Course learning">
      <button className="secondary" onClick={close}>
        Close course
      </button>
      <h2>{course.data.title}</h2>
      {error && <p role="alert">{error}</p>}
      {course.data.lessons?.map((lesson, i) => (
        <article key={i}>
          <h3>{lesson.title}</h3>
          <p>{lesson.content}</p>
          <button
            disabled={!enrollment || enrollment.lessons.includes(i)}
            onClick={async () => {
              try {
                await api(`/enrollments/${enrollment!.id}/progress`, "POST", {
                  lesson: i,
                });
                setEnrollment({
                  ...enrollment!,
                  lessons: [...enrollment!.lessons, i],
                });
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            {enrollment?.lessons.includes(i) ? "Completed" : "Mark complete"}
          </button>
        </article>
      ))}
      {enrollment?.passed ? (
        <p role="status">
          Course completed. Your certificate is in Certificates.
        </p>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            try {
              const r = await api<{ passed: boolean }>(
                `/enrollments/${enrollment!.id}/progress`,
                "POST",
                {
                  assignment: f.get("assignment"),
                  answer: Number(f.get("answer")),
                },
              );
              if (r.passed) setEnrollment({ ...enrollment!, passed: true });
              else setError("Review the lesson and try the assessment again.");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          <label>
            Your reflection
            <textarea name="assignment" required minLength={20} />
          </label>
          <label>
            {course.data.question}
            <select name="answer">
              {course.data.options?.map((o, i) => (
                <option value={i} key={i}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <button disabled={!enrollment}>Submit assessment</button>
        </form>
      )}
    </section>
  );
}
function Certificates({ user }: { user: User }) {
  const [members, setMembers] = useState<User[]>([]);
  useEffect(() => {
    if (user.role === "admin")
      api<User[]>("/users")
        .then((rows) => setMembers(rows.filter((u) => u.status === "approved")))
        .catch((e) => setError(e.message));
  }, [user.role]);
  const [rows, setRows] = useState<Certificate[]>([]),
    [error, setError] = useState("");
  const load = () => api<Certificate[]>("/certificates").then(setRows);
  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, []);
  return (
    <>
      {error && <p role="alert">{error}</p>}
      {user.role === "admin" && (
        <form
          className="panel"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            try {
              await api("/certificates", "POST", {
                member_id: f.get("member"),
                programme: f.get("programme"),
              });
              await load();
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          <h2>Issue a certificate</h2>
          <label>
            Member
            <select name="member" required>
              <option value="">Choose a member</option>
              {members.map((m) => (
                <option value={m.id} key={m.id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </label>
          <label>
            Programme
            <input name="programme" required />
          </label>
          <button>Issue certificate</button>
        </form>
      )}
      <div className="records">
        {rows.map((r) => (
          <article key={r.id}>
            <h2>{r.programme}</h2>
            <p>{r.recipient}</p>
            <p>
              {r.revoked_at ? "Revoked" : "Issued"} ·{" "}
              {new Date(r.issued_at).toLocaleDateString()}
            </p>
            <Link to={"/verify/" + r.id}>View verification</Link>
            {!r.revoked_at && (
              <a
                className="download"
                href={"/api/certificates/" + r.id + "/download"}
              >
                Download PDF
              </a>
            )}
            {user.role === "admin" && !r.revoked_at && (
              <button
                className="danger"
                onClick={async () => {
                  const reason = prompt("Reason for revocation");
                  if (!reason) return;
                  try {
                    await api("/certificates/" + r.id + "/revoke", "POST", {
                      reason,
                    });
                    await load();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Revoke
              </button>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
function Verify() {
  const { id } = useParams();
  const [cert, setCert] = useState<Certificate | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    api<Certificate>("/public/certificates/" + id)
      .then(setCert)
      .catch((e) => setError(e.message));
  }, [id]);
  return (
    <main className="access">
      <img src="/logo.svg" alt="PLP" />
      <h1>Certificate verification</h1>
      {error ? (
        <p role="alert">{error}</p>
      ) : cert ? (
        <>
          <h2>
            {cert.revoked_at ? "Certificate revoked" : "Certificate verified"}
          </h2>
          <p>{cert.recipient}</p>
          <p>{cert.programme}</p>
          <p>Issued {new Date(cert.issued_at).toLocaleDateString()}</p>
          <small>{cert.id}</small>
        </>
      ) : (
        <p>Checking certificate…</p>
      )}
    </main>
  );
}
function MaterialCompletion({ id, school }: { id: string; school: string }) {
  const [done, setDone] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    api<Array<{ material_id: string; school_id: string }>>(
      "/material-completions",
    )
      .then((rows) =>
        setDone(
          rows.some((r) => r.material_id === id && r.school_id === school),
        ),
      )
      .catch((e) => setError(e.message));
  }, [id, school]);
  return (
    <>
      <button
        className="secondary"
        disabled={done}
        onClick={async () => {
          try {
            await api("/materials/" + id + "/completion", "PUT", {
              school_id: school,
            });
            setDone(true);
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        {done ? "Completed by your school" : "Mark school learning complete"}
      </button>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
function Reports() {
  type Row = {
    id: string;
    name: string;
    district: string;
    accounts: number;
    register_members: number;
    events: number;
    completed_materials: number;
    certificates: number;
  };
  const [rows, setRows] = useState<Row[]>([]),
    [error, setError] = useState(""),
    [query, setQuery] = useState("");
  useEffect(() => {
    api<Row[]>("/reports")
      .then(setRows)
      .catch((e) => setError(e.message));
  }, []);
  const filtered = rows.filter((r) =>
    (r.name + " " + r.district).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      {error && <p role="alert">{error}</p>}
      <div className="toolbar">
        <input
          placeholder="Search schools or districts"
          aria-label="Search reports"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onClick={() => {
            const columns = [
              "name",
              "district",
              "accounts",
              "register_members",
              "events",
              "completed_materials",
              "certificates",
            ] as const;
            const escape = (value: unknown) => {
              let s = String(value);
              if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
              return '"' + s.replace(/"/g, '""') + '"';
            };
            const csv = [
              columns.join(","),
              ...filtered.map((r) =>
                columns.map((k) => escape(r[k])).join(","),
              ),
            ].join("\r\n");
            const url = URL.createObjectURL(
              new Blob([csv], { type: "text/csv;charset=utf-8" }),
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = "plp-school-report.csv";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Download report
        </button>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {[
                "School",
                "District",
                "Accounts",
                "Register members",
                "Events",
                "Completed materials",
                "Certificates",
              ].map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <th>{r.name}</th>
                <td>{r.district}</td>
                <td>{r.accounts}</td>
                <td>{r.register_members}</td>
                <td>{r.events}</td>
                <td>{r.completed_materials}</td>
                <td>{r.certificates}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
function Credits() {
  const [rows, setRows] = useState<
      Array<{ id: string; label: string; amount: number; awarded_at: string }>
    >([]),
    [error, setError] = useState("");
  useEffect(() => {
    api<typeof rows>("/credits")
      .then(setRows)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <>
      {error && <p role="alert">{error}</p>}
      <div className="panel">
        <small>Learning and service recognised</small>
        <h2 className="metric">
          {rows.reduce((sum, r) => sum + r.amount, 0)} credits
        </h2>
        <p>
          Course completion earns 50 credits. Recorded activities earn the
          existing PLP activity award once.
        </p>
      </div>
      <div className="records">
        {rows.map((r) => (
          <article key={r.id}>
            <h2>{r.label}</h2>
            <p>
              {r.amount} credits · {new Date(r.awarded_at).toLocaleDateString()}
            </p>
          </article>
        ))}
      </div>
    </>
  );
}
function Files() {
  const [files, setFiles] = useState<
      Array<{ id: string; filename: string; bytes: number }>
    >([]),
    [error, setError] = useState("");
  const load = () => api<typeof files>("/files").then(setFiles);
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  return (
    <>
      {error && <p role="alert">{error}</p>}
      <p>
        Files are private unless you attach them to a record other members can
        access. Remove a file from its records before deleting it.
      </p>
      <div className="records">
        {files.map((f) => (
          <article key={f.id}>
            <h2>{f.filename}</h2>
            <p>{Math.ceil(f.bytes / 1024)} KB</p>
            <a className="download" href={"/api/files/" + f.id}>
              Download
            </a>
            <button
              className="icon danger"
              aria-label={"Delete " + f.filename}
              onClick={async () => {
                if (!confirm("Permanently delete this file?")) return;
                try {
                  await api("/files/" + f.id, "DELETE");
                  await load();
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              <Trash2 size={18} />
            </button>
          </article>
        ))}
      </div>
    </>
  );
}
function Account({ logout }: { logout: () => Promise<void> }) {
  const [error, setError] = useState("");
  return (
    <form
      className="panel"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        try {
          await api("/me/password", "PUT", {
            current: f.get("current"),
            password: f.get("password"),
          });
          await logout();
        } catch (e) {
          setError((e as Error).message);
        }
      }}
    >
      <h2>Change password</h2>
      <p>You will need to sign in again on every device.</p>
      <label>
        Current password
        <input
          type="password"
          name="current"
          required
          autoComplete="current-password"
        />
      </label>
      <label>
        New password
        <input
          type="password"
          name="password"
          required
          minLength={12}
          maxLength={128}
          autoComplete="new-password"
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <button>Update password</button>
    </form>
  );
}
function Administration({ section }: { section: string }) {
  const [announcement, setAnnouncement] = useState<Record<
    string,
    string | boolean
  > | null>(null);
  const [schools, setSchools] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  useEffect(() => {
    if (section === "users")
      api<Array<{ id: string; name: string }>>("/schools")
        .then(setSchools)
        .catch((e) => setError(e.message));
  }, [section]);
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const load = () =>
    section === "announcement"
      ? api<Record<string, string | boolean>>("/announcement").then(
          setAnnouncement,
        )
      : api<Array<Record<string, unknown>>>("/" + section).then(setRows);
  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, [section]);
  return (
    <>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      {section === "announcement" && announcement ? (
        <form
          className="panel"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            try {
              await api("/announcement", "PUT", {
                enabled: f.get("enabled") === "on",
                title: f.get("title"),
                date: f.get("date"),
                location: f.get("location"),
                href: f.get("href"),
                linkLabel: f.get("linkLabel"),
              });
              setMessage("Announcement saved.");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          {["title", "date", "location", "href", "linkLabel"].map((name) => (
            <label key={name}>
              {name}
              <input
                name={name}
                defaultValue={String(announcement[name] || "")}
                required
                type={name === "date" ? "date" : "text"}
              />
            </label>
          ))}
          <label className="check">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={!!announcement.enabled}
            />
            Show banner
          </label>
          <button>Save announcement</button>
        </form>
      ) : section === "schools" ? (
        <form
          className="panel"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            try {
              await api("/schools", "POST", {
                name: f.get("name"),
                district: f.get("district"),
              });
              await load();
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          <label>
            School name
            <input name="name" required />
          </label>
          <label>
            District
            <input name="district" required />
          </label>
          <button>Add school</button>
        </form>
      ) : null}
      <div className="records">
        {rows.map((r, i) => (
          <article key={String(r.id || i)}>
            {section === "users" ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  try {
                    await api("/users/" + r.id, "PATCH", {
                      role: f.get("role"),
                      status: f.get("status"),
                      school_id: f.get("school_id") || null,
                    });
                    await load();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <h2>{String(r.name)}</h2>
                <p>{String(r.email)}</p>
                <label>
                  Role
                  <select name="role" defaultValue={String(r.role)}>
                    {["member", "leader", "trainer", "admin"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Status
                  <select name="status" defaultValue={String(r.status)}>
                    {["pending", "approved", "suspended", "rejected"].map(
                      (v) => (
                        <option key={v}>{v}</option>
                      ),
                    )}
                  </select>
                </label>
                <label>
                  School
                  <select
                    name="school_id"
                    defaultValue={String(r.school_id || "")}
                  >
                    <option value="">No school assigned</option>
                    {schools.map((s) => (
                      <option value={s.id} key={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                <small>Member ID: {String(r.id)}</small>
                <button>Update access</button>
              </form>
            ) : section === "schools" ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  try {
                    await api("/schools/" + r.id, "PUT", {
                      name: f.get("name"),
                      district: f.get("district"),
                    });
                    await load();
                    setMessage("School updated.");
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <label>
                  School name
                  <input name="name" defaultValue={String(r.name)} required />
                </label>
                <label>
                  District
                  <input
                    name="district"
                    defaultValue={String(r.district)}
                    required
                  />
                </label>
                <div className="actions">
                  <button
                    className="icon secondary"
                    aria-label={"Update " + r.name}
                  >
                    <FilePenLine size={18} />
                  </button>
                  <button
                    type="button"
                    className="icon danger"
                    aria-label={"Delete " + r.name}
                    onClick={async () => {
                      if (
                        !confirm(
                          "Delete this school? Schools with linked members or records cannot be deleted.",
                        )
                      )
                        return;
                      try {
                        await api("/schools/" + r.id, "DELETE");
                        await load();
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h2>{String(r.name || r.action)}</h2>
                <p>{String(r.district || r.entity_id || "")}</p>
                <small>{String(r.id)}</small>
              </>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
