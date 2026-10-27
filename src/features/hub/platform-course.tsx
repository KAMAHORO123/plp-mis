import { translateUi, useSiteLanguage } from '../../i18n/language';
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Award, BookOpen, CheckCircle2, CircleDot, Clock3, FileText, GraduationCap, ListChecks, LockKeyhole, ShieldAlert, Timer, XCircle } from "lucide-react";
import { toast } from "sonner";
import { confirmAction } from "@/components/shared/confirm-dialog";
import { platformApi, refreshVerifiedCredits } from "./platform-api";
import { Empty, Field, Panel, Progress, Tag } from "./ui";
import { OutlineItem, formatClock, type Item } from "./academy";
import { LessonVideoPlayer } from "./lesson-video";
import { CameraRequired, ProctorCamera, departureLabel, startProctoring, useProctoring, type Departure } from "./proctoring";
import { serverAssessments, wordCount, MIN_ASSIGNMENT_WORDS, type ServerAssessment, type TeachingData } from "./teaching-types";
import "./academy.css";
export const isPlatformId = (id: string) => /^[a-f0-9]{8}-[a-f0-9-]{27}$/i.test(id);
const MAX_FOCUS_LOSSES = 3;
type Attempt = {
    id: string;
    assessment_id: string;
    started_at: string;
    submitted_at: string;
    score: number;
    total: number;
    percent: number;
    passed: boolean;
    reason: "submitted" | "time" | "focus";
    focus_losses: number;
    results?: boolean[];
};
type Active = {
    id: string;
    assessment_id: string;
    started_at: string;
    ends_at: string;
    answers: Record<string, number>;
    focus_losses: number;
    questions: {
        id: string;
        prompt: string;
        options: string[];
    }[];
};
type Progress = {
    enrollment: {
        lessons: number[];
        viewed: number[];
        passed: boolean;
        completed_at: string | null;
        assignment: string;
        assignment_at: string | null;
    };
    attempts: Attempt[];
    active: Active | null;
};
type EnrollmentRow = {
    id: string;
    course_id: string;
    review_feedback?: string;
};
export function PlatformCoursePage() {
    useSiteLanguage();
    const { id } = useParams();
    const [course, setCourse] = useState<{
        data: TeachingData;
        trainer?: string;
    } | null>(null);
    const [enrollment, setEnrollment] = useState<EnrollmentRow | null>(null);
    const [progress, setProgress] = useState<Progress | null>(null);
    const [error, setError] = useState("");
    const [tab, setTab] = useState("Overview");
    const [item, setItem] = useState("reading-0");
    const load = useCallback(async () => {
        const [record, rows] = await Promise.all([platformApi<{
                data: TeachingData;
            }>(`/records/courses/${id}`), platformApi<EnrollmentRow[]>("/enrollments")]);
        const mine = rows.find((e) => e.course_id === id) ?? null;
        setCourse(record);
        setEnrollment(mine);
        const next = mine ? await platformApi<Progress>(`/enrollments/${mine.id}/assessments`) : null;
        setProgress(next);
        return next;
    }, [id]);
    useEffect(() => { load().catch((e) => setError(e.message)); }, [load]);
    useEffect(() => { if (progress?.active) {
        setTab("Modules");
        setItem(progress.active.assessment_id === "final" ? "final" : `quiz-${progress.active.assessment_id.split("-")[1]}`);
    } }, [progress?.active?.id]);
    if (!course)
        return <div className="ac-page"><Empty>{translateUi(error || "Loading course…")}</Empty></div>;
    const data = course.data, lessons = data.lessons || [], assessments = serverAssessments(data);
    // Courses built before timed assessments keep their original single-question flow.
    if (!data.exam?.length)
        return <LegacyCourse data={data} enrollment={enrollment} reload={load}/>;
    const e = progress?.enrollment;
    const exam = assessments.find((a) => a.kind === "exam")!;
    const quizFor = (i: number) => assessments.find((a) => a.moduleIndex === i);
    const moduleDone = (i: number) => !!e?.lessons.includes(i);
    const modulesDone = lessons.every((_, i) => moduleDone(i));
    const assignmentDone = !!e && wordCount(e.assignment) >= MIN_ASSIGNMENT_WORDS;
    const steps = lessons.length + 2, done = (e?.lessons.length ?? 0) + (assignmentDone ? 1 : 0) + (e?.passed ? 1 : 0);
    const pct = e?.completed_at ? 100 : Math.min(99, Math.round((done / steps) * 100));
    const items: Item[] = lessons.flatMap((l, i) => {
        const prev = i === 0 || moduleDone(i - 1), quiz = quizFor(i);
        return [
            { key: `reading-${i}`, label: l.title, detail: l.video ? "Video & reading" : "Reading", icon: FileText, locked: !e || !prev, done: !!e?.viewed.includes(i) || moduleDone(i) },
            ...(quiz ? [{ key: `quiz-${i}`, label: quiz.title, detail: `Graded quiz · ${quiz.questions.length} questions · ${quiz.minutes} min`, icon: ListChecks, locked: !e || !prev || !e.viewed.includes(i), done: moduleDone(i) }] : []),
        ];
    });
    items.push({ key: "assignment", label: "Graded assignment", detail: `Written · at least ${MIN_ASSIGNMENT_WORDS} words`, icon: FileText, locked: !e || !modulesDone, done: assignmentDone });
    items.push({ key: "final", label: exam.title, detail: `${exam.questions.length} questions · ${exam.minutes} min · pass ${exam.passMark}%`, icon: GraduationCap, locked: !e || !modulesDone || !assignmentDone, done: !!e?.passed });
    const current = items.find((x) => x.key === item) ?? items[0];
    const enroll = async () => {
        try {
            await platformApi("/enrollments", "POST", { course_id: id });
            await load();
            setTab("Modules");
            setItem("reading-0");
            toast.success(translateUi("Enrolled in {p0}", { p0: translateUi(data.title) }));
        }
        catch (err) {
            toast.error(translateUi((err as Error).message));
        }
    };
    const afterGrade = async () => {
        const next = await load();
        if (next?.enrollment.completed_at) {
            refreshVerifiedCredits();
            window.dispatchEvent(new Event("plp:achievements-updated"));
        }
    };
    return (<div className="ac-page">
      <Link className="ac-back" to="/academy"><ArrowLeft size={16}/>{translateUi(" Back to the academy")}</Link>
      <section className="ac-hero">
        <div>
          <p className="ac-hero-kicker">{translateUi(data.category || "PLP Academy")}</p>
          <h1>{translateUi(data.title)}</h1>
          <p>{translateUi(data.description)}</p>
          <div className="ac-hero-meta">
            <span><GraduationCap size={15}/>{translateUi(data.level || "Beginner")}</span>
            <span><Clock3 size={15}/>{translateUi(data.duration || "Self-paced")}</span>
            <span><BookOpen size={15}/>{translateUi(lessons.length)}{translateUi(" modules \u00B7 ")}{translateUi(assessments.length)}{translateUi(" graded assessments")}</span>
          </div>
        </div>
        <div className="ac-hero-card">
          {translateUi(e ? <>
            <Progress value={pct} label={translateUi(e.completed_at ? "Completed" : "Your progress")}/>
            {translateUi(e.completed_at ? <Link className="hub-button" to="/certificates"><Award size={16}/>{translateUi(" View certificate")}</Link>
                : <button className="hub-button" onClick={() => { setTab("Modules"); const next = items.find((x) => !x.done && !x.locked); if (next)
                    setItem(next.key); }}>{translateUi("Resume course ")}<ArrowRight size={16}/></button>)}
          </> : <>
            <p>{translateUi("Earn a verified certificate and 50 PLP credits when you pass every assessment.")}</p>
            <button className="hub-button" onClick={() => void enroll()}>{translateUi("Enroll in this course ")}<ArrowRight size={17}/></button>
          </>)}
        </div>
      </section>
      {translateUi(error && <p role="alert" className="hub-access-error">{translateUi(error)}</p>)}
      <div className="ws-tabs" role="tablist" aria-label={translateUi("Course sections")}>
        {translateUi(["Overview", "Modules", "Grades"].map((t) => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{translateUi(t)}</button>))}
      </div>
      {translateUi(tab === "Overview" && (<div className="ac-overview">
          <Panel>
            <h2>{translateUi("What you'll learn")}</h2>
            <ul className="ac-outcomes">{translateUi((data.outcomes?.length ? data.outcomes : lessons.map((l) => l.title)).map((o) => <li key={o}><CheckCircle2 size={17}/>{translateUi(o)}</li>))}</ul>
            {translateUi(!!data.skills?.length && <><h2 className="hub-space">{translateUi("Skills you'll gain")}</h2><div className="hub-tags">{translateUi(data.skills.map((s) => <Tag key={s}>{translateUi(s)}</Tag>))}</div></>)}
            <h2 className="hub-space">{translateUi("Syllabus")}</h2>
            <ol className="ac-syllabus">
              {translateUi(lessons.map((l, i) => <li key={i}><span>{translateUi("Module ")}{translateUi(i + 1)}</span><strong>{translateUi(l.title)}</strong><small>{translateUi(l.video ? "Video + reading" : "Reading")}{translateUi(quizFor(i) ? ` · ${quizFor(i)!.questions.length}-question timed quiz` : "")}</small></li>))}
              <li><span>{translateUi("Assignment")}</span><strong>{translateUi("Graded written assignment")}</strong><small>{translateUi(data.assignment)}</small></li>
              <li><span>{translateUi("Final")}</span><strong>{translateUi(exam.title)}</strong><small>{translateUi(exam.questions.length)}{translateUi(" questions \u00B7 ")}{translateUi(exam.minutes)}{translateUi(" minutes \u00B7 pass mark ")}{translateUi(exam.passMark)}{translateUi("%")}</small></li>
            </ol>
          </Panel>
          <Panel className="ac-rules">
            <h2><ShieldAlert size={18}/>{translateUi(" How you pass this course")}</h2>
            <ul>
              <li>{translateUi("Modules unlock in order. Read each module, then pass its knowledge check with at least 80%.")}</li>
              <li>{translateUi("Quizzes and the exam are timed by the server. The timer cannot be paused, and only answers saved before time runs out are graded.")}</li>
              <li>{translateUi("Quizzes and exams are proctored: your camera must stay on, the assessment opens in full screen, and you cannot leave the page until you submit. The camera feed is not recorded.")}</li>
              <li>{translateUi("Leaving the tab, leaving full screen or turning off the camera is recorded. After ")}{translateUi(MAX_FOCUS_LOSSES)}{translateUi(" departures your attempt is submitted.")}</li>
              <li>{translateUi("You have ")}{translateUi(exam.maxAttempts)}{translateUi(" attempts per assessment every 24 hours.")}</li>
              <li>{translateUi("Submit the graded assignment (")}{translateUi(MIN_ASSIGNMENT_WORDS)}{translateUi("+ words) to unlock the final exam.")}</li>
              <li>{translateUi("The course completes only when every assessment is passed.")}</li>
            </ul>
          </Panel>
        </div>))}
      {translateUi(tab === "Modules" && (<div className="ac-learn">
          <aside className="ac-outline" aria-label={translateUi("Course outline")}>
            {translateUi(lessons.map((_, i) => (<div key={i} className="ac-outline-module">
                <p>{translateUi("Module ")}{translateUi(i + 1)}{translateUi(moduleDone(i) && <CheckCircle2 size={14}/>)}</p>
                {translateUi(items.filter((x) => x.key.endsWith(`-${i}`)).map((x) => <OutlineItem key={x.key} item={x} active={current.key === x.key} onOpen={(it) => it.locked ? toast.error(translateUi(e ? "Complete the previous step to unlock this item." : "Enroll to start this course.")) : setItem(it.key)}/>))}
              </div>)))}
            <div className="ac-outline-module">
              <p>{translateUi("Final assessment")}</p>
              {translateUi(items.filter((x) => x.key === "assignment" || x.key === "final").map((x) => <OutlineItem key={x.key} item={x} active={current.key === x.key} onOpen={(it) => it.locked ? toast.error(translateUi("Complete the previous step to unlock this item.")) : setItem(it.key)}/>))}
            </div>
          </aside>
          <div className="ac-stage">
            {translateUi(!e || !enrollment ? (<Panel><h2>{translateUi("Enroll to begin")}</h2><p>{translateUi("Enroll to unlock module readings, quizzes, and the final exam.")}</p><button className="hub-button hub-space" onClick={() => void enroll()}>{translateUi("Enroll in this course ")}<ArrowRight size={17}/></button></Panel>) : current.locked ? (<Panel><h2><LockKeyhole size={18}/> {translateUi(current.label)}</h2><p>{translateUi("This item unlocks after you finish the previous step.")}</p></Panel>) : current.key.startsWith("reading-") ? (<ServerReading key={current.key} enrollmentId={enrollment.id} data={data} index={Number(current.key.split("-")[1])} seen={e.viewed.includes(Number(current.key.split("-")[1]))} onViewed={() => void load()} onNext={setItem}/>) : current.key === "assignment" ? (<ServerAssignment enrollmentId={enrollment.id} brief={data.assignment || ""} saved={e.assignment} submittedAt={e.assignment_at} locked={e.passed} feedback={enrollment.review_feedback} onSubmitted={async () => { await load(); setItem("final"); }}/>) : (<ServerAssessmentPanel key={current.key} enrollmentId={enrollment.id} assessment={assessments.find((a) => (current.key === "final" ? a.kind === "exam" : a.moduleIndex === Number(current.key.split("-")[1])))!} progress={progress!} onChange={afterGrade}/>))}
            {translateUi(e?.completed_at && (<div className="hub-success hub-space"><Award /><div><h3>{translateUi("You earned it.")}</h3><p>{translateUi("Every assessment is passed. Your certificate and 50 verified credits are ready.")}</p><Link className="hub-text-link" to="/certificates">{translateUi("View your certificate")}</Link></div></div>))}
          </div>
        </div>))}
      {translateUi(tab === "Grades" && (e ? (<Panel>
          <div className="ws-panel-title"><h2>{translateUi("Grades")}</h2><span className="ws-pill">{translateUi(e.completed_at ? "Completed" : "In progress")}</span></div>
          <div className="ws-table-wrap"><table className="ws-table"><thead><tr><th>{translateUi("Item")}</th><th>{translateUi("Status")}</th><th>{translateUi("Best score")}</th><th>{translateUi("Pass mark")}</th><th>{translateUi("Attempts")}</th></tr></thead><tbody>
            {translateUi(assessments.map((a) => {
                const rows = progress!.attempts.filter((x) => x.assessment_id === a.id), best = rows.reduce<Attempt | undefined>((b, x) => (!b || x.percent > b.percent ? x : b), undefined);
                return <tr key={a.id}><td><strong>{translateUi(a.title)}</strong>{translateUi(a.moduleIndex !== undefined && <small>{translateUi(lessons[a.moduleIndex].title)}</small>)}</td><td>{translateUi(rows.some((x) => x.passed) ? "Passed" : best ? "Not passed" : "Not started")}</td><td>{translateUi(best ? `${best.percent}%` : "—")}</td><td>{translateUi(a.passMark)}{translateUi("%")}</td><td>{translateUi(rows.length)}</td></tr>;
            }))}
            <tr><td><strong>{translateUi("Graded assignment")}</strong><small>{translateUi("At least ")}{translateUi(MIN_ASSIGNMENT_WORDS)}{translateUi(" words")}</small></td><td>{translateUi(assignmentDone ? (enrollment?.review_feedback ? "Reviewed" : "Submitted") : "Not submitted")}</td><td>{translateUi("\u2014")}</td><td>{translateUi(MIN_ASSIGNMENT_WORDS)}{translateUi(" words")}</td><td>{translateUi("\u2014")}</td></tr>
          </tbody></table></div>
        </Panel>) : <Empty>{translateUi("Enroll to see your grades.")}</Empty>))}
    </div>);
}
function ServerReading({ enrollmentId, data, index, seen, onViewed, onNext }: {
    enrollmentId: string;
    data: TeachingData;
    index: number;
    seen: boolean;
    onViewed: () => void;
    onNext: (key: string) => void;
}) {
    useSiteLanguage();
    const lesson = data.lessons[index], hasQuiz = !!lesson.quiz?.length;
    useEffect(() => { if (!seen)
        platformApi(`/enrollments/${enrollmentId}/viewed`, "POST", { lesson: index }).then(onViewed).catch((e) => toast.error(translateUi(e.message))); }, [enrollmentId, index]);
    const next = hasQuiz ? `quiz-${index}` : index + 1 < data.lessons.length ? `reading-${index + 1}` : "assignment";
    return (<Panel>
      <p className="hub-eyebrow">{translateUi("MODULE ")}{translateUi(index + 1)}{translateUi(" OF ")}{translateUi(data.lessons.length)}{translateUi(" \u00B7 READING")}</p>
      <h2>{translateUi(lesson.title)}</h2>
      {translateUi(lesson.video && <LessonVideoPlayer video={lesson.video} caption={lesson.title}/>)}
      <p className="hub-lesson-copy hub-prewrap">{translateUi(lesson.content)}</p>
      <div className="ac-reading-next">
        <p className="hub-caption">{translateUi(hasQuiz ? "Next: a timed knowledge check. You must score at least 80% to complete this module." : "Reading this module completes it.")}</p>
        <button className="hub-button" onClick={() => onNext(next)}>{translateUi(hasQuiz ? "Go to knowledge check" : "Continue")} <ArrowRight size={16}/></button>
      </div>
    </Panel>);
}
function ServerAssignment({ enrollmentId, brief, saved, submittedAt, locked, feedback, onSubmitted }: {
    enrollmentId: string;
    brief: string;
    saved: string;
    submittedAt: string | null;
    locked: boolean;
    feedback?: string;
    onSubmitted: () => Promise<void>;
}) {
    useSiteLanguage();
    const [text, setText] = useState(saved), [busy, setBusy] = useState(false);
    const words = wordCount(text);
    return (<Panel>
      <p className="hub-eyebrow">{translateUi("GRADED ASSIGNMENT")}</p>
      <h2>{translateUi("Put your learning into practice")}</h2>
      <p>{translateUi(brief)}</p>
      <form className="hub-form hub-space" onSubmit={async (ev) => {
            ev.preventDefault();
            setBusy(true);
            try {
                await platformApi(`/enrollments/${enrollmentId}/progress`, "POST", { assignment: text });
                toast.success(translateUi("Assignment submitted. The final exam is now unlocked."));
                await onSubmitted();
            }
            catch (err) {
                toast.error(translateUi((err as Error).message));
            }
            finally {
                setBusy(false);
            }
        }}>
        <Field label={translateUi("Your response")}><textarea value={text} onChange={(ev) => setText(ev.target.value)} rows={10} maxLength={10000} disabled={locked}/></Field>
        <p className={`ac-word-count ${words >= MIN_ASSIGNMENT_WORDS ? "ok" : ""}`}>{translateUi(words)}{translateUi(" / ")}{translateUi(MIN_ASSIGNMENT_WORDS)}{translateUi(" words minimum")}</p>
        {translateUi(locked ? <p className="hub-caption">{translateUi("Your assignment is locked because you passed the final exam.")}</p> : <button className="hub-button" disabled={busy || words < MIN_ASSIGNMENT_WORDS}>{translateUi(submittedAt ? "Resubmit assignment" : "Submit assignment")}</button>)}
        {translateUi(submittedAt && <p className="hub-caption">{translateUi("Last submitted ")}{translateUi(new Date(submittedAt).toLocaleString())}</p>)}
      </form>
      {translateUi(feedback && <div className="hub-feedback hub-space"><h3>{translateUi("Trainer feedback")}</h3><p className="hub-prewrap">{translateUi(feedback)}</p></div>)}
    </Panel>);
}
function ServerAssessmentPanel({ enrollmentId, assessment, progress, onChange }: {
    enrollmentId: string;
    assessment: ServerAssessment;
    progress: Progress;
    onChange: () => Promise<void>;
}) {
    useSiteLanguage();
    const [active, setActive] = useState<Active | null>(progress.active?.assessment_id === assessment.id ? progress.active : null);
    const [now, setNow] = useState(Date.now());
    const [busy, setBusy] = useState(false);
    const answers = useRef<Record<string, number>>(active?.answers ?? {});
    const attempts = progress.attempts.filter((a) => a.assessment_id === assessment.id);
    const passed = attempts.some((a) => a.passed), last = attempts.at(-1);
    const recentFails = attempts.filter((a) => !a.passed && now - Date.parse(a.submitted_at) < 86400000);
    const lockedUntil = recentFails.length >= assessment.maxAttempts ? new Date(Math.min(...recentFails.map((a) => Date.parse(a.submitted_at))) + 86400000) : null;
    const otherActive = progress.active && progress.active.assessment_id !== assessment.id;
    const remaining = active ? Date.parse(active.ends_at) - now : 0;
    const finish = async (reason: Attempt["reason"]) => {
        if (!active || busy)
            return;
        setBusy(true);
        proctor.end();
        try {
            const r = await platformApi<{
                submitted: Attempt;
            }>(`/assessment-attempts/${active.id}/submit`, "POST", { answers: answers.current, reason });
            setActive(null);
            if (r.submitted.passed)
                toast.success(translateUi("Passed with {p0}%.", { p0: translateUi(r.submitted.percent) }));
            else
                toast.error(translateUi("{p0}% \u2014 the pass mark is {p1}%.{p2}", { p0: translateUi(r.submitted.percent), p1: translateUi(assessment.passMark), p2: translateUi(r.submitted.reason === "time" ? " Time expired." : r.submitted.reason === "focus" ? " Submitted after too many departures." : "") }));
            await onChange();
        }
        catch (err) {
            toast.error(translateUi((err as Error).message));
            await onChange();
        }
        finally {
            setBusy(false);
        }
    };
    useEffect(() => { if (!active)
        return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [active?.id]);
    useEffect(() => { if (active && remaining <= 0)
        void finish("time"); }, [active && remaining <= 0]);
    // Leaving the tab, leaving full screen and turning the camera off all count towards the server-enforced limit.
    const losses = useRef(active?.focus_losses ?? 0);
    const depart = async (reason: Departure) => {
        if (!active)
            return;
        const count = ++losses.current;
        setActive((a) => (a ? { ...a, focus_losses: count } : a));
        try {
            const r = await platformApi<{
                submitted?: Attempt;
            }>(`/assessment-attempts/${active.id}`, "PUT", { answers: answers.current, focus_losses: count });
            if (r.submitted) {
                proctor.end();
                setActive(null);
                toast.error(translateUi("Too many departures from the assessment. It was submitted."));
                await onChange();
            }
            else
                toast.warning(translateUi("{p0} ({p1}/{p2}). Stay on this page, in full screen, with your camera on.", { p0: translateUi(departureLabel[reason]), p1: translateUi(count), p2: translateUi(MAX_FOCUS_LOSSES) }));
        }
        catch { /* The server still enforces the deadline. */ }
    };
    const proctor = useProctoring(!!active, (reason) => void depart(reason));
    useEffect(() => {
        if (!active)
            return;
        const onHide = () => { if (document.visibilityState === "hidden")
            void depart("tab"); };
        document.addEventListener("visibilitychange", onHide);
        return () => document.removeEventListener("visibilitychange", onHide);
    }, [active?.id]);
    const start = async () => {
        if (!await confirmAction({ title: `Start ${assessment.title.toLowerCase()}?`, description: `You will have ${assessment.minutes} minutes for ${assessment.questions.length} questions. Your camera must stay on and the assessment opens in full screen. The timer cannot be paused, you cannot leave the page, only answers saved before time runs out count, and leaving full screen or this tab is recorded.`, confirmLabel: "Turn on camera & start" }))
            return;
        let stream: MediaStream;
        try {
            stream = await startProctoring();
        }
        catch (err) {
            toast.error(translateUi((err as Error).message));
            return;
        }
        try {
            const a = await platformApi<Active>(`/enrollments/${enrollmentId}/assessments/${assessment.id}/start`, "POST", {});
            answers.current = {};
            losses.current = 0;
            proctor.attach(stream);
            setActive(a);
            setNow(Date.now());
        }
        catch (err) {
            stream.getTracks().forEach((t) => t.stop());
            if (document.fullscreenElement)
                void document.exitFullscreen();
            toast.error(translateUi((err as Error).message));
        }
    };
    if (active) {
        const answered = active.questions.filter((q) => answers.current[q.id] !== undefined).length;
        if (!proctor.stream)
            return <Panel className="ac-exam"><div className={`ac-timer ${remaining < 60000 ? "urgent" : ""}`} role="timer"><div><strong>{translateUi(assessment.title)}</strong><small>{translateUi("Camera off")}</small></div><span><Timer size={18}/> {translateUi(formatClock(remaining))}</span></div><CameraRequired onEnable={async () => proctor.attach(await startProctoring())}/></Panel>;
        return (<Panel className="ac-exam">
        <ProctorCamera stream={proctor.stream}/>
        <div className={`ac-timer ${remaining < 60000 ? "urgent" : ""}`} role="timer" aria-live="off">
          <div><strong>{translateUi(assessment.title)}</strong><small>{translateUi(answered)}{translateUi(" of ")}{translateUi(active.questions.length)}{translateUi(" answered \u00B7 ")}{translateUi(active.focus_losses)}{translateUi("/")}{translateUi(MAX_FOCUS_LOSSES)}{translateUi(" departures \u00B7 camera on \u00B7 answers save automatically")}</small></div>
          <span><Timer size={18}/> {translateUi(formatClock(remaining))}</span>
        </div>
        <form className="hub-form" onSubmit={async (ev) => {
                ev.preventDefault();
                if (answered < active.questions.length && !await confirmAction({ title: "Submit with unanswered questions?", description: `${active.questions.length - answered} question(s) are unanswered and will be marked incorrect.`, confirmLabel: "Submit anyway", destructive: true }))
                    return;
                void finish("submitted");
            }}>
          {translateUi(active.questions.map((q, n) => (<fieldset key={q.id} className="ac-question">
              <legend><span>{translateUi("Question ")}{translateUi(n + 1)}</span>{translateUi(q.prompt)}</legend>
              {translateUi(q.options.map((o, i) => (<label className="hub-radio" key={i}>
                  <input type="radio" name={q.id} defaultChecked={active.answers[q.id] === i} onChange={() => {
                        answers.current = { ...answers.current, [q.id]: i };
                        setNow(Date.now());
                        platformApi(`/assessment-attempts/${active.id}`, "PUT", { answers: { [q.id]: i } }).catch(() => toast.error(translateUi("Your last answer could not be saved. Check your connection.")));
                    }}/>
                  {translateUi(o)}
                </label>)))}
            </fieldset>)))}
          <button className="hub-button" disabled={busy}>{translateUi("Submit ")}{translateUi(assessment.kind === "exam" ? "exam" : "quiz")}</button>
        </form>
      </Panel>);
    }
    return (<Panel>
      <p className="hub-eyebrow">{translateUi(assessment.kind === "exam" ? "FINAL EXAM" : `MODULE ${assessment.moduleIndex! + 1} · GRADED QUIZ`)}</p>
      <h2>{translateUi(assessment.title)}</h2>
      <div className="ac-exam-facts">
        <div><ListChecks size={18}/><strong>{translateUi(assessment.questions.length)}</strong><span>{translateUi("questions")}</span></div>
        <div><Timer size={18}/><strong>{translateUi(assessment.minutes)}{translateUi(" min")}</strong><span>{translateUi("time limit")}</span></div>
        <div><CircleDot size={18}/><strong>{translateUi(assessment.passMark)}{translateUi("%")}</strong><span>{translateUi("to pass")}</span></div>
        <div><ShieldAlert size={18}/><strong>{translateUi(passed ? "—" : assessment.maxAttempts - recentFails.length)}</strong><span>{translateUi("attempts left")}</span></div>
      </div>
      {translateUi(last && (<div className={`ac-result ${last.passed ? "pass" : "fail"}`}>
          {translateUi(last.passed ? <CheckCircle2 /> : <XCircle />)}
          <div>
            <strong>{translateUi("Latest attempt: ")}{translateUi(last.percent)}{translateUi("% (")}{translateUi(last.score)}{translateUi("/")}{translateUi(last.total)}{translateUi(") \u00B7 ")}{translateUi(last.passed ? "Passed" : "Not passed")}</strong>
            <small>{translateUi("Submitted ")}{translateUi(new Date(last.submitted_at).toLocaleString())}{translateUi(last.reason === "time" ? " · time expired" : last.reason === "focus" ? " · submitted after leaving the tab" : "")}</small>
            {translateUi(last.results && <p>{translateUi(last.results.map((ok, i) => <span key={i} className={ok ? "ok" : "no"}>{translateUi("Q")}{translateUi(i + 1)} {translateUi(ok ? "correct" : "incorrect")}</span>))}</p>)}
            {translateUi(assessment.kind === "exam" && !last.passed && <p className="hub-caption">{translateUi("Exam answers are not revealed. Review the modules before your next attempt.")}</p>)}
          </div>
        </div>))}
      {translateUi(passed ? <p className="hub-feedback">{translateUi("You passed this assessment.")}</p>
            : otherActive ? <p className="hub-feedback">{translateUi("Finish your other open assessment before starting this one.")}</p>
                : lockedUntil ? <p className="hub-feedback">{translateUi("You have used all ")}{translateUi(assessment.maxAttempts)}{translateUi(" attempts. Your next attempt opens ")}{translateUi(lockedUntil.toLocaleString())}{translateUi(".")}</p>
                    : <button className="hub-button hub-space" onClick={() => void start()}><Timer size={16}/> {translateUi(attempts.length ? "Retake" : "Start")} {translateUi(assessment.kind === "exam" ? "exam" : "quiz")}</button>)}
    </Panel>);
}
function LegacyCourse({ data, enrollment, reload }: {
    data: TeachingData;
    enrollment: EnrollmentRow | null;
    reload: () => Promise<unknown>;
}) {
    useSiteLanguage();
    return (<div className="ac-page">
      <Link className="ac-back" to="/academy"><ArrowLeft size={16}/>{translateUi(" Back to the academy")}</Link>
      <section className="ac-hero"><div><p className="ac-hero-kicker">{translateUi(data.category || "PLP Academy")}</p><h1>{translateUi(data.title)}</h1><p>{translateUi(data.description)}</p></div></section>
      <Panel>
        <h2>{translateUi("This course is being updated")}</h2>
        <p>{translateUi("Its trainer is adding timed module quizzes and a final exam. You can read the modules now; certificates are issued once the assessed version is published.")}</p>
        {translateUi(!enrollment && <button className="hub-button hub-space" onClick={async () => { try {
        await platformApi("/enrollments", "POST", { course_id: location.pathname.split("/").pop() });
        await reload();
    }
    catch (err) {
        toast.error(translateUi((err as Error).message));
    } }}>{translateUi("Enroll in this course")}</button>)}
      </Panel>
      {translateUi(enrollment && data.lessons.map((l, i) => <Panel key={i}><p className="hub-eyebrow">{translateUi("MODULE ")}{translateUi(i + 1)}</p><h2>{translateUi(l.title)}</h2><p className="hub-prewrap">{translateUi(l.content)}</p></Panel>))}
    </div>);
}
