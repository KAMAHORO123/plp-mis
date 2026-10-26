import { useEffect, useState, type ReactNode } from "react";
import { useLiveTick } from './live';
import { Link } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowUp, BookOpen, CheckCircle2, Circle, ClipboardCheck, Copy, Eye, FilePenLine, GraduationCap, Layers, ListChecks, Percent, Plus, Send, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { confirmAction } from "@/components/shared/confirm-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { platformApi } from "./platform-api";
import { LessonVideoEditor, LessonVideoPlayer } from "./lesson-video";
import { Empty, Field, Panel, Tag } from "./ui";
import { categories } from "./data";
import { courseChecklist, serverAssessments, EXAM_PASS_MARK, MAX_ATTEMPTS, QUIZ_PASS_MARK, type TeachingData, type TeachingQuestion } from "./teaching-types";
import "./academy.css";
import "./workspaces.css";

export type { TeachingData } from "./teaching-types";
type CourseRow = { id: string; owner_id: string; version: number; data: TeachingData; trainer_name: string; learners: number; pending_reviews: number; completions: number; avg_exam: number | null };
type LearnerRow = { id: string; course_id: string; learner_name: string; learner_email: string; course_title: string; lessons: number[]; assignment: string; passed: boolean; completed_at: string | null; review_feedback: string; reviewed_at: string | null; exam_best: number | null; attempts: number; quizzes_passed: number };
const blank = (): TeachingData => ({ title: "", description: "", category: categories[0], duration: "", level: "Beginner", published: false, lessons: [], assignment: "", outcomes: [], skills: [], exam: [], exam_minutes: 15, pass_mark: EXAM_PASS_MARK, max_attempts: MAX_ATTEMPTS, review_state: "draft" });
// Trainers publish their own courses once every requirement is met; there is no review queue.
const stateLabel = (d: TeachingData) => d.published ? "Published" : "Draft";
const STEPS = ["Overview", "Modules", "Assessment", "Preview", "Publish"] as const;
type Step = (typeof STEPS)[number];
const newId = () => crypto.randomUUID().slice(0, 12);

