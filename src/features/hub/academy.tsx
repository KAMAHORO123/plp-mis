import { translateUi, useSiteLanguage } from '../../i18n/language';
import { platformApi } from "./platform-api";
import { useLiveTick } from './live';
import { PlatformCoursePage, isPlatformId } from "./platform-course";
import type { TeachingData } from "./teaching-types";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Award, BookOpen, CheckCircle2, CircleDot, Clock3, FileText, GraduationCap, ListChecks, LockKeyhole, ShieldAlert, Timer, Users, XCircle, } from "lucide-react";
import { toast } from "sonner";
import { confirmAction } from "@/components/shared/confirm-dialog";
import { categories, alxPrograms, type Course } from "./data";
import { useHub, completeCourse, finishAttempt, type Enrollment } from "./store";
import { assessmentsFor, attemptsFor, bestAttempt, hasPassed, nextAttemptAt, outcomesFor, shuffle, wordCount, ATTEMPT_WINDOW_HOURS, MAX_FOCUS_LOSSES, MIN_ASSIGNMENT_WORDS, type Assessment, type AssessmentAttempt, } from "./assessments";
import { Empty, Field, Heading, Panel, Progress, SearchBox, Tag, TextLink } from "./ui";
import "./academy.css";
import { FormModal } from "./modal";
import { uploadFile } from "./platform-api";
import { deleteRecord, saveRecord } from "./platform-records";
import { CameraRequired, ProctorCamera, departureLabel, startProctoring, useProctoring, type Departure } from "./proctoring";
/** Share of required steps (module checks, assignment, final exam) the learner has finished. */
function courseProgress(course: Course, e?: Enrollment) {
    if (!e)
        return 0;
    if (e.completedAt)
        return 100;
    const steps = course.lessons.length + 2;
    const done = e.lessons.length + (e.assignmentAt || e.assignment ? 1 : 0) + (e.passed ? 1 : 0);
    return Math.min(99, Math.round((done / steps) * 100));
}
export const formatClock = (ms: number) => {
    const total = Math.max(0, Math.ceil(ms / 1000));
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};
export function AcademyPage() {
    useSiteLanguage();
    const { state, profile } = useHub();
    const [params, setParams] = useSearchParams();
    const [search, setSearch] = useState("");
    const [level, setLevel] = useState("All levels");
    const [view, setView] = useState("All courses");
    const category = params.get("category") || "All pathways";
    const [platformCourses, setPlatformCourses] = useState<Course[]>([]);
    const [platformEnrollments, setPlatformEnrollments] = useState<Enrollment[]>([]);
    const live = useLiveTick();
    useEffect(() => {
        let active = true;
        // Trainer-built courses and their enrolments live on the platform API; quiz fields arrive without answers.
        platformApi<{
            id: string;
            owner_id: string;
            data: TeachingData;
        }[]>("/records/courses").then(rows => { if (active)
            setPlatformCourses(rows.filter(r => r.data.published).map(r => ({ id: r.id, title: r.data.title, category: r.data.category || "Leadership Development", summary: r.data.description, level: r.data.level || "Beginner", duration: r.data.duration || "Self-paced", skills: r.data.skills || [], outcomes: r.data.outcomes, lessons: (r.data.lessons || []).map(l => ({ title: l.title, content: l.content })), assignment: r.data.assignment || "", question: "", options: [], answer: 0, published: true, ownerId: r.owner_id }))); }).catch(() => { });
        platformApi<{
            course_id: string;
            lessons: number[];
            assignment: string;
            passed: boolean;
            completed_at: string | null;
        }[]>("/enrollments").then(rows => { if (active)
            setPlatformEnrollments(rows.map(e => ({ memberId: profile.id, courseId: e.course_id, lessons: e.lessons, assignment: e.assignment, passed: e.passed, completedAt: e.completed_at ?? undefined }))); }).catch(() => { });
        return () => { active = false; };
    }, [profile.id, live]);
    const published = [...platformCourses, ...state.courses.filter(c => c.published && !platformCourses.some(r => r.id === c.id))];
    const mine = [...platformEnrollments, ...state.enrollments.filter((e) => e.memberId === profile.id)];
    const list = published.filter((c) => {
        const e = mine.find((x) => x.courseId === c.id);
        return ((category === "All pathways" || c.category === category) &&
            (level === "All levels" || c.level === level) &&
            `${c.title} ${c.summary} ${c.skills.join(" ")}`.toLowerCase().includes(search.toLowerCase()) &&
            (view === "All courses" || (view === "In progress" ? e && !e.completedAt : !!e?.completedAt)));
    });
    const resume = mine
        .filter((e) => !e.completedAt)
        .map((e) => ({ e, c: published.find((c) => c.id === e.courseId) }))
        .find((x) => x.c);
    return (<div className="ac-page">
      <Heading eyebrow="PLP LEARNING ACADEMY" title={translateUi("Learn skills that open doors.")} description={translateUi("Structured courses with readings, timed knowledge checks, a graded assignment, and a final exam. Certificates are issued only when every assessment is passed.")}/>
      {translateUi(resume?.c && (<Link to={`/academy/${resume.c.id}`} className="ac-resume">
          <span className="ac-resume-icon"><BookOpen size={20}/></span>
          <div>
            <small>{translateUi("Continue where you left off")}</small>
            <strong>{translateUi(resume.c.title)}</strong>
            <Progress value={courseProgress(resume.c, resume.e)} label={translateUi("Course progress")}/>
          </div>
          <span className="hub-button">{translateUi("Resume ")}<ArrowRight size={16}/></span>
        </Link>))}
      <div className="ac-filters">
        <SearchBox value={search} onChange={setSearch} placeholder={translateUi("Search courses or skills")}/>
        <select aria-label={translateUi("Course level")} value={level} onChange={(e) => setLevel(e.target.value)}>
          {translateUi(["All levels", "Beginner", "Intermediate", "Advanced"].map((l) => <option key={l} value={l}>{translateUi(l)}</option>))}
        </select>
        <div className="ws-tabs ac-view-tabs" role="tablist" aria-label={translateUi("My learning")}>
          {translateUi(["All courses", "In progress", "Completed"].map((v) => (<button key={v} role="tab" aria-selected={view === v} className={view === v ? "active" : ""} onClick={() => setView(v)}>{translateUi(v)}</button>)))}
        </div>
      </div>
      <div className="hub-chips" aria-label={translateUi("Learning categories")}>
        {translateUi(["All pathways", ...categories].map((c) => (<button className={c === category ? "active" : ""} key={c} onClick={() => setParams(c === "All pathways" ? {} : { category: c })}>{translateUi(c)}</button>)))}
      </div>
      <div className="ac-grid">
        {translateUi(list.map((c) => {
            const i = published.indexOf(c);
            const e = mine.find((x) => x.courseId === c.id);
            const learners = state.enrollments.filter((x) => x.courseId === c.id).length;
            return (<Link className="ac-card" key={c.id} to={`/academy/${c.id}`}>
              <div className={`ac-card-art tone-${i % 5}`}>
                <GraduationCap aria-hidden="true"/>
                <span>{translateUi("PLP ACADEMY")}</span>
                <small>{translateUi(c.category)}</small>
              </div>
              <div className="ac-card-body">
                <div className="hub-row">
                  <Tag>{translateUi(c.level)}</Tag>
                  {translateUi(e?.completedAt ? <span className="ac-badge ok"><CheckCircle2 size={14}/>{translateUi(" Completed")}</span> : e ? <span className="ac-badge">{translateUi("In progress")}</span> : null)}
                </div>
                <h2>{translateUi(c.title)}</h2>
                <p>{translateUi(c.summary)}</p>
                <p className="ac-skills"><strong>{translateUi("Skills you'll gain:")}</strong> {translateUi(c.skills.join(", ") || "—")}</p>
                <div className="ac-meta">
                  <span><Clock3 size={14}/>{translateUi(c.duration || "Self-paced")}</span>
                  <span><BookOpen size={14}/>{translateUi(c.lessons.length)}{translateUi(" modules")}</span>
                  <span><Users size={14}/>{translateUi(learners)}{translateUi(" enrolled")}</span>
                </div>
                {translateUi(e && <Progress value={courseProgress(c, e)}/>)}
              </div>
            </Link>);
        }))}
      </div>
      {translateUi(!list.length && <Empty>{translateUi("No courses match. Try another pathway, level, or clear your search.")}</Empty>)}
    </div>);
}
export type Item = {
    key: string;
    label: string;
    detail: string;
    icon: typeof BookOpen;
    locked: boolean;
    done: boolean;
};
export function CoursePage() {
    useSiteLanguage();
    const { id } = useParams();
    const { state } = useHub();
    return id && isPlatformId(id) && !state.courses.some(c => c.id === id) ? <PlatformCoursePage /> : <LocalCoursePage />;
}
function LocalCoursePage() {
    useSiteLanguage();
    const { id } = useParams();
    const { state, profile, update } = useHub();
    const course = state.courses.find((c) => c.id === id && c.published);
    const enrollment = state.enrollments.find((e) => e.courseId === id && e.memberId === profile.id);
    const [tab, setTab] = useState("Overview");
    const [item, setItem] = useState("reading-0");
    // An attempt whose time ran out while the learner was away is graded on return.
    useEffect(() => {
        if (!course || !enrollment?.active || Date.parse(enrollment.active.endsAt) > Date.now())
            return;
        let graded = false;
        update((s) => { graded = !!finishAttempt(s, profile.id, course.id, "time"); });
        if (graded)
            toast.error(translateUi("Time expired on your open assessment. It was submitted automatically."));
    }, [course?.id, enrollment?.active?.endsAt]);
    useEffect(() => {
        if (enrollment?.active) {
            setTab("Modules");
            setItem(enrollment.active.assessmentId === "final" ? "final" : `quiz-${enrollment.active.assessmentId.split("-")[1]}`);
        }
    }, [enrollment?.active?.assessmentId]);
    if (!course)
        return <Empty>{translateUi("Course not found. ")}<TextLink to="/academy">{translateUi("Back to academy")}</TextLink></Empty>;
    const assessments = assessmentsFor(course);
    const exam = assessments.find((a) => a.kind === "exam");
    const quizFor = (i: number) => assessments.find((a) => a.moduleIndex === i);
    const moduleDone = (i: number) => !!enrollment?.lessons.includes(i);
    const modulesDone = course.lessons.every((_, i) => moduleDone(i));
    const assignmentDone = !!enrollment && wordCount(enrollment.assignment) >= MIN_ASSIGNMENT_WORDS;
    const instructor = state.profiles.find((p) => p.id === course.ownerId)?.name ?? "PLP Academy faculty";
    const learners = state.enrollments.filter((e) => e.courseId === course.id).length;
    const progress = courseProgress(course, enrollment);
    const items: Item[] = course.lessons.flatMap((l, i) => {
        const prevDone = i === 0 || moduleDone(i - 1);
        const quiz = quizFor(i);
        return [
            { key: `reading-${i}`, label: l.title, detail: "Reading", icon: FileText, locked: !enrollment || !prevDone, done: !!enrollment?.viewed?.includes(i) || moduleDone(i) },
            ...(quiz ? [{ key: `quiz-${i}`, label: quiz.title, detail: `Graded quiz · ${quiz.questions.length} questions · ${quiz.minutes} min`, icon: ListChecks, locked: !enrollment || !prevDone || !enrollment.viewed?.includes(i), done: moduleDone(i) }] : []),
        ];
    });
    items.push({ key: "assignment", label: "Graded assignment", detail: `Written · at least ${MIN_ASSIGNMENT_WORDS} words`, icon: FileText, locked: !enrollment || !modulesDone, done: assignmentDone });
    if (exam)
        items.push({ key: "final", label: exam.title, detail: `${exam.questions.length} questions · ${exam.minutes} min · pass ${exam.passMark}%`, icon: GraduationCap, locked: !enrollment || !modulesDone || !assignmentDone, done: !!enrollment?.passed });
    const current = items.find((x) => x.key === item) ?? items[0];
    const enroll = () => update((s) => {
        if (!s.enrollments.some((e) => e.memberId === profile.id && e.courseId === course.id))
            s.enrollments.push({ memberId: profile.id, courseId: course.id, lessons: [], assignment: "", passed: false, viewed: [], attempts: [] });
    }) && (setTab("Modules"), setItem("reading-0"), toast.success(translateUi("Enrolled in {p0}", { p0: translateUi(course.title) })));
    const openItem = (x: Item) => {
        if (x.locked)
            return toast.error(translateUi(enrollment ? "Complete the previous step to unlock this item." : "Enroll to start this course."));
        if (enrollment?.active && x.key !== current.key)
            toast.warning(translateUi("You have an assessment in progress. Finish it before moving on."));
        setItem(x.key);
    };
    return (<div className="ac-page">
      <Link className="ac-back" to="/academy"><ArrowLeft size={16}/>{translateUi(" Back to the academy")}</Link>
      <section className="ac-hero">
        <div>
          <p className="ac-hero-kicker">{translateUi(course.category)}</p>
          <h1>{translateUi(course.title)}</h1>
          <p>{translateUi(course.summary)}</p>
          <div className="ac-hero-meta">
            <span><GraduationCap size={15}/>{translateUi(course.level)}</span>
            <span><Clock3 size={15}/>{translateUi(course.duration || "Self-paced")}</span>
            <span><BookOpen size={15}/>{translateUi(course.lessons.length)}{translateUi(" modules \u00B7 ")}{translateUi(assessments.length)}{translateUi(" graded assessments")}</span>
            <span><Users size={15}/>{translateUi(learners)}{translateUi(" enrolled")}</span>
          </div>
          <p className="ac-hero-instructor">{translateUi("Instructor: ")}<strong>{translateUi(instructor)}</strong></p>
        </div>
        <div className="ac-hero-card">
          {translateUi(enrollment ? (<>
              <Progress value={progress} label={translateUi(enrollment.completedAt ? "Completed" : "Your progress")}/>
              {translateUi(enrollment.completedAt
                ? <Link className="hub-button" to="/certificates"><Award size={16}/>{translateUi(" View certificate")}</Link>
                : <button className="hub-button" onClick={() => { setTab("Modules"); const next = items.find((x) => !x.done && !x.locked); if (next)
                    setItem(next.key); }}>{translateUi("Resume course ")}<ArrowRight size={16}/></button>)}
            </>) : (<>
              <p>{translateUi("Free for PLP members. Earn a verified certificate and 50 PLP credits when you pass every assessment.")}</p>
              <button className="hub-button" onClick={enroll}>{translateUi("Enroll in this course ")}<ArrowRight size={17}/></button>
            </>))}
        </div>
      </section>
      {translateUi(enrollment?.active && tab !== "Modules" && (<button className="ac-live-banner" onClick={() => setTab("Modules")}><Timer size={16}/>{translateUi(" An assessment is in progress. Return to it now \u2014 the timer keeps running.")}</button>))}
      <div className="ws-tabs" role="tablist" aria-label={translateUi("Course sections")}>
        {translateUi(["Overview", "Modules", "Grades"].map((t) => (<button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{translateUi(t)}</button>)))}
      </div>
      {translateUi(tab === "Overview" && (<div className="ac-overview">
          <Panel>
            <h2>{translateUi("What you'll learn")}</h2>
            <ul className="ac-outcomes">{translateUi(outcomesFor(course).map((o) => <li key={o}><CheckCircle2 size={17}/>{translateUi(o)}</li>))}</ul>
            <h2 className="hub-space">{translateUi("Skills you'll gain")}</h2>
            <div className="hub-tags">{translateUi(course.skills.map((s) => <Tag key={s}>{translateUi(s)}</Tag>))}</div>
            <h2 className="hub-space">{translateUi("Syllabus")}</h2>
            <ol className="ac-syllabus">
              {translateUi(course.lessons.map((l, i) => (<li key={i}><span>{translateUi("Module ")}{translateUi(i + 1)}</span><strong>{translateUi(l.title)}</strong><small>{translateUi("Reading")}{translateUi(quizFor(i) ? ` · ${quizFor(i)!.questions.length}-question timed quiz` : "")}</small></li>)))}
              <li><span>{translateUi("Assignment")}</span><strong>{translateUi("Graded written assignment")}</strong><small>{translateUi(course.assignment)}</small></li>
              {translateUi(exam && <li><span>{translateUi("Final")}</span><strong>{translateUi(exam.title)}</strong><small>{translateUi(exam.questions.length)}{translateUi(" questions \u00B7 ")}{translateUi(exam.minutes)}{translateUi(" minutes \u00B7 pass mark ")}{translateUi(exam.passMark)}{translateUi("%")}</small></li>)}
            </ol>
          </Panel>
          <Panel className="ac-rules">
            <h2><ShieldAlert size={18}/>{translateUi(" How you pass this course")}</h2>
            <ul>
              <li>{translateUi("Modules unlock in order. Read each module, then pass its knowledge check with at least 80%.")}</li>
              <li>{translateUi("Every quiz and exam is timed. The timer starts when you begin and cannot be paused; when it runs out your answers are submitted automatically.")}</li>
              <li>{translateUi("Quizzes and exams are proctored: your camera must stay on, the assessment opens in full screen, and you cannot leave the page until you submit. The camera feed is not recorded.")}</li>
              <li>{translateUi("Leaving the tab, leaving full screen or turning off the camera is recorded. After ")}{translateUi(MAX_FOCUS_LOSSES)}{translateUi(" departures your attempt is submitted.")}</li>
              <li>{translateUi("You have ")}{translateUi(exam?.maxAttempts ?? 3)}{translateUi(" attempts per assessment every ")}{translateUi(ATTEMPT_WINDOW_HOURS)}{translateUi(" hours.")}</li>
              <li>{translateUi("Submit the graded assignment (")}{translateUi(MIN_ASSIGNMENT_WORDS)}{translateUi("+ words) to unlock the final exam.")}</li>
              <li>{translateUi("The course is marked complete only when every assessment is passed. There is no manual \"mark as complete\".")}</li>
            </ul>
          </Panel>
        </div>))}
      {translateUi(tab === "Modules" && (<div className="ac-learn">
          <aside className="ac-outline" aria-label={translateUi("Course outline")}>
            {translateUi(course.lessons.map((_, i) => (<div key={i} className="ac-outline-module">
                <p>{translateUi("Module ")}{translateUi(i + 1)}{translateUi(moduleDone(i) && <CheckCircle2 size={14}/>)}</p>
                {translateUi(items.filter((x) => x.key.endsWith(`-${i}`)).map((x) => <OutlineItem key={x.key} item={x} active={current.key === x.key} onOpen={openItem}/>))}
              </div>)))}
            <div className="ac-outline-module">
              <p>{translateUi("Final assessment")}</p>
              {translateUi(items.filter((x) => x.key === "assignment" || x.key === "final").map((x) => <OutlineItem key={x.key} item={x} active={current.key === x.key} onOpen={openItem}/>))}
            </div>
          </aside>
          <div className="ac-stage">
            {translateUi(!enrollment ? (<Panel><h2>{translateUi("Enroll to begin")}</h2><p>{translateUi("Enroll to unlock module readings, quizzes, and the final exam.")}</p><button className="hub-button hub-space" onClick={enroll}>{translateUi("Enroll in this course ")}<ArrowRight size={17}/></button></Panel>) : current.locked ? (<Panel><h2><LockKeyhole size={18}/> {translateUi(current.label)}</h2><p>{translateUi("This item unlocks after you finish the previous step.")}</p></Panel>) : current.key.startsWith("reading-") ? (<Reading course={course} index={Number(current.key.split("-")[1])} onNext={(next) => setItem(next)} hasQuiz={!!quizFor(Number(current.key.split("-")[1]))}/>) : current.key === "assignment" ? (<Assignment course={course} enrollment={enrollment} onSubmitted={() => setItem("final")}/>) : (<AssessmentPanel course={course} enrollment={enrollment} assessment={assessments.find((a) => (current.key === "final" ? a.kind === "exam" : a.moduleIndex === Number(current.key.split("-")[1])))!}/>))}
            {translateUi(enrollment?.completedAt && (<div className="hub-success hub-space">
                <Award />
                <div>
                  <h3>{translateUi("You earned it.")}</h3>
                  <p>{translateUi("Every assessment is passed. Completion recorded on ")}{translateUi(enrollment.completedAt)}{translateUi(".")}</p>
                  <TextLink to="/certificates">{translateUi("View your certificate")}</TextLink>
                </div>
              </div>))}
          </div>
        </div>))}
      {translateUi(tab === "Grades" && <Grades course={course} enrollment={enrollment} assessments={assessments}/>)}
      {translateUi(enrollment && course.documents?.length ? (<Panel><h2>{translateUi("Course documents")}</h2>{translateUi(course.documents.map((d, i) => <p key={i}><a className="hub-text-link" href={d.data} download={d.name}>{translateUi(d.name)}</a></p>))}</Panel>) : null)}
    </div>);
}
export function OutlineItem({ item, active, onOpen }: {
    item: Item;
    active: boolean;
    onOpen: (x: Item) => void;
}) {
    useSiteLanguage();
    const Icon = item.icon;
    return (<button className={`ac-outline-item ${active ? "active" : ""} ${item.locked ? "locked" : ""}`} onClick={() => onOpen(item)} aria-current={active ? "step" : undefined}>
      {translateUi(item.done ? <CheckCircle2 size={17} className="ac-done"/> : item.locked ? <LockKeyhole size={17}/> : <Icon size={17}/>)}
      <span><strong>{translateUi(item.label)}</strong><small>{translateUi(item.detail)}</small></span>
    </button>);
}
function Reading({ course, index, hasQuiz, onNext }: {
    course: Course;
    index: number;
    hasQuiz: boolean;
    onNext: (key: string) => void;
}) {
    useSiteLanguage();
    const { profile, update } = useHub();
    const lesson = course.lessons[index];
    // Opening a reading records it; modules without a quiz are complete once read.
    useEffect(() => {
        update((s) => {
            const e = s.enrollments.find((x) => x.memberId === profile.id && x.courseId === course.id);
            if (!e)
                return;
            e.viewed = [...new Set([...(e.viewed ?? []), index])];
            if (!hasQuiz && !e.lessons.includes(index)) {
                e.lessons.push(index);
                completeCourse(s, profile.id, course.id);
            }
        });
    }, [course.id, index]);
    const next = hasQuiz ? `quiz-${index}` : index + 1 < course.lessons.length ? `reading-${index + 1}` : "assignment";
    return (<Panel>
      <p className="hub-eyebrow">{translateUi("MODULE ")}{translateUi(index + 1)}{translateUi(" OF ")}{translateUi(course.lessons.length)}{translateUi(" \u00B7 READING")}</p>
      <h2>{translateUi(lesson.title)}</h2>
      <p className="hub-lesson-copy">{translateUi(lesson.content)}</p>
      <div className="ac-reading-next">
        <p className="hub-caption">{translateUi(hasQuiz ? "Next: a timed knowledge check. You must score at least 80% to complete this module." : "This module has no quiz; reading it completes the module.")}</p>
        <button className="hub-button" onClick={() => onNext(next)}>{translateUi(hasQuiz ? "Go to knowledge check" : "Continue")} <ArrowRight size={16}/></button>
      </div>
    </Panel>);
}
function Assignment({ course, enrollment, onSubmitted }: {
    course: Course;
    enrollment: Enrollment;
    onSubmitted: () => void;
}) {
    useSiteLanguage();
    const { profile, update } = useHub();
    const [text, setText] = useState(enrollment.assignment);
    const words = wordCount(text);
    const locked = !!enrollment.passed;
    return (<Panel>
      <p className="hub-eyebrow">{translateUi("GRADED ASSIGNMENT")}</p>
      <h2>{translateUi("Put your learning into practice")}</h2>
      <p>{translateUi(course.assignment)}</p>
      <form className="hub-form hub-space" onSubmit={(e) => {
            e.preventDefault();
            if (words < MIN_ASSIGNMENT_WORDS)
                return toast.error(translateUi("Write at least {p0} words. You have {p1}.", { p0: translateUi(MIN_ASSIGNMENT_WORDS), p1: translateUi(words) }));
            if (update((s) => {
                const en = s.enrollments.find((x) => x.memberId === profile.id && x.courseId === course.id)!;
                en.assignment = text.trim();
                en.assignmentAt = new Date().toISOString();
                completeCourse(s, profile.id, course.id);
            })) {
                toast.success(translateUi("Assignment submitted. The final exam is now unlocked."));
                onSubmitted();
            }
        }}>
        <Field label={translateUi("Your response")}>
          <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={6000} rows={10} disabled={locked} placeholder={translateUi("Write a specific, honest response based on your own experience\u2026")}/>
        </Field>
        <p className={`ac-word-count ${words >= MIN_ASSIGNMENT_WORDS ? "ok" : ""}`}>{translateUi(words)}{translateUi(" / ")}{translateUi(MIN_ASSIGNMENT_WORDS)}{translateUi(" words minimum")}</p>
        {translateUi(locked ? <p className="hub-caption">{translateUi("Your assignment is locked because you have passed the final exam.")}</p> : <button className="hub-button" disabled={words < MIN_ASSIGNMENT_WORDS}>{translateUi(enrollment.assignmentAt ? "Resubmit assignment" : "Submit assignment")}</button>)}
        {translateUi(enrollment.assignmentAt && <p className="hub-caption">{translateUi("Last submitted ")}{translateUi(new Date(enrollment.assignmentAt).toLocaleString())}</p>)}
      </form>
    </Panel>);
}
function AssessmentPanel({ course, enrollment, assessment }: {
    course: Course;
    enrollment: Enrollment;
    assessment: Assessment;
}) {
    useSiteLanguage();
    const { profile, update } = useHub();
    const [now, setNow] = useState(Date.now());
    const active = enrollment.active?.assessmentId === assessment.id ? enrollment.active : undefined;
    const otherActive = enrollment.active && !active;
    const attempts = attemptsFor(enrollment, assessment.id);
    const passed = hasPassed(enrollment, assessment.id);
    const lockedUntil = nextAttemptAt(enrollment, assessment, now);
    const last = attempts.at(-1);
    const remaining = active ? Date.parse(active.endsAt) - now : 0;
    const submit = (reason: AssessmentAttempt["reason"]) => {
        proctor.end();
        let result: AssessmentAttempt | undefined;
        update((s) => { result = finishAttempt(s, profile.id, course.id, reason); });
        if (!result)
            return undefined;
        if (result.passed)
            toast.success(translateUi("Passed with {p0}%.", { p0: translateUi(result.percent) }));
        else
            toast.error(translateUi("{p0}% \u2014 the pass mark is {p1}%.", { p0: translateUi(result.percent), p1: translateUi(assessment.passMark) }));
        return result;
    };
    useEffect(() => {
        if (!active)
            return;
        const tick = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(tick);
    }, [active?.startedAt]);
    useEffect(() => {
        if (active && remaining <= 0 && submit("time"))
            toast.error(translateUi("Time is up. Your answers were submitted automatically."));
    }, [active && remaining <= 0]);
    // Leaving the tab, leaving full screen and turning the camera off all count towards the same limit.
    const depart = (reason: Departure) => {
        let losses = 0;
        update((s) => {
            const e = s.enrollments.find((x) => x.memberId === profile.id && x.courseId === course.id);
            if (e?.active)
                losses = ++e.active.focusLosses;
        });
        if (!losses)
            return;
        if (losses >= MAX_FOCUS_LOSSES) {
            if (submit("focus"))
                toast.error(translateUi("Too many departures from the assessment. It was submitted."));
        }
        else
            toast.warning(translateUi("{p0} ({p1}/{p2}). Stay on this page, in full screen, with your camera on.", { p0: translateUi(departureLabel[reason]), p1: translateUi(losses), p2: translateUi(MAX_FOCUS_LOSSES) }));
    };
    const proctor = useProctoring(!!active, depart);
    useEffect(() => {
        if (!active)
            return;
        const onHide = () => { if (document.visibilityState === "hidden")
            depart("tab"); };
        document.addEventListener("visibilitychange", onHide);
        return () => document.removeEventListener("visibilitychange", onHide);
    }, [active?.startedAt]);
    const start = async () => {
        if (!await confirmAction({
            title: `Start ${assessment.title.toLowerCase()}?`,
            description: `You will have ${assessment.minutes} minutes for ${assessment.questions.length} questions. Your camera must stay on and the assessment opens in full screen. The timer cannot be paused, you cannot leave the page, and leaving full screen or this tab is recorded.`,
            confirmLabel: "Turn on camera & start",
        }))
            return;
        let stream: MediaStream;
        try {
            stream = await startProctoring();
        }
        catch (e) {
            toast.error(translateUi((e as Error).message));
            return;
        }
        proctor.attach(stream);
        update((s) => {
            const e = s.enrollments.find((x) => x.memberId === profile.id && x.courseId === course.id);
            if (!e || e.active)
                return;
            const startedAt = new Date();
            e.active = { assessmentId: assessment.id, startedAt: startedAt.toISOString(), endsAt: new Date(startedAt.getTime() + assessment.minutes * 60000).toISOString(), order: shuffle(assessment.questions.map((x) => x.id)), answers: {}, focusLosses: 0 };
        });
        setNow(Date.now());
    };
    if (active) {
        const questions = active.order.map((qid) => assessment.questions.find((x) => x.id === qid)!).filter(Boolean);
        const answered = questions.filter((x) => active.answers[x.id] !== undefined).length;
        if (!proctor.stream)
            return <Panel className="ac-exam"><div className={`ac-timer ${remaining < 60000 ? "urgent" : ""}`} role="timer"><div><strong>{translateUi(assessment.title)}</strong><small>{translateUi("Camera off")}</small></div><span><Timer size={18}/> {translateUi(formatClock(remaining))}</span></div><CameraRequired onEnable={async () => proctor.attach(await startProctoring())}/></Panel>;
        return (<Panel className="ac-exam">
        <ProctorCamera stream={proctor.stream}/>
        <div className={`ac-timer ${remaining < 60000 ? "urgent" : ""}`} role="timer" aria-live="off">
          <div><strong>{translateUi(assessment.title)}</strong><small>{translateUi(answered)}{translateUi(" of ")}{translateUi(questions.length)}{translateUi(" answered \u00B7 ")}{translateUi(active.focusLosses)}{translateUi("/")}{translateUi(MAX_FOCUS_LOSSES)}{translateUi(" departures \u00B7 camera on")}</small></div>
          <span><Timer size={18}/> {translateUi(formatClock(remaining))}</span>
        </div>
        <form className="hub-form" onSubmit={async (e) => {
                e.preventDefault();
                if (answered < questions.length && !await confirmAction({ title: "Submit with unanswered questions?", description: `${questions.length - answered} question(s) are unanswered and will be marked incorrect.`, confirmLabel: "Submit anyway", destructive: true }))
                    return;
                submit("submitted");
            }}>
          {translateUi(questions.map((x, n) => (<fieldset key={x.id} className="ac-question">
              <legend><span>{translateUi("Question ")}{translateUi(n + 1)}</span>{translateUi(x.prompt)}</legend>
              {translateUi(x.options.map((o, i) => (<label className="hub-radio" key={i}>
                  <input type="radio" name={x.id} checked={active.answers[x.id] === i} onChange={() => update((s) => {
                        const en = s.enrollments.find((y) => y.memberId === profile.id && y.courseId === course.id);
                        if (en?.active?.assessmentId === assessment.id && Date.parse(en.active.endsAt) > Date.now())
                            en.active.answers[x.id] = i;
                    })}/>
                  {translateUi(o)}
                </label>)))}
            </fieldset>)))}
          <button className="hub-button">{translateUi("Submit ")}{translateUi(assessment.kind === "exam" ? "exam" : "quiz")}</button>
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
        <div><ShieldAlert size={18}/><strong>{translateUi(passed ? "—" : lockedUntil ? 0 : assessment.maxAttempts - attempts.filter((a) => !a.passed && now - Date.parse(a.submittedAt) < ATTEMPT_WINDOW_HOURS * 3600000).length)}</strong><span>{translateUi("attempts left")}</span></div>
      </div>
      {translateUi(last && (<div className={`ac-result ${last.passed ? "pass" : "fail"}`}>
          {translateUi(last.passed ? <CheckCircle2 /> : <XCircle />)}
          <div>
            <strong>{translateUi("Latest attempt: ")}{translateUi(last.percent)}{translateUi("% (")}{translateUi(last.score)}{translateUi("/")}{translateUi(last.total)}{translateUi(") \u00B7 ")}{translateUi(last.passed ? "Passed" : "Not passed")}</strong>
            <small>{translateUi("Submitted ")}{translateUi(new Date(last.submittedAt).toLocaleString())}{translateUi(last.reason === "time" ? " · time expired" : last.reason === "focus" ? " · submitted after leaving the tab" : "")}</small>
            {translateUi(assessment.kind === "quiz" && <p>{translateUi(last.results.map((ok, i) => <span key={i} className={ok ? "ok" : "no"}>{translateUi("Q")}{translateUi(i + 1)} {translateUi(ok ? "correct" : "incorrect")}</span>))}</p>)}
            {translateUi(assessment.kind === "exam" && !last.passed && <p className="hub-caption">{translateUi("Exam answers are not revealed. Review the modules before your next attempt.")}</p>)}
          </div>
        </div>))}
      {translateUi(passed ? (<p className="hub-feedback">{translateUi("You passed this assessment. Best score: ")}{translateUi(bestAttempt(enrollment, assessment.id)?.percent)}{translateUi("%.")}</p>) : otherActive ? (<p className="hub-feedback">{translateUi("Finish your other open assessment before starting this one.")}</p>) : lockedUntil ? (<p className="hub-feedback">{translateUi("You have used all ")}{translateUi(assessment.maxAttempts)}{translateUi(" attempts. Your next attempt opens ")}{translateUi(lockedUntil.toLocaleString())}{translateUi(".")}</p>) : (<button className="hub-button hub-space" onClick={() => void start()}><Timer size={16}/> {translateUi(attempts.length ? "Retake" : "Start")} {translateUi(assessment.kind === "exam" ? "exam" : "quiz")}</button>))}
    </Panel>);
}
function Grades({ course, enrollment, assessments }: {
    course: Course;
    enrollment?: Enrollment;
    assessments: Assessment[];
}) {
    useSiteLanguage();
    if (!enrollment)
        return <Empty>{translateUi("Enroll to see your grades.")}</Empty>;
    return (<Panel>
      <div className="ws-panel-title"><h2>{translateUi("Grades")}</h2><span className="ws-pill">{translateUi(enrollment.completedAt ? `Completed ${enrollment.completedAt}` : "In progress")}</span></div>
      <div className="ws-table-wrap">
        <table className="ws-table">
          <thead><tr><th>{translateUi("Item")}</th><th>{translateUi("Status")}</th><th>{translateUi("Best score")}</th><th>{translateUi("Pass mark")}</th><th>{translateUi("Attempts")}</th></tr></thead>
          <tbody>
            {translateUi(assessments.filter((a) => a.kind === "quiz").map((a) => {
            const best = bestAttempt(enrollment, a.id);
            return <tr key={a.id}><td><strong>{translateUi(a.title)}</strong><small>{translateUi(course.lessons[a.moduleIndex!]?.title)}</small></td><td>{translateUi(hasPassed(enrollment, a.id) ? "Passed" : best ? "Not passed" : "Not started")}</td><td>{translateUi(best ? `${best.percent}%` : "—")}</td><td>{translateUi(a.passMark)}{translateUi("%")}</td><td>{translateUi(attemptsFor(enrollment, a.id).length)}</td></tr>;
        }))}
            <tr><td><strong>{translateUi("Graded assignment")}</strong><small>{translateUi("At least ")}{translateUi(MIN_ASSIGNMENT_WORDS)}{translateUi(" words")}</small></td><td>{translateUi(enrollment.assignmentAt || wordCount(enrollment.assignment) >= MIN_ASSIGNMENT_WORDS ? "Submitted" : "Not submitted")}</td><td>{translateUi("\u2014")}</td><td>{translateUi(MIN_ASSIGNMENT_WORDS)}{translateUi(" words")}</td><td>{translateUi("\u2014")}</td></tr>
            {translateUi(assessments.filter((a) => a.kind === "exam").map((a) => {
            const best = bestAttempt(enrollment, a.id);
            return <tr key={a.id}><td><strong>{translateUi(a.title)}</strong><small>{translateUi(a.questions.length)}{translateUi(" questions \u00B7 ")}{translateUi(a.minutes)}{translateUi(" min")}</small></td><td>{translateUi(hasPassed(enrollment, a.id) || enrollment.passed ? "Passed" : best ? "Not passed" : "Not started")}</td><td>{translateUi(best ? `${best.percent}%` : "—")}</td><td>{translateUi(a.passMark)}{translateUi("%")}</td><td>{translateUi(attemptsFor(enrollment, a.id).length)}</td></tr>;
        }))}
          </tbody>
        </table>
      </div>
    </Panel>);
}
export function AlxPage() {
    useSiteLanguage();
    const { state, profile } = useHub();
    const [busy, setBusy] = useState(false);
    const [uploading, setUploading] = useState<(typeof alxPrograms)[number] | null>(null);
    const statusOf = (id: string) => state.proofs.find((p) => p.memberId === profile.id && p.programId === id);
    return (<div className="ws-page">
      <Heading title={translateUi("ALX learning zone")} description={translateUi("Take a programme on ALX, then upload your completion certificate here. PLP recognises it straight away.")} action={<a className="hub-button secondary" href="https://www.alxafrica.com/" target="_blank" rel="noreferrer">{translateUi("Visit ALX \u2197")}</a>}/>
      <div className="alx-grid">
        {translateUi(alxPrograms.map((program) => {
            const proof = statusOf(program.id);
            const recognised = proof?.status === "Recognized";
            return (<article className="alx-card" key={program.id}>
              <div className="alx-top">
                <span className="alx-focus">{translateUi(program.focus)}</span>
                <span className={`alx-status${recognised ? " done" : proof?.status === "Returned" ? " review" : ""}`}>{translateUi(recognised ? "Recognised" : proof?.status === "Returned" ? "Revoked" : proof?.file ? "Processing" : "Not submitted")}</span>
              </div>
              <h2>{translateUi(program.title)}</h2>
              <p>{translateUi(program.description)}</p>
              <footer>
                <a className="hub-text-link" href={program.url} target="_blank" rel="noreferrer">{translateUi("Open on ALX \u2197")}</a>
                {translateUi(!recognised && <button className="hub-button secondary" onClick={() => setUploading(program)}>{translateUi(proof?.file ? "Replace" : "Upload certificate")}</button>)}
              </footer>
            </article>);
        }))}
      </div>
      {translateUi(uploading && (<FormModal title={translateUi("Upload certificate: {p0}", { p0: translateUi(uploading.title) })} description={translateUi("PDF, PNG or JPG, up to 1.5 MB. It is recognised as soon as it uploads; PLP may revoke certificates that are not genuine.")} onClose={() => setUploading(null)}>
          <form className="hub-form" onSubmit={async (e) => {
                e.preventDefault();
                const file = new FormData(e.currentTarget).get("proof") as File;
                if (!file?.size)
                    return void toast.error(translateUi("Choose your ALX completion certificate."));
                if (file.size > 1500000)
                    return void toast.error(translateUi("Choose a PDF or image smaller than 1.5 MB."));
                if (!["application/pdf", "image/png", "image/jpeg"].includes(file.type))
                    return void toast.error(translateUi("Use a PDF, PNG, or JPG."));
                setBusy(true);
                try {
                    // Evidence is stored on the platform so administrators can review it from any device.
                    const attachment = await uploadFile(file);
                    const previous = statusOf(uploading.id);
                    await saveRecord("proofs", { title: uploading.title, category: uploading.id, description: file.name, attachments: [attachment] });
                    if (previous && previous.status !== "Recognized" && previous.version)
                        await deleteRecord("proofs", previous.id).catch(() => { });
                    toast.success(translateUi("Certificate uploaded and recognised"));
                    setUploading(null);
                }
                catch (err) {
                    toast.error(translateUi((err as Error).message || "Could not read this file. Please try another."));
                }
                finally {
                    setBusy(false);
                }
            }}>
            <Field label={translateUi("Completion certificate")}><input name="proof" required type="file" accept="application/pdf,image/png,image/jpeg"/></Field>
            <div className="hub-actions hub-dialog-actions">
              <button type="button" className="hub-button secondary" onClick={() => setUploading(null)}>{translateUi("Cancel")}</button>
              <button className="hub-button" disabled={busy}>{translateUi(busy ? "Uploading…" : "Submit certificate")}</button>
            </div>
          </form>
        </FormModal>))}
    </div>);
}
