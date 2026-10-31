import { translateUi, useSiteLanguage } from '../../i18n/language';
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
import { Empty, Field, Panel, Tag, greeting, dashboardSubtitle } from "./ui";
import { FormModal } from "./modal";
import { RecordTable, usePaged, Pager } from "./management-ui";
import { categories } from "./data";
import { courseChecklist, serverAssessments, EXAM_PASS_MARK, MAX_ATTEMPTS, QUIZ_PASS_MARK, type TeachingData, type TeachingQuestion } from "./teaching-types";
import "./academy.css";
import "./workspaces.css";
export type { TeachingData } from "./teaching-types";
type CourseRow = {
    id: string;
    owner_id: string;
    version: number;
    data: TeachingData;
    trainer_name: string;
    learners: number;
    pending_reviews: number;
    completions: number;
    avg_exam: number | null;
};
type LearnerRow = {
    id: string;
    course_id: string;
    learner_name: string;
    learner_email: string;
    course_title: string;
    lessons: number[];
    assignment: string;
    passed: boolean;
    completed_at: string | null;
    review_feedback: string;
    reviewed_at: string | null;
    exam_best: number | null;
    attempts: number;
    quizzes_passed: number;
};
const blank = (): TeachingData => ({ title: "", description: "", category: categories[0], duration: "", level: "Beginner", published: false, lessons: [], assignment: "", outcomes: [], skills: [], exam: [], exam_minutes: 15, pass_mark: EXAM_PASS_MARK, max_attempts: MAX_ATTEMPTS, review_state: "draft" });
// Trainers publish their own courses once every requirement is met; there is no review queue.
const stateLabel = (d: TeachingData) => d.published ? "Published" : "Draft";
const STEPS = ["Overview", "Modules", "Assessment", "Preview", "Publish"] as const;
type Step = (typeof STEPS)[number];
const newId = () => crypto.randomUUID().slice(0, 12);
export function TrainerWorkspace({ overview = false, initialTab = "Courses", embedded = false }: {
    overview?: boolean;
    initialTab?: string;
    embedded?: boolean;
}) {
    useSiteLanguage();
    const [account, setAccount] = useState<{
        id: string;
        role: string;
        name: string;
    } | null>(null);
    const [courses, setCourses] = useState<CourseRow[]>([]);
    const [learners, setLearners] = useState<LearnerRow[]>([]);
    const [loaded, setLoaded] = useState(false), [error, setError] = useState("");
    const [tab, setTab] = useState(initialTab), [filter, setFilter] = useState("");
    const [editing, setEditing] = useState<CourseRow | "new" | null>(null);
    const [reviewing, setReviewing] = useState<LearnerRow | null>(null);
    const load = () => Promise.all([platformApi<{
            id: string;
            role: string;
            name: string;
        }>("/me"), platformApi<CourseRow[]>("/teaching/courses"), platformApi<LearnerRow[]>("/teaching/enrollments")]).then(([me, rows, people]) => { setAccount(me); setCourses(rows); setLearners(people); return rows; });
    const live = useLiveTick();
    useEffect(() => { load().catch((e) => setError(e.message)).finally(() => setLoaded(true)); }, [live]);
    const admin = account?.role === "admin";
    // Administrators see published courses (and can unpublish one); drafts stay private to their trainer.
    const visible = admin ? courses.filter((c) => c.data.published) : courses;
    const [courseSearch,setCourseSearch] = useState('');
    const activeFilter = filter || "All";
    const published = visible.filter((c) => c.data.published);
    const enrolled = learners.length, completed = learners.filter((l) => l.completed_at).length;
    const scored = learners.filter((l) => l.exam_best !== null);
    const toReview = learners.filter((l) => l.assignment && !l.reviewed_at);
    const shown = visible.filter((c) => (activeFilter === "All" || stateLabel(c.data) === activeFilter) && `${c.data.title} ${c.data.category} ${c.trainer_name}`.toLowerCase().includes(courseSearch.toLowerCase()));
    const coursePage = usePaged(shown, 9, `${courseSearch}|${activeFilter}`);
    if (!loaded)
        return <div className="ws-page"><p role="status">{translateUi("Loading your teaching workspace\u2026")}</p></div>;
    if (!account || !["trainer", "admin"].includes(account.role))
        return <div className="ws-page"><header className="ws-page-header"><div><h1>{translateUi("Trainer access pending")}</h1><p>{translateUi("An administrator must approve your trainer application before the course studio and learner tools become available.")}</p></div></header>{translateUi(error && <p role="alert" className="hub-access-error">{translateUi(error)}</p>)}</div>;
    if (editing)
        return <CourseBuilder row={editing === "new" ? null : editing} admin={admin} onExit={async (savedId) => { const rows = await load(); setEditing(savedId ? rows.find((c) => c.id === savedId) ?? null : null); }} onClose={() => { setEditing(null); void load(); }}/>;
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
            toast.success(translateUi("New version created as a draft. Edit it, then publish it."));
        }
        catch (e) {
            toast.error(translateUi((e as Error).message));
        }
    };
    const remove = async (c: CourseRow) => {
        if (!await confirmAction({ title: `Delete “${c.data.title}”?`, description: "This permanently deletes the course draft and all of its modules and questions.", confirmLabel: "Delete course", destructive: true }))
            return;
        try {
            await platformApi(`/records/courses/${c.id}`, "DELETE");
            await load();
            toast.success(translateUi("Course deleted"));
        }
        catch (e) {
            toast.error(translateUi((e as Error).message));
        }
    };
    return (<div className="ws-page">
      {translateUi(!embedded && <header className={`ws-page-header${overview && !admin ? " ws-hero" : ""}`}>
        <div>
          <p className="ws-kicker">{translateUi(admin ? "CONTENT STUDIO · Administrator" : "TRAINER WORKSPACE · Approved trainer")}</p>
          <h1>{admin ? translateUi("Published courses") : overview ? greeting(account.name) : translateUi("Course studio")}</h1>
          {translateUi(overview && !admin && <p>{dashboardSubtitle("Teaching overview")}</p>)}
          {translateUi(admin && <p>{translateUi("Trainers publish their own courses once every requirement is met. Open any course to view it, or unpublish it if something is wrong.")}</p>)}
        </div>
        {translateUi(!admin && <button className="hub-button" onClick={() => setEditing("new")}><Plus size={16}/>{translateUi(" Create course")}</button>)}
      </header>)}
      {translateUi(error && <p role="alert" className="hub-access-error">{translateUi(error)}</p>)}
      <div className="ws-stats ws-stats-5">
        <StatCard label={translateUi(admin ? "Trainers publishing" : "My courses")} value={`${admin ? new Set(visible.map((c) => c.owner_id)).size : courses.length}`} icon={BookOpen}/>
        <StatCard label={translateUi("Published")} value={`${published.length}`} icon={GraduationCap}/>
        <StatCard label={translateUi("Enrolled learners")} value={`${enrolled}`} icon={Users}/>
        <StatCard label={translateUi("Completion rate")} value={enrolled ? `${Math.round((completed / enrolled) * 100)}%` : "—"} icon={Percent}/>
        {translateUi(admin ? <StatCard label={translateUi("Courses completed")} value={`${completed}`} icon={ClipboardCheck}/> : <StatCard label={translateUi("Assignments to review")} value={`${toReview.length}`} icon={ClipboardCheck}/>)}
      </div>
      {translateUi(overview && !admin && (courses.length ? (<Panel>
          <div className="ws-panel-title"><h2>{translateUi("Next steps")}</h2><span className="ws-pill">{translateUi(tasks.length)}{translateUi(" to do")}</span></div>
          {translateUi(tasks.length ? <RecordTable title="tasks" rows={tasks.map(t=>({...t,id:t.key}))} searchText={t=>`${t.title} ${t.tag} ${t.detail}`} filters={[{label:'Status',options:[...new Set(tasks.map(t=>t.tag))].map(tag=>({label:tag,test:(t:{tag:string})=>t.tag===tag}))}]} columns={[{label:'Status',render:t=><span className={`ws-status ${t.tone}`}>{translateUi(t.tag)}</span>},{label:'Task',render:t=><><strong>{t.title}</strong><small>{t.detail}</small></>},{label:'Action',render:t=><button className="hub-text-button" onClick={t.action}>{translateUi(t.cta)}</button>}]}/> : <Empty>{translateUi("You're up to date. Create a new course or check back when learners submit work.")}</Empty>)}
        </Panel>) : (<div className="ws-shortcuts ws-shortcuts-4">
          {translateUi([
                ["Plan the course", "Title, outcomes, skills and pathway"],
                ["Build modules", "Readings with a knowledge check each"],
                ["Set the final exam", "Timed questions, pass mark and attempts"],
                ["Publish", "Goes live in the academy once complete"],
            ].map(([title, detail], i) => <button key={title} type="button" className="tw-step-card" onClick={() => setEditing("new")}><span>{translateUi(i + 1)}</span><strong>{translateUi(title)}</strong><small>{translateUi(detail)}</small></button>))}
        </div>)))}
      <Panel>
        <div className="ws-tabs" role="tablist">
          {translateUi([["Courses", visible.length], [admin ? "Learners" : "Learners & assignments", learners.length]].map(([t, n]) => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "active" : ""} onClick={() => setTab(String(t))}>{translateUi(t)}<span>{translateUi(n)}</span></button>))}
        </div>
        {translateUi(tab === "Courses" ? (<>
            <div className="hub-chips hub-space">{translateUi((admin ? [] : ["All", "Draft", "Published"]).map((f) => <button key={f} className={activeFilter === f ? "active" : ""} onClick={() => setFilter(f)}>{translateUi(f)} <span className="ws-count">{translateUi(f === "All" ? visible.length : visible.filter((c) => stateLabel(c.data) === f).length)}</span></button>))}</div>
<Field label={translateUi("Search courses")}><input value={courseSearch} onChange={e=>setCourseSearch(e.target.value)} placeholder={translateUi("Course, pathway or trainer")}/></Field>
            <div className="ac-grid hub-space">
              {translateUi(coursePage.items.map((c, i) => {
                const checks = courseChecklist({ ...blank(), ...c.data }), ready = checks.filter((x) => x.done).length;
                return (<article key={c.id} className="ac-card tw-course-card">
                    <div className={`ac-card-art tone-${i % 5}`}><Layers aria-hidden="true"/><span>{translateUi(c.data.category || "PLP ACADEMY")}</span><small>{translateUi(stateLabel(c.data))}</small></div>
                    <div className="ac-card-body">
                      <h2>{translateUi(c.data.title || "Untitled course")}</h2>
                      <p>{translateUi(c.data.description || "Add a summary to introduce this course.")}</p>
                      <div className="tw-readiness" title={translateUi(checks.filter((x) => !x.done).map((x) => x.label).join(", "))}><span style={{ width: `${(ready / checks.length) * 100}%` }}/></div>
                      <small className="hub-caption">{translateUi(ready)}{translateUi("/")}{translateUi(checks.length)}{translateUi(" publication requirements met")}</small>
                      <div className="ac-meta">
                        <span><BookOpen size={14}/>{translateUi(c.data.lessons?.length || 0)}{translateUi(" modules")}</span>
                        <span><ListChecks size={14}/>{translateUi(c.data.exam?.length || 0)}{translateUi(" exam questions")}</span>
                        <span><Users size={14}/>{translateUi(c.learners)}{translateUi(" learners")}</span>
                        <span><GraduationCap size={14}/>{translateUi(c.completions)}{translateUi(" completed")}</span>
                        {translateUi(c.avg_exam !== null && <span><Percent size={14}/>{translateUi(c.avg_exam)}{translateUi("% avg exam")}</span>)}
                        {translateUi(admin && <span>{translateUi("By ")}{translateUi(c.trainer_name)}</span>)}
                      </div>
                      {translateUi(c.data.review_note && <p className="hub-feedback">{translateUi(c.data.review_note)}</p>)}
                      <div className="tw-card-actions">
                        <button className="hub-button" onClick={() => setEditing(c)}>{translateUi(admin ? "View course" : "Open builder")}</button>
                        {translateUi(c.data.published && <Link className="hub-record-icon hub-record-edit" to={`/academy/${c.id}`} title={translateUi("View in academy")} aria-label={translateUi("View in academy")}><Eye size={17}/></Link>)}
                        {translateUi(!admin && c.learners > 0 && <button className="hub-record-icon hub-record-edit" title={translateUi("Create a new version")} aria-label={translateUi("Create a new version of {p0}", { p0: translateUi(c.data.title) })} onClick={() => void duplicate(c)}><Copy size={17}/></button>)}
                        {translateUi(!admin && c.learners === 0 && <button className="hub-record-icon hub-record-delete" title={translateUi("Delete course")} aria-label={translateUi("Delete {p0}", { p0: translateUi(c.data.title) })} onClick={() => void remove(c)}><Trash2 size={17}/></button>)}
                      </div>
                    </div>
                  </article>);
            }))}
            </div>
            <Pager {...coursePage}/>
            {translateUi(!shown.length && (admin
                ? <Empty><BookOpen size={36}/><h2>{translateUi("No published courses yet")}</h2><p>{translateUi("Approved trainers publish courses from their studio once every requirement is met. They appear here as soon as they go live.")}</p></Empty>
                : <Empty><BookOpen size={36}/><h2>{translateUi(courses.length ? "No courses in this view" : "Create your first course")}</h2><p>{translateUi("Plan outcomes, write module readings, add a knowledge check to each module, set a final exam, then submit for publication.")}</p>{translateUi(!courses.length && <button className="hub-button hub-space" onClick={() => setEditing("new")}>{translateUi("Create a course")}</button>)}</Empty>))}
          </>) : learners.length ? (<div className="hub-space">
            <RecordTable title={translateUi("learners")} rows={learners} searchText={(l) => `${l.learner_name} ${l.learner_email} ${l.course_title}`}
              filters={[
                { label: "Course", options: [...new Set(learners.map((l) => l.course_title))].map((t) => ({ label: t, test: (l: LearnerRow) => l.course_title === t })) },
                { label: "Assignment", options: [{ label: "Awaiting review", test: (l: LearnerRow) => !!l.assignment && !l.reviewed_at }, { label: "Reviewed", test: (l: LearnerRow) => !!l.reviewed_at }, { label: "Not submitted", test: (l: LearnerRow) => !l.assignment }] },
                { label: "Status", options: [{ label: "In progress", test: (l: LearnerRow) => !l.completed_at }, { label: "Completed", test: (l: LearnerRow) => !!l.completed_at }] },
              ]}
              columns={[
                { label: "Learner", render: (l) => <><strong>{translateUi(l.learner_name)}</strong><small>{translateUi(l.learner_email)}</small></> },
                { label: "Course", render: (l) => translateUi(l.course_title) },
                { label: "Module quizzes", render: (l) => { const modules = courses.find((c) => c.id === l.course_id)?.data.lessons?.length ?? 0; return translateUi(modules ? `${l.quizzes_passed}/${modules} passed` : "—"); } },
                { label: "Assignment", render: (l) => translateUi(l.assignment ? (l.reviewed_at ? "Reviewed" : "Awaiting review") : "Not submitted") },
                { label: "Final exam", render: (l) => <>{translateUi(l.exam_best !== null ? `${l.exam_best}% best` : "Not attempted")}<small>{translateUi(l.attempts)}{translateUi(" attempts in total")}</small></> },
                { label: "Status", render: (l) => <span className={`ws-status ${l.completed_at ? "ws-status-issued" : ""}`}>{translateUi(l.completed_at ? "Completed" : "In progress")}</span> },
                { label: "Action", render: (l) => translateUi(admin ? (l.review_feedback ? "Trainer gave feedback" : "—") : l.assignment ? <button className="hub-text-button" onClick={() => setReviewing(l)}><FilePenLine size={15}/> {translateUi(l.reviewed_at ? "Edit feedback" : "Review")}</button> : "—") },
              ]}/>
            {translateUi(scored.length > 0 && <p className="hub-caption hub-space">{translateUi("Average best final exam score: ")}{translateUi(Math.round(scored.reduce((n, l) => n + (l.exam_best ?? 0), 0) / scored.length))}{translateUi("%")}</p>)}
          </div>) : <Empty>{translateUi("Learners appear here once they enrol in one of your published courses.")}</Empty>)}
      </Panel>
      <Dialog open={!!reviewing} onOpenChange={(o) => { if (!o)
        setReviewing(null); }}>
        <DialogContent className="hub-app hub-dialog max-h-[90vh] overflow-y-auto">
          {translateUi(reviewing && <>
            <DialogTitle>{translateUi("Review ")}{translateUi(reviewing.learner_name)}{translateUi("'s assignment")}</DialogTitle>
            <DialogDescription>{translateUi(reviewing.course_title)}</DialogDescription>
            <p className="ws-evidence">{translateUi(reviewing.assignment)}</p>
            <form className="hub-form" onSubmit={async (e) => {
                e.preventDefault();
                try {
                    await platformApi(`/teaching/enrollments/${reviewing.id}/review`, "POST", { feedback: String(new FormData(e.currentTarget).get("feedback")) });
                    toast.success(translateUi("Feedback shared with the learner"));
                    setReviewing(null);
                    await load();
                }
                catch (err) {
                    toast.error(translateUi((err as Error).message));
                }
            }}>
              <Field label={translateUi("Feedback for the learner")}><textarea name="feedback" required maxLength={5000} rows={6} defaultValue={reviewing.review_feedback}/></Field>
              <div className="hub-actions hub-dialog-actions"><button type="button" className="hub-button secondary" onClick={() => setReviewing(null)}>{translateUi("Cancel")}</button><button className="hub-button">{translateUi("Save feedback")}</button></div>
            </form>
          </>)}
        </DialogContent>
      </Dialog>
    </div>);
}
function CourseBuilder({ row, admin, onExit, onClose }: {
    row: CourseRow | null;
    admin: boolean;
    onExit: (savedId?: string) => Promise<void>;
    onClose: () => void;
}) {
    useSiteLanguage();
    const [draft, setDraft] = useState<TeachingData>(() => ({ ...blank(), ...structuredClone(row?.data ?? {}) }));
    const [step, setStep] = useState<Step>("Overview");
    const [busy, setBusy] = useState(false), [dirty, setDirty] = useState(false);
    const [module, setModule] = useState<number | null>(null);
    const locked = !!row?.learners;
    // Administrators review content as submitted; only the publication decision is theirs.
    const readOnly = admin || locked;
    const change = <K extends keyof TeachingData>(key: K, value: TeachingData[K]) => { setDraft((d) => ({ ...d, [key]: value })); setDirty(true); };
    const setLesson = (i: number, patch: Partial<TeachingData["lessons"][number]>) => change("lessons", draft.lessons.map((l, n) => (n === i ? { ...l, ...patch } : l)));
    const checks = courseChecklist(draft), ready = checks.every((c) => c.done);
    const stepDone: Record<Step, boolean> = { Overview: checks[0].done && checks[1].done, Modules: checks[2].done && checks[3].done, Assessment: checks[4].done && checks[5].done, Preview: ready, Publish: !!draft.published };
    async function save(action: "draft" | "publish" | "unpublish" = "draft") {
        if (!draft.title.trim()) {
            setStep("Overview");
            return toast.error(translateUi("Enter a course title."));
        }
        if (action === "publish" && !ready) {
            setStep("Publish");
            return toast.error(translateUi("Complete every publication requirement first."));
        }
        const decision = { published: action === "publish" ? true : action === "unpublish" ? false : draft.published, review_state: action === "publish" ? "approved" : draft.review_state || "draft" };
        // Administrators send the course exactly as stored, changing only whether it is published.
        const data: TeachingData = admin && row ? { ...row.data, ...decision } : { ...draft, outcomes: draft.outcomes?.filter((o) => o.trim()), ...decision };
        setBusy(true);
        try {
            let id = row?.id;
            if (row)
                await platformApi(`/records/courses/${row.id}`, "PUT", { version: row.version, data });
            else
                id = (await platformApi<{
                    id: string;
                }>("/records/courses", "POST", data)).id;
            setDirty(false);
            toast.success(translateUi(action === "publish" ? "Course published. Members can enrol now and have been notified." : action === "unpublish" ? "Course unpublished." : "Draft saved."));
            await onExit(action === "draft" ? id : undefined);
        }
        catch (e) {
            toast.error(translateUi((e as Error).message));
        }
        finally {
            setBusy(false);
        }
    }
    const back = async () => { if (!dirty || await confirmAction({ title: "Leave the course builder?", description: "Unsaved changes will be lost.", confirmLabel: "Leave without saving", destructive: true }))
        onClose(); };
    const next = STEPS[STEPS.indexOf(step) + 1];
    return (<div className="ws-page">
      <header className="ws-page-header">
        <div>
          <button className="ac-back" onClick={() => void back()}><ArrowLeft size={16}/>{translateUi(" Back to courses")}</button>
          <h1>{translateUi(draft.title || "New course")}</h1>
          <p><Tag>{translateUi(stateLabel(draft))}</Tag> {translateUi(checks.filter((c) => c.done).length)}{translateUi("/")}{translateUi(checks.length)}{translateUi(" publication requirements met")}{translateUi(dirty ? " · unsaved changes" : "")}</p>
        </div>
        {translateUi(admin ? <button className="hub-button" onClick={() => setStep("Publish")}>{translateUi("Publication")}</button> : <button className="hub-button" disabled={busy || locked} onClick={() => void save("draft")}>{translateUi(busy ? "Saving…" : "Save draft")}</button>)}
      </header>
      {translateUi(admin && <p className="hub-feedback">{translateUi("You are viewing ")}{translateUi(row?.trainer_name)}{translateUi("'s course. Content is read-only; you can unpublish it under Publication if something is wrong.")}</p>)}
      {translateUi(!admin && locked && <p className="hub-feedback">{translateUi("Learners are enrolled in this course, so its content is locked to protect their progress. Create a new version from the course card to make changes.")}</p>)}
      {translateUi(draft.review_note && !admin && <p className="hub-feedback"><strong>{translateUi("Administrator feedback:")}</strong> {translateUi(draft.review_note)}</p>)}
      <div className="tw-builder">
        <nav className="ac-outline" aria-label={translateUi("Course builder steps")}>
          {translateUi(STEPS.map((s, i) => (<button key={s} className={`ac-outline-item ${step === s ? "active" : ""}`} onClick={() => setStep(s)} aria-current={step === s ? "step" : undefined}>
              {translateUi(stepDone[s] ? <CheckCircle2 size={17} className="ac-done"/> : <Circle size={17}/>)}
              <span><strong>{translateUi(i + 1)}{translateUi(". ")}{translateUi(s)}</strong><small>{translateUi({ Overview: "Title, outcomes, skills", Modules: `${draft.lessons.length} modules`, Assessment: `${draft.exam?.length ?? 0} exam questions`, Preview: "See it as a learner", Publish: "Checklist and review" }[s])}</small></span>
            </button>)))}
        </nav>
        <fieldset className="tw-stage" disabled={readOnly && step !== "Publish" && step !== "Preview"}>
          {translateUi(step === "Overview" && (<Panel>
              <h2>{translateUi("Course overview")}</h2>
              <p className="hub-caption">{translateUi("This is what learners see on the course card and landing page.")}</p>
              <div className="hub-form hub-space">
                <Field label={translateUi("Course title")}><input value={draft.title} onChange={(e) => change("title", e.target.value)} maxLength={200}/></Field>
                <Field label={translateUi("Course summary")}><textarea value={draft.description} onChange={(e) => change("description", e.target.value)} maxLength={10000} rows={4}/></Field>
                <div className="ws-form-grid">
                  <Field label={translateUi("Learning pathway")}><select value={draft.category} onChange={(e) => change("category", e.target.value)}>{translateUi(categories.map((c) => <option key={c} value={c}>{translateUi(c)}</option>))}</select></Field>
                  <Field label={translateUi("Level")}><select value={draft.level} onChange={(e) => change("level", e.target.value as TeachingData["level"])}><option value={"Beginner"}>{translateUi("Beginner")}</option><option value={"Intermediate"}>{translateUi("Intermediate")}</option><option value={"Advanced"}>{translateUi("Advanced")}</option></select></Field>
                  <Field label={translateUi("Estimated duration")}><input value={draft.duration || ""} onChange={(e) => change("duration", e.target.value)} placeholder={translateUi("e.g. 3 hours")} maxLength={100}/></Field>
                  <Field label={translateUi("Skills learners gain (comma separated)")}><input value={(draft.skills ?? []).join(", ")} onChange={(e) => change("skills", e.target.value.split(",").map((s) => s.trimStart()).slice(0, 12))} onBlur={() => change("skills", (draft.skills ?? []).map((s) => s.trim()).filter(Boolean))} maxLength={600}/></Field>
                </div>
                <ListEditor label={translateUi("What learners will learn")} hint="Add at least two outcomes, written as actions (e.g. “Write an evidence-based CV achievement”)." items={draft.outcomes ?? []} onChange={(v) => change("outcomes", v)}/>
              </div>
            </Panel>))}
          {translateUi(step === "Modules" && (<div className="hub-stack">
              {draft.lessons.length > 0 && <ol className="tw-modules">{draft.lessons.map((l, i) => { const words = l.content.trim() ? l.content.trim().split(/\s+/).length : 0; return (<li key={i} className="tw-module-card">
                  <span className="tw-module-num">{i + 1}</span>
                  <div className="tw-module-body">
                    <strong>{l.title || translateUi("Untitled module")}</strong>
                    <small>{translateUi("{p0} words", { p0: words })} · {translateUi("{p0} quiz questions", { p0: l.quiz?.length ?? 0 })}{l.video ? <> · {translateUi("Video")}</> : null}</small>
                    {(!l.title.trim() || !words || !(l.quiz?.length)) && <small className="tw-module-todo">{translateUi("Still needed: {p0}", { p0: [!l.title.trim() && translateUi("title"), !words && translateUi("reading"), !(l.quiz?.length) && translateUi("quiz questions")].filter(Boolean).join(", ") })}</small>}
                  </div>
                  <div className="hub-actions">
                    <button type="button" className="hub-record-icon hub-record-edit" aria-label={translateUi("Move module up")} title={translateUi("Move up")} disabled={i === 0} onClick={() => { const rows = [...draft.lessons]; [rows[i - 1], rows[i]] = [rows[i], rows[i - 1]]; change("lessons", rows); }}><ArrowUp size={17}/></button>
                    <button type="button" className="hub-record-icon hub-record-edit" aria-label={translateUi("Move module down")} title={translateUi("Move down")} disabled={i === draft.lessons.length - 1} onClick={() => { const rows = [...draft.lessons]; [rows[i + 1], rows[i]] = [rows[i], rows[i + 1]]; change("lessons", rows); }}><ArrowDown size={17}/></button>
                    <button type="button" className="hub-record-icon hub-record-delete" aria-label={translateUi("Delete module")} title={translateUi("Delete module")} onClick={async () => { if (await confirmAction({ title: `Delete module ${i + 1}?`, description: "Its reading and quiz questions will be removed from this draft.", confirmLabel: "Delete module", destructive: true }))
                change("lessons", draft.lessons.filter((_, n) => n !== i)); }}><Trash2 size={17}/></button>
                    <button type="button" className="hub-button secondary" onClick={() => setModule(i)}><FilePenLine size={15}/>{translateUi(readOnly ? "View" : "Edit")}</button>
                  </div>
                </li>); })}</ol>}
              {translateUi(!draft.lessons.length && <Empty>{translateUi("No modules yet. A good course has 3\u20136 focused modules, each with a short reading and a knowledge check.")}</Empty>)}
              <button type="button" className="hub-button secondary" disabled={draft.lessons.length >= 100} onClick={() => { change("lessons", [...draft.lessons, { title: "", content: "", quiz: [], quiz_minutes: 5 }]); setModule(draft.lessons.length); }}><Plus size={16}/>{translateUi(" Add module")}</button>
            </div>))}
          {translateUi(step === "Assessment" && (<div className="hub-stack">
              <Panel>
                <h2>{translateUi("Graded assignment")}</h2>
                <p className="hub-caption">{translateUi("Learners must write at least 60 words. You review submissions under Learners & assignments.")}</p>
                <Field label={translateUi("Assignment brief")}><textarea rows={4} value={draft.assignment || ""} onChange={(e) => change("assignment", e.target.value)} placeholder={translateUi("What should learners produce or reflect on?")} maxLength={4000}/></Field>
              </Panel>
              <Panel>
                <h2>{translateUi("Final exam")}</h2><p className="hub-caption">{translateUi("You set the time limit. The countdown starts when the learner begins and cannot be paused.")}</p>
                <p className="hub-caption">{translateUi("Unlocks after every module quiz is passed and the assignment is submitted. Answers are never shown to learners.")}</p>
                <div className="ws-form-grid hub-space">
                  <Field label={translateUi("Time limit (minutes)")}><input required step={1} type="number" min={2} max={240} value={draft.exam_minutes ?? 15} onChange={(e) => change("exam_minutes", Number(e.target.value))}/></Field>
                  <Field label={translateUi("Pass mark (%)")}><input type="number" min={50} max={100} value={draft.pass_mark ?? EXAM_PASS_MARK} onChange={(e) => change("pass_mark", Number(e.target.value))}/></Field>
                  <Field label={translateUi("Attempts per 24 hours")}><input type="number" min={1} max={5} value={draft.max_attempts ?? MAX_ATTEMPTS} onChange={(e) => change("max_attempts", Number(e.target.value))}/></Field>
                </div>
                <QuestionBank questions={draft.exam ?? []} onChange={(exam) => change("exam", exam)}/>
              </Panel>
            </div>))}
          {translateUi(step === "Preview" && <Preview data={draft}/>)}
          {translateUi(step === "Publish" && (<Panel>
              <h2>{translateUi(draft.published ? "Published in the academy" : ready ? "Ready to publish" : "Finish your course")}</h2>
              <ul className="tw-checklist">{translateUi(checks.map((c) => <li key={c.label} className={c.done ? "done" : ""}>{translateUi(c.done ? <CheckCircle2 size={17}/> : <Circle size={17}/>)}{translateUi(c.label)}</li>))}</ul>
              {translateUi(!draft.published && <p className="hub-caption">{translateUi("Publishing makes the course visible in the learning academy straight away and notifies members.")}</p>)}
              <div className="hub-actions hub-space">
                {translateUi(draft.published
                ? <button className="hub-button secondary" disabled={busy} onClick={() => void save("unpublish")}>{translateUi("Unpublish")}</button>
                : !admin && <button className="hub-button" disabled={busy || !ready} onClick={() => void save("publish")}><Send size={16}/>{translateUi(" Publish course")}</button>)}
              </div>
            </Panel>))}
          <div className="tw-footer">
            {translateUi(next && <button type="button" className="hub-button secondary" onClick={() => setStep(next)}>{translateUi("Next: ")}{translateUi(next)}{translateUi(" \u2192")}</button>)}
          </div>
        </fieldset>
      </div>
      {module !== null && draft.lessons[module] && (() => { const i = module, l = draft.lessons[i]; return <FormModal wide title={translateUi("Module {p0}", { p0: i + 1 }) + (l.title ? ` · ${l.title}` : "")} description={translateUi("Changes are kept in this draft. Save the course to keep them.")} onClose={() => setModule(null)}>
        <fieldset className="hub-form tw-module-form" disabled={readOnly}>
          <Field label={translateUi("Module title")}><input maxLength={200} value={l.title} onChange={(e) => setLesson(i, { title: e.target.value })} autoFocus/></Field>
          <Field label={translateUi("Reading")}><textarea rows={9} maxLength={20000} value={l.content} onChange={(e) => setLesson(i, { content: e.target.value })} placeholder={translateUi("Explain the concept, give a concrete example, and say what learners should do with it.")}/></Field>
          <div className="hub-field"><span>{translateUi("Lesson video (optional)")}</span><p className="hub-caption">{translateUi("Add a YouTube link or upload your own recording. Learners watch it above the reading.")}</p><LessonVideoEditor video={l.video} onChange={(video) => setLesson(i, { video })}/></div>
          <div className="tw-quiz-head">
            <h3>{translateUi("Knowledge check ")}<span className="ws-count">{translateUi(l.quiz?.length ?? 0)}{translateUi(" questions")}</span></h3>
            <label className="tw-inline-field">{translateUi("Time limit ")}<input aria-label={translateUi(`Module ${i + 1} quiz time limit (minutes)`)} required step={1} type="number" min={1} max={120} value={l.quiz_minutes ?? Math.max(3, (l.quiz?.length ?? 0) * 2)} onChange={(e) => setLesson(i, { quiz_minutes: Number(e.target.value) })}/>{translateUi(" min")}</label>
          </div>
          <p className="hub-caption">{translateUi("Learners complete this module only by scoring at least ")}{translateUi(QUIZ_PASS_MARK)}{translateUi("%.")}</p>
          <QuestionBank questions={l.quiz ?? []} onChange={(quiz) => setLesson(i, { quiz })}/>
        </fieldset>
        <div className="hub-actions hub-dialog-actions">
          {i < draft.lessons.length - 1 && <button type="button" className="hub-button secondary" onClick={() => setModule(i + 1)}>{translateUi("Next module \u2192")}</button>}
          <button type="button" className="hub-button" onClick={() => setModule(null)}>{translateUi("Done")}</button>
        </div>
      </FormModal>; })()}
    </div>);
}
function ListEditor({ label, hint, items, onChange }: {
    label: string;
    hint: string;
    items: string[];
    onChange: (v: string[]) => void;
}) {
    useSiteLanguage();
    const [value, setValue] = useState("");
    const add = () => { if (value.trim()) {
        onChange([...items, value.trim()].slice(0, 12));
        setValue("");
    } };
    return (<div className="hub-field">
      <span>{translateUi(label)}</span>
      <p className="hub-caption">{translateUi(hint)}</p>
      <ul className="ae-list">{translateUi(items.map((o, i) => <li key={i}><div><strong>{translateUi(o)}</strong></div><button type="button" className="hub-record-icon hub-record-delete" aria-label={translateUi("Remove {p0}", { p0: translateUi(o) })} title={translateUi("Remove")} onClick={() => onChange(items.filter((_, n) => n !== i))}><Trash2 size={16}/></button></li>))}</ul>
      <div className="tw-add-row"><input value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") {
        e.preventDefault();
        add();
    } }} maxLength={200} placeholder={translateUi("Add an outcome")} aria-label={translateUi("New outcome")}/><button type="button" className="hub-button secondary" onClick={add}>{translateUi("Add")}</button></div>
    </div>);
}
function QuestionBank({ questions, onChange }: {
    questions: TeachingQuestion[];
    onChange: (q: TeachingQuestion[]) => void;
}) {
    useSiteLanguage();
    const [editing, setEditing] = useState<TeachingQuestion | "new" | null>(null);
    const current = editing && editing !== "new" ? editing : null;
    return (<div>
      <ol className="ae-list">
        {translateUi(questions.map((q, n) => (<li key={q.id}>
            <div><strong>{translateUi(n + 1)}{translateUi(". ")}{translateUi(q.prompt)}</strong><small>{translateUi("Correct: ")}{translateUi(q.options[q.answer ?? 0])}</small></div>
            <div className="hub-actions">
              <button type="button" className="hub-record-icon hub-record-edit" aria-label={translateUi("Edit question")} title={translateUi("Edit question")} onClick={() => setEditing(q)}><FilePenLine size={17}/></button>
              <button type="button" className="hub-record-icon hub-record-delete" aria-label={translateUi("Delete question")} title={translateUi("Delete question")} onClick={async () => { if (await confirmAction({ title: "Delete this question?", description: q.prompt, confirmLabel: "Delete", destructive: true }))
            onChange(questions.filter((x) => x.id !== q.id)); }}><Trash2 size={17}/></button>
            </div>
          </li>)))}
        {translateUi(!questions.length && <li className="hub-caption">{translateUi("No questions yet.")}</li>)}
      </ol>
      <button type="button" className="hub-text-button hub-space" onClick={() => setEditing("new")}><Plus size={15}/>{translateUi(" Add question")}</button>
      <Dialog open={!!editing} onOpenChange={(o) => { if (!o)
        setEditing(null); }}>
        <DialogContent className="hub-app hub-dialog max-h-[90vh] overflow-y-auto">
          <DialogTitle>{translateUi(current ? "Edit question" : "Add question")}</DialogTitle>
          {translateUi(editing && (<form className="hub-form hub-space" onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const f = new FormData(e.currentTarget);
                const raw = [0, 1, 2, 3].map((i) => String(f.get(`option${i}`)).trim());
                const options = raw.filter(Boolean), correct = raw[Number(f.get("answer"))];
                if (options.length < 2)
                    return toast.error(translateUi("Add at least two answer options."));
                if (!correct)
                    return toast.error(translateUi("The correct answer must be one of the filled options."));
                const q: TeachingQuestion = { id: current?.id ?? newId(), prompt: String(f.get("prompt")).trim(), options, answer: options.indexOf(correct) };
                onChange(current ? questions.map((x) => (x.id === q.id ? q : x)) : [...questions, q]);
                setEditing(null);
            }}>
              <Field label={translateUi("Question")}><textarea name="prompt" required minLength={5} maxLength={400} defaultValue={current?.prompt}/></Field>
              {translateUi([0, 1, 2, 3].map((i) => <Field key={i} label={translateUi("Option {p0}{p1}", { p0: translateUi(i + 1), p1: translateUi(i > 1 ? " (optional)" : "") })}><input name={`option${i}`} required={i < 2} maxLength={200} defaultValue={current?.options[i]}/></Field>))}
              <Field label={translateUi("Correct answer")}><select name="answer" defaultValue={current?.answer ?? 0}>{translateUi([0, 1, 2, 3].map((i) => <option key={i} value={i}>{translateUi("Option ")}{translateUi(i + 1)}</option>))}</select></Field>
              <div className="hub-actions hub-dialog-actions"><button type="button" className="hub-button secondary" onClick={() => setEditing(null)}>{translateUi("Cancel")}</button><button className="hub-button">{translateUi("Save question")}</button></div>
            </form>))}
        </DialogContent>
      </Dialog>
    </div>);
}
function Preview({ data }: {
    data: TeachingData;
}) {
    useSiteLanguage();
    const assessments = serverAssessments(data), exam = assessments.find((a) => a.kind === "exam");
    const Section = ({ title, children }: {
        title: string;
        children: ReactNode;
    }) => {
        useSiteLanguage();
        return <><h2 className="hub-space">{translateUi(title)}</h2>{translateUi(children)}</>;
    };
    return (<Panel>
      <p className="hub-eyebrow">{translateUi("LEARNER PREVIEW \u00B7 ")}{translateUi(data.category)}</p>
      <h2>{translateUi(data.title || "Untitled course")}</h2>
      <p>{translateUi(data.description)}</p>
      <div className="ac-meta hub-space"><span>{translateUi(data.level)}</span><span>{translateUi(data.duration || "Self-paced")}</span><span>{translateUi(data.lessons.length)}{translateUi(" modules \u00B7 ")}{translateUi(assessments.length)}{translateUi(" graded assessments")}</span></div>
      <Section title={translateUi("What you'll learn")}><ul className="ac-outcomes">{translateUi((data.outcomes ?? []).map((o) => <li key={o}><CheckCircle2 size={17}/>{translateUi(o)}</li>))}</ul></Section>
      <Section title={translateUi("Syllabus")}>
        {translateUi(data.lessons.map((l, i) => (<details key={i} className="hub-lesson-preview">
            <summary>{translateUi("Module ")}{translateUi(i + 1)}{translateUi(": ")}{translateUi(l.title || "Untitled module")}{translateUi(" \u00B7 ")}{translateUi(l.quiz?.length ?? 0)}{translateUi("-question quiz")}{translateUi(l.video ? " · video" : "")}</summary>
            {translateUi(l.video && <LessonVideoPlayer video={l.video} caption={l.title}/>)}
            <p className="hub-prewrap">{translateUi(l.content)}</p>
            {translateUi(l.quiz?.map((q, n) => <p key={q.id} className="hub-caption">{translateUi("Q")}{translateUi(n + 1)}{translateUi(". ")}{translateUi(q.prompt)}{translateUi(" \u2014 ")}<strong>{translateUi(q.options[q.answer ?? 0])}</strong></p>))}
          </details>)))}
      </Section>
      <Section title={translateUi("Assignment")}><p>{translateUi(data.assignment || "No assignment brief yet.")}</p></Section>
      <Section title={translateUi("Final exam")}><p>{translateUi(exam ? `${exam.questions.length} questions · ${exam.minutes} minutes · pass mark ${exam.passMark}% · ${exam.maxAttempts} attempts per 24 hours` : "No final exam questions yet.")}</p></Section>
    </Panel>);
}