export function TrainerWorkspace({ overview = false, initialTab = "Courses", embedded = false }: { overview?: boolean; initialTab?: string; embedded?: boolean }) {
  const [account, setAccount] = useState<{ id: string; role: string; name: string } | null>(null);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [learners, setLearners] = useState<LearnerRow[]>([]);
  const [loaded, setLoaded] = useState(false), [error, setError] = useState("");
  const [tab, setTab] = useState(initialTab), [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<CourseRow | "new" | null>(null);
  const [reviewing, setReviewing] = useState<LearnerRow | null>(null);
  const load = () => Promise.all([platformApi<{ id: string; role: string; name: string }>("/me"), platformApi<CourseRow[]>("/teaching/courses"), platformApi<LearnerRow[]>("/teaching/enrollments")]).then(([me, rows, people]) => { setAccount(me); setCourses(rows); setLearners(people); return rows; });
  const live = useLiveTick();
  useEffect(() => { load().catch((e) => setError(e.message)).finally(() => setLoaded(true)); }, [live]);
  if (!loaded) return <div className="ws-page"><p role="status">Loading your teaching workspace…</p></div>;
  if (!account || !["trainer", "admin"].includes(account.role))
    return <div className="ws-page"><header className="ws-page-header"><div><h1>Trainer access pending</h1><p>An administrator must approve your trainer application before the course studio and learner tools become available.</p></div></header>{error && <p role="alert" className="hub-access-error">{error}</p>}</div>;
  const admin = account.role === "admin";
  // Administrators see published courses (and can unpublish one); drafts stay private to their trainer.
  const visible = admin ? courses.filter((c) => c.data.published) : courses;
  const activeFilter = filter || "All";
  if (editing) return <CourseBuilder row={editing === "new" ? null : editing} admin={admin} onExit={async (savedId) => { const rows = await load(); setEditing(savedId ? rows.find((c) => c.id === savedId) ?? null : null); }} onClose={() => { setEditing(null); void load(); }} />;
  const published = visible.filter((c) => c.data.published);
  const enrolled = learners.length, completed = learners.filter((l) => l.completed_at).length;
  const scored = learners.filter((l) => l.exam_best !== null);
  const toReview = learners.filter((l) => l.assignment && !l.reviewed_at);
  const shown = visible.filter((c) => activeFilter === "All" || stateLabel(c.data) === activeFilter);
  const tasks = [
    ...courses.filter((c) => !c.data.published).map((c) => { const missing = courseChecklist({ ...blank(), ...c.data }).filter((x) => !x.done); return { key: `draft-${c.id}`, tag: "Draft", tone: "", title: c.data.title || "Untitled course", detail: missing.length ? `Still needed: ${missing.map((x) => x.label.toLowerCase()).join(", ")}` : "Ready — publish it to the academy.", cta: missing.length ? "Continue building" : "Submit", action: () => setEditing(c) }; }),
    ...(toReview.length ? [{ key: "review", tag: "Learners", tone: "ws-status-issued", title: `${toReview.length} assignment${toReview.length === 1 ? "" : "s"} to review`, detail: "Give feedback so learners know how to improve.", cta: "Review now", action: () => setTab("Learners & assignments") }] : []),
  ];
  const duplicate = async (c: CourseRow) => {
    try {
      const copy = { ...structuredClone(c.data), title: `${c.data.title} (v2)`, published: false, review_state: "draft" };
      delete copy.review_note;
      await platformApi("/records/courses", "POST", copy);
      await load();
      toast.success("New version created as a draft. Edit it, then publish it.");
    } catch (e) { toast.error((e as Error).message); }
  };
  const remove = async (c: CourseRow) => {
    if (!await confirmAction({ title: `Delete “${c.data.title}”?`, description: "This permanently deletes the course draft and all of its modules and questions.", confirmLabel: "Delete course", destructive: true })) return;
    try { await platformApi(`/records/courses/${c.id}`, "DELETE"); await load(); toast.success("Course deleted"); } catch (e) { toast.error((e as Error).message); }
  };
  return (
    <div className="ws-page">
      {!embedded && <header className="ws-page-header">
        <div>
          <p className="ws-kicker">{admin ? "CONTENT STUDIO · Administrator" : "TRAINER WORKSPACE · Approved trainer"}</p>
          <h1>{admin ? "Published courses" : overview ? `Welcome back, ${account.name.split(" ")[0]}` : "Course studio"}</h1>
          <p>{admin ? "Trainers publish their own courses once every requirement is met. Open any course to view it, or unpublish it if something is wrong." : "Design structured courses with readings, timed knowledge checks, a graded assignment and a final exam — then follow your learners' progress."}</p>
        </div>
        {!admin && <button className="hub-button" onClick={() => setEditing("new")}><Plus size={16} /> Create course</button>}
      </header>}
      {error && <p role="alert" className="hub-access-error">{error}</p>}
      <div className="ws-stats ws-stats-5">
        <StatCard label={admin ? "Trainers publishing" : "My courses"} value={`${admin ? new Set(visible.map((c) => c.owner_id)).size : courses.length}`} icon={BookOpen} />
        <StatCard label="Published" value={`${published.length}`} icon={GraduationCap} />
        <StatCard label="Enrolled learners" value={`${enrolled}`} icon={Users} />
        <StatCard label="Completion rate" value={enrolled ? `${Math.round((completed / enrolled) * 100)}%` : "—"} icon={Percent} />
        {admin ? <StatCard label="Courses completed" value={`${completed}`} icon={ClipboardCheck} /> : <StatCard label="Assignments to review" value={`${toReview.length}`} icon={ClipboardCheck} />}
      </div>
      {overview && !admin && (courses.length ? (
        <Panel>
          <div className="ws-panel-title"><h2>Next steps</h2><span className="ws-pill">{tasks.length} to do</span></div>
          {tasks.length ? <ul className="tw-tasks">{tasks.map((t) => <li key={t.key}><span className={`ws-status ${t.tone}`}>{t.tag}</span><div><strong>{t.title}</strong><small>{t.detail}</small></div><button className="hub-text-button" onClick={t.action}>{t.cta}</button></li>)}</ul> : <Empty>You're up to date. Create a new course or check back when learners submit work.</Empty>}
        </Panel>
      ) : (
        <div className="ws-shortcuts ws-shortcuts-4">
          {[
            ["Plan the course", "Title, outcomes, skills and pathway"],
            ["Build modules", "Readings with a knowledge check each"],
            ["Set the final exam", "Timed questions, pass mark and attempts"],
            ["Publish", "Goes live in the academy once complete"],
          ].map(([title, detail], i) => <button key={title} type="button" className="tw-step-card" onClick={() => setEditing("new")}><span>{i + 1}</span><strong>{title}</strong><small>{detail}</small></button>)}
        </div>
      ))}
      <Panel>
        <div className="ws-tabs" role="tablist">
          {[["Courses", visible.length], [admin ? "Learners" : "Learners & assignments", learners.length]].map(([t, n]) => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "active" : ""} onClick={() => setTab(String(t))}>{t}<span>{n}</span></button>)}
        </div>
        {tab === "Courses" ? (
          <>
            <div className="hub-chips hub-space">{(admin ? [] : ["All", "Draft", "Published"]).map((f) => <button key={f} className={activeFilter === f ? "active" : ""} onClick={() => setFilter(f)}>{f} <span className="ws-count">{f === "All" ? visible.length : visible.filter((c) => stateLabel(c.data) === f).length}</span></button>)}</div>
            <div className="ac-grid hub-space">
              {shown.map((c, i) => {
                const checks = courseChecklist({ ...blank(), ...c.data }), ready = checks.filter((x) => x.done).length;
                return (
                  <article key={c.id} className="ac-card tw-course-card">
                    <div className={`ac-card-art tone-${i % 5}`}><Layers aria-hidden="true" /><span>{c.data.category || "PLP ACADEMY"}</span><small>{stateLabel(c.data)}</small></div>
                    <div className="ac-card-body">
                      <h2>{c.data.title || "Untitled course"}</h2>
                      <p>{c.data.description || "Add a summary to introduce this course."}</p>
                      <div className="tw-readiness" title={checks.filter((x) => !x.done).map((x) => x.label).join(", ")}><span style={{ width: `${(ready / checks.length) * 100}%` }} /></div>
                      <small className="hub-caption">{ready}/{checks.length} publication requirements met</small>
                      <div className="ac-meta">
                        <span><BookOpen size={14} />{c.data.lessons?.length || 0} modules</span>
                        <span><ListChecks size={14} />{c.data.exam?.length || 0} exam questions</span>
                        <span><Users size={14} />{c.learners} learners</span>
                        <span><GraduationCap size={14} />{c.completions} completed</span>
                        {c.avg_exam !== null && <span><Percent size={14} />{c.avg_exam}% avg exam</span>}
                        {admin && <span>By {c.trainer_name}</span>}
                      </div>
                      {c.data.review_note && <p className="hub-feedback">{c.data.review_note}</p>}
                      <div className="tw-card-actions">
                        <button className="hub-button" onClick={() => setEditing(c)}>{admin ? "View course" : "Open builder"}</button>
                        {c.data.published && <Link className="hub-record-icon hub-record-edit" to={`/academy/${c.id}`} title="View in academy" aria-label="View in academy"><Eye size={17} /></Link>}
                        {!admin && c.learners > 0 && <button className="hub-record-icon hub-record-edit" title="Create a new version" aria-label={`Create a new version of ${c.data.title}`} onClick={() => void duplicate(c)}><Copy size={17} /></button>}
                        {!admin && c.learners === 0 && <button className="hub-record-icon hub-record-delete" title="Delete course" aria-label={`Delete ${c.data.title}`} onClick={() => void remove(c)}><Trash2 size={17} /></button>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {!shown.length && (admin
              ? <Empty><BookOpen size={36} /><h2>No published courses yet</h2><p>Approved trainers publish courses from their studio once every requirement is met. They appear here as soon as they go live.</p></Empty>
              : <Empty><BookOpen size={36} /><h2>{courses.length ? "No courses in this view" : "Create your first course"}</h2><p>Plan outcomes, write module readings, add a knowledge check to each module, set a final exam, then submit for publication.</p>{!courses.length && <button className="hub-button hub-space" onClick={() => setEditing("new")}>Create a course</button>}</Empty>)}
          </>
        ) : learners.length ? (
          <div className="ws-table-wrap hub-space">
            <table className="ws-table">
              <thead><tr><th>Learner</th><th>Course</th><th>Module quizzes</th><th>Assignment</th><th>Final exam</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>{learners.map((l) => {
                const course = courses.find((c) => c.id === l.course_id), modules = course?.data.lessons?.length ?? 0;
                return (
                  <tr key={l.id}>
                    <td><strong>{l.learner_name}</strong><small>{l.learner_email}</small></td>
                    <td>{l.course_title}</td>
                    <td>{modules ? `${l.quizzes_passed}/${modules} passed` : "—"}</td>
                    <td>{l.assignment ? (l.reviewed_at ? "Reviewed" : "Awaiting review") : "Not submitted"}</td>
                    <td>{l.exam_best !== null ? `${l.exam_best}% best` : "Not attempted"}<small>{l.attempts} attempts in total</small></td>
                    <td><span className={`ws-status ${l.completed_at ? "ws-status-issued" : ""}`}>{l.completed_at ? "Completed" : "In progress"}</span></td>
                    <td>{admin ? (l.review_feedback ? "Trainer gave feedback" : "—") : l.assignment ? <button className="hub-text-button" onClick={() => setReviewing(l)}><FilePenLine size={15} /> {l.reviewed_at ? "Edit feedback" : "Review"}</button> : "—"}</td>
                  </tr>
                );
              })}</tbody>
            </table>
            {scored.length > 0 && <p className="hub-caption hub-space">Average best final exam score: {Math.round(scored.reduce((n, l) => n + (l.exam_best ?? 0), 0) / scored.length)}%</p>}
          </div>
        ) : <Empty>Learners appear here once they enrol in one of your published courses.</Empty>}
      </Panel>
      <Dialog open={!!reviewing} onOpenChange={(o) => { if (!o) setReviewing(null); }}>
        <DialogContent className="hub-app hub-dialog max-h-[90vh] overflow-y-auto">
          {reviewing && <>
            <DialogTitle>Review {reviewing.learner_name}'s assignment</DialogTitle>
            <DialogDescription>{reviewing.course_title}</DialogDescription>
            <p className="ws-evidence">{reviewing.assignment}</p>
            <form className="hub-form" onSubmit={async (e) => {
              e.preventDefault();
              try { await platformApi(`/teaching/enrollments/${reviewing.id}/review`, "POST", { feedback: String(new FormData(e.currentTarget).get("feedback")) }); toast.success("Feedback shared with the learner"); setReviewing(null); await load(); }
              catch (err) { toast.error((err as Error).message); }
            }}>
              <Field label="Feedback for the learner"><textarea name="feedback" required maxLength={5000} rows={6} defaultValue={reviewing.review_feedback} /></Field>
              <div className="hub-actions hub-dialog-actions"><button type="button" className="hub-button secondary" onClick={() => setReviewing(null)}>Cancel</button><button className="hub-button">Save feedback</button></div>
            </form>
          </>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CourseBuilder({ row, admin, onExit, onClose }: { row: CourseRow | null; admin: boolean; onExit: (savedId?: string) => Promise<void>; onClose: () => void }) {
  const [draft, setDraft] = useState<TeachingData>(() => ({ ...blank(), ...structuredClone(row?.data ?? {}) }));
  const [step, setStep] = useState<Step>("Overview");
  const [busy, setBusy] = useState(false), [dirty, setDirty] = useState(false);
  const locked = !!row?.learners;
  // Administrators review content as submitted; only the publication decision is theirs.
  const readOnly = admin || locked;
  const change = <K extends keyof TeachingData>(key: K, value: TeachingData[K]) => { setDraft((d) => ({ ...d, [key]: value })); setDirty(true); };
  const setLesson = (i: number, patch: Partial<TeachingData["lessons"][number]>) => change("lessons", draft.lessons.map((l, n) => (n === i ? { ...l, ...patch } : l)));
  const checks = courseChecklist(draft), ready = checks.every((c) => c.done);
  const stepDone: Record<Step, boolean> = { Overview: checks[0].done && checks[1].done, Modules: checks[2].done && checks[3].done, Assessment: checks[4].done && checks[5].done, Preview: ready, Publish: !!draft.published };
  async function save(action: "draft" | "publish" | "unpublish" = "draft") {
    if (!draft.title.trim()) { setStep("Overview"); return toast.error("Enter a course title."); }
    if (action === "publish" && !ready) { setStep("Publish"); return toast.error("Complete every publication requirement first."); }
    const decision = { published: action === "publish" ? true : action === "unpublish" ? false : draft.published, review_state: action === "publish" ? "approved" : draft.review_state || "draft" };
    // Administrators send the course exactly as stored, changing only whether it is published.
    const data: TeachingData = admin && row ? { ...row.data, ...decision } : { ...draft, outcomes: draft.outcomes?.filter((o) => o.trim()), ...decision };
    setBusy(true);
    try {
      let id = row?.id;
      if (row) await platformApi(`/records/courses/${row.id}`, "PUT", { version: row.version, data });
      else id = (await platformApi<{ id: string }>("/records/courses", "POST", data)).id;
      setDirty(false);
      toast.success(action === "publish" ? "Course published. Members can enrol now and have been notified." : action === "unpublish" ? "Course unpublished." : "Draft saved.");
      await onExit(action === "draft" ? id : undefined);
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  const back = async () => { if (!dirty || await confirmAction({ title: "Leave the course builder?", description: "Unsaved changes will be lost.", confirmLabel: "Leave without saving", destructive: true })) onClose(); };
  const next = STEPS[STEPS.indexOf(step) + 1];
  return (
    <div className="ws-page">
      <header className="ws-page-header">
        <div>
          <button className="ac-back" onClick={() => void back()}><ArrowLeft size={16} /> Back to courses</button>
          <h1>{draft.title || "New course"}</h1>
          <p><Tag>{stateLabel(draft)}</Tag> {checks.filter((c) => c.done).length}/{checks.length} publication requirements met{dirty ? " · unsaved changes" : ""}</p>
        </div>
        {admin ? <button className="hub-button" onClick={() => setStep("Publish")}>Publication</button> : <button className="hub-button" disabled={busy || locked} onClick={() => void save("draft")}>{busy ? "Saving…" : "Save draft"}</button>}
      </header>
      {admin && <p className="hub-feedback">You are viewing {row?.trainer_name}'s course. Content is read-only; you can unpublish it under Publication if something is wrong.</p>}
      {!admin && locked && <p className="hub-feedback">Learners are enrolled in this course, so its content is locked to protect their progress. Create a new version from the course card to make changes.</p>}
      {draft.review_note && !admin && <p className="hub-feedback"><strong>Administrator feedback:</strong> {draft.review_note}</p>}
      <div className="tw-builder">
        <nav className="ac-outline" aria-label="Course builder steps">
          {STEPS.map((s, i) => (
            <button key={s} className={`ac-outline-item ${step === s ? "active" : ""}`} onClick={() => setStep(s)} aria-current={step === s ? "step" : undefined}>
              {stepDone[s] ? <CheckCircle2 size={17} className="ac-done" /> : <Circle size={17} />}
              <span><strong>{i + 1}. {s}</strong><small>{{ Overview: "Title, outcomes, skills", Modules: `${draft.lessons.length} modules`, Assessment: `${draft.exam?.length ?? 0} exam questions`, Preview: "See it as a learner", Publish: "Checklist and review" }[s]}</small></span>
            </button>
          ))}
        </nav>
        <fieldset className="tw-stage" disabled={readOnly && step !== "Publish" && step !== "Preview"}>
          {step === "Overview" && (
            <Panel>
              <h2>Course overview</h2>
              <p className="hub-caption">This is what learners see on the course card and landing page.</p>
              <div className="hub-form hub-space">
                <Field label="Course title"><input value={draft.title} onChange={(e) => change("title", e.target.value)} maxLength={200} /></Field>
                <Field label="Course summary"><textarea value={draft.description} onChange={(e) => change("description", e.target.value)} maxLength={10000} rows={4} /></Field>
                <div className="ws-form-grid">
                  <Field label="Learning pathway"><select value={draft.category} onChange={(e) => change("category", e.target.value)}>{categories.map((c) => <option key={c}>{c}</option>)}</select></Field>
                  <Field label="Level"><select value={draft.level} onChange={(e) => change("level", e.target.value as TeachingData["level"])}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></Field>
                  <Field label="Estimated duration"><input value={draft.duration || ""} onChange={(e) => change("duration", e.target.value)} placeholder="e.g. 3 hours" maxLength={100} /></Field>
                  <Field label="Skills learners gain (comma separated)"><input value={(draft.skills ?? []).join(", ")} onChange={(e) => change("skills", e.target.value.split(",").map((s) => s.trimStart()).slice(0, 12))} onBlur={() => change("skills", (draft.skills ?? []).map((s) => s.trim()).filter(Boolean))} maxLength={600} /></Field>
                </div>
                <ListEditor label="What learners will learn" hint="Add at least two outcomes, written as actions (e.g. “Write an evidence-based CV achievement”)." items={draft.outcomes ?? []} onChange={(v) => change("outcomes", v)} />
              </div>
            </Panel>
          )}
          {step === "Modules" && (
            <div className="hub-stack">
              {draft.lessons.map((l, i) => (
                <Panel key={i} className="tw-module">
                  <div className="ws-panel-title">
                    <h2>Module {i + 1}{l.title ? ` · ${l.title}` : ""}</h2>
                    <div className="hub-actions">
                      <button type="button" className="hub-record-icon hub-record-edit" aria-label="Move module up" title="Move up" disabled={i === 0} onClick={() => { const rows = [...draft.lessons]; [rows[i - 1], rows[i]] = [rows[i], rows[i - 1]]; change("lessons", rows); }}><ArrowUp size={17} /></button>
                      <button type="button" className="hub-record-icon hub-record-edit" aria-label="Move module down" title="Move down" disabled={i === draft.lessons.length - 1} onClick={() => { const rows = [...draft.lessons]; [rows[i + 1], rows[i]] = [rows[i], rows[i + 1]]; change("lessons", rows); }}><ArrowDown size={17} /></button>
                      <button type="button" className="hub-record-icon hub-record-delete" aria-label="Delete module" title="Delete module" onClick={async () => { if (await confirmAction({ title: `Delete module ${i + 1}?`, description: "Its reading and quiz questions will be removed from this draft.", confirmLabel: "Delete module", destructive: true })) change("lessons", draft.lessons.filter((_, n) => n !== i)); }}><Trash2 size={17} /></button>
                    </div>
                  </div>
                  <div className="hub-form">
                    <Field label={`Module ${i + 1} title`}><input maxLength={200} value={l.title} onChange={(e) => setLesson(i, { title: e.target.value })} /></Field>
                    <Field label="Reading"><textarea rows={8} maxLength={20000} value={l.content} onChange={(e) => setLesson(i, { content: e.target.value })} placeholder="Explain the concept, give a concrete example, and say what learners should do with it." /></Field>
                    <div className="hub-field"><span>Lesson video (optional)</span><p className="hub-caption">Add a YouTube link or upload your own recording. Learners watch it above the reading.</p><LessonVideoEditor video={l.video} onChange={(video) => setLesson(i, { video })} /></div>
                    <div className="tw-quiz-head">
                      <h3>Knowledge check <span className="ws-count">{l.quiz?.length ?? 0} questions</span></h3>
                      <label className="tw-inline-field">Time limit <input type="number" min={1} max={120} value={l.quiz_minutes ?? Math.max(3, (l.quiz?.length ?? 0) * 2)} onChange={(e) => setLesson(i, { quiz_minutes: Number(e.target.value) })} /> min</label>
                    </div>
                    <p className="hub-caption">Learners complete this module only by scoring at least {QUIZ_PASS_MARK}%.</p>
                    <QuestionBank questions={l.quiz ?? []} onChange={(quiz) => setLesson(i, { quiz })} />
                  </div>
                </Panel>
              ))}
              {!draft.lessons.length && <Empty>No modules yet. A good course has 3–6 focused modules, each with a short reading and a knowledge check.</Empty>}
              <button type="button" className="hub-button secondary" disabled={draft.lessons.length >= 100} onClick={() => change("lessons", [...draft.lessons, { title: "", content: "", quiz: [], quiz_minutes: 5 }])}><Plus size={16} /> Add module</button>
            </div>
          )}
          {step === "Assessment" && (
            <div className="hub-stack">
              <Panel>
                <h2>Graded assignment</h2>
                <p className="hub-caption">Learners must write at least 60 words. You review submissions under Learners & assignments.</p>
                <Field label="Assignment brief"><textarea rows={4} value={draft.assignment || ""} onChange={(e) => change("assignment", e.target.value)} placeholder="What should learners produce or reflect on?" maxLength={4000} /></Field>
              </Panel>
              <Panel>
                <h2>Final exam</h2>
                <p className="hub-caption">Unlocks after every module quiz is passed and the assignment is submitted. Answers are never shown to learners.</p>
                <div className="ws-form-grid hub-space">
                  <Field label="Time limit (minutes)"><input type="number" min={2} max={240} value={draft.exam_minutes ?? 15} onChange={(e) => change("exam_minutes", Number(e.target.value))} /></Field>
                  <Field label="Pass mark (%)"><input type="number" min={50} max={100} value={draft.pass_mark ?? EXAM_PASS_MARK} onChange={(e) => change("pass_mark", Number(e.target.value))} /></Field>
                  <Field label="Attempts per 24 hours"><input type="number" min={1} max={5} value={draft.max_attempts ?? MAX_ATTEMPTS} onChange={(e) => change("max_attempts", Number(e.target.value))} /></Field>
                </div>
                <QuestionBank questions={draft.exam ?? []} onChange={(exam) => change("exam", exam)} />
              </Panel>
            </div>
          )}
          {step === "Preview" && <Preview data={draft} />}
          {step === "Publish" && (
            <Panel>
              <h2>{draft.published ? "Published in the academy" : ready ? "Ready to publish" : "Finish your course"}</h2>
              <ul className="tw-checklist">{checks.map((c) => <li key={c.label} className={c.done ? "done" : ""}>{c.done ? <CheckCircle2 size={17} /> : <Circle size={17} />}{c.label}</li>)}</ul>
              {!draft.published && <p className="hub-caption">Publishing makes the course visible in the learning academy straight away and notifies members.</p>}
              <div className="hub-actions hub-space">
                {draft.published
                  ? <button className="hub-button secondary" disabled={busy} onClick={() => void save("unpublish")}>Unpublish</button>
                  : !admin && <button className="hub-button" disabled={busy || !ready} onClick={() => void save("publish")}><Send size={16} /> Publish course</button>}
              </div>
            </Panel>
          )}
          <div className="tw-footer">
            {next && <button type="button" className="hub-button secondary" onClick={() => setStep(next)}>Next: {next} →</button>}
          </div>
        </fieldset>
      </div>
    </div>
  );
}

function ListEditor({ label, hint, items, onChange }: { label: string; hint: string; items: string[]; onChange: (v: string[]) => void }) {
  const [value, setValue] = useState("");
  const add = () => { if (value.trim()) { onChange([...items, value.trim()].slice(0, 12)); setValue(""); } };
  return (
    <div className="hub-field">
      <span>{label}</span>
      <p className="hub-caption">{hint}</p>
      <ul className="ae-list">{items.map((o, i) => <li key={i}><div><strong>{o}</strong></div><button type="button" className="hub-record-icon hub-record-delete" aria-label={`Remove ${o}`} title="Remove" onClick={() => onChange(items.filter((_, n) => n !== i))}><Trash2 size={16} /></button></li>)}</ul>
      <div className="tw-add-row"><input value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} maxLength={200} placeholder="Add an outcome" aria-label="New outcome" /><button type="button" className="hub-button secondary" onClick={add}>Add</button></div>
    </div>
  );
}

function QuestionBank({ questions, onChange }: { questions: TeachingQuestion[]; onChange: (q: TeachingQuestion[]) => void }) {
  const [editing, setEditing] = useState<TeachingQuestion | "new" | null>(null);
  const current = editing && editing !== "new" ? editing : null;
  return (
    <div>
      <ol className="ae-list">
        {questions.map((q, n) => (
          <li key={q.id}>
            <div><strong>{n + 1}. {q.prompt}</strong><small>Correct: {q.options[q.answer ?? 0]}</small></div>
            <div className="hub-actions">
              <button type="button" className="hub-record-icon hub-record-edit" aria-label="Edit question" title="Edit question" onClick={() => setEditing(q)}><FilePenLine size={17} /></button>
              <button type="button" className="hub-record-icon hub-record-delete" aria-label="Delete question" title="Delete question" onClick={async () => { if (await confirmAction({ title: "Delete this question?", description: q.prompt, confirmLabel: "Delete", destructive: true })) onChange(questions.filter((x) => x.id !== q.id)); }}><Trash2 size={17} /></button>
            </div>
          </li>
        ))}
        {!questions.length && <li className="hub-caption">No questions yet.</li>}
      </ol>
      <button type="button" className="hub-text-button hub-space" onClick={() => setEditing("new")}><Plus size={15} /> Add question</button>
      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="hub-app hub-dialog max-h-[90vh] overflow-y-auto">
          <DialogTitle>{current ? "Edit question" : "Add question"}</DialogTitle>
          {editing && (
            <form className="hub-form hub-space" onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const f = new FormData(e.currentTarget);
              const raw = [0, 1, 2, 3].map((i) => String(f.get(`option${i}`)).trim());
              const options = raw.filter(Boolean), correct = raw[Number(f.get("answer"))];
              if (options.length < 2) return toast.error("Add at least two answer options.");
              if (!correct) return toast.error("The correct answer must be one of the filled options.");
              const q: TeachingQuestion = { id: current?.id ?? newId(), prompt: String(f.get("prompt")).trim(), options, answer: options.indexOf(correct) };
              onChange(current ? questions.map((x) => (x.id === q.id ? q : x)) : [...questions, q]);
              setEditing(null);
            }}>
              <Field label="Question"><textarea name="prompt" required minLength={5} maxLength={400} defaultValue={current?.prompt} /></Field>
              {[0, 1, 2, 3].map((i) => <Field key={i} label={`Option ${i + 1}${i > 1 ? " (optional)" : ""}`}><input name={`option${i}`} required={i < 2} maxLength={200} defaultValue={current?.options[i]} /></Field>)}
              <Field label="Correct answer"><select name="answer" defaultValue={current?.answer ?? 0}>{[0, 1, 2, 3].map((i) => <option key={i} value={i}>Option {i + 1}</option>)}</select></Field>
              <div className="hub-actions hub-dialog-actions"><button type="button" className="hub-button secondary" onClick={() => setEditing(null)}>Cancel</button><button className="hub-button">Save question</button></div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Preview({ data }: { data: TeachingData }) {
  const assessments = serverAssessments(data), exam = assessments.find((a) => a.kind === "exam");
  const Section = ({ title, children }: { title: string; children: ReactNode }) => <><h2 className="hub-space">{title}</h2>{children}</>;
  return (
    <Panel>
      <p className="hub-eyebrow">LEARNER PREVIEW · {data.category}</p>
      <h2>{data.title || "Untitled course"}</h2>
      <p>{data.description}</p>
      <div className="ac-meta hub-space"><span>{data.level}</span><span>{data.duration || "Self-paced"}</span><span>{data.lessons.length} modules · {assessments.length} graded assessments</span></div>
      <Section title="What you'll learn"><ul className="ac-outcomes">{(data.outcomes ?? []).map((o) => <li key={o}><CheckCircle2 size={17} />{o}</li>)}</ul></Section>
      <Section title="Syllabus">
        {data.lessons.map((l, i) => (
          <details key={i} className="hub-lesson-preview">
            <summary>Module {i + 1}: {l.title || "Untitled module"} · {l.quiz?.length ?? 0}-question quiz{l.video ? " · video" : ""}</summary>
            {l.video && <LessonVideoPlayer video={l.video} caption={l.title} />}
            <p className="hub-prewrap">{l.content}</p>
            {l.quiz?.map((q, n) => <p key={q.id} className="hub-caption">Q{n + 1}. {q.prompt} — <strong>{q.options[q.answer ?? 0]}</strong></p>)}
          </details>
        ))}
      </Section>
      <Section title="Assignment"><p>{data.assignment || "No assignment brief yet."}</p></Section>
      <Section title="Final exam"><p>{exam ? `${exam.questions.length} questions · ${exam.minutes} minutes · pass mark ${exam.passMark}% · ${exam.maxAttempts} attempts per 24 hours` : "No final exam questions yet."}</p></Section>
    </Panel>
  );
}

