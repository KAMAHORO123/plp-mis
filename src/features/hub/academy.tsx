import { platformApi } from "./platform-api";
import { useLiveTick } from './live';
import { PlatformCoursePage, isPlatformId } from "./platform-course";
import type { TeachingData } from "./teaching-types";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  CircleDot,
  Clock3,
  FileText,
  GraduationCap,
  ListChecks,
  LockKeyhole,
  ShieldAlert,
  Timer,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { confirmAction } from "@/components/shared/confirm-dialog";
import { categories, alxPrograms, type Course } from "./data";
import { useHub, completeCourse, finishAttempt, type Enrollment } from "./store";
import {
  assessmentsFor,
  attemptsFor,
  bestAttempt,
  hasPassed,
  nextAttemptAt,
  outcomesFor,
  shuffle,
  wordCount,
  ATTEMPT_WINDOW_HOURS,
  MAX_FOCUS_LOSSES,
  MIN_ASSIGNMENT_WORDS,
  type Assessment,
  type AssessmentAttempt,
} from "./assessments";
import { Empty, Field, Heading, Panel, Progress, SearchBox, Tag, TextLink } from "./ui";
import "./academy.css";
import { FormModal } from "./modal";
import { uploadFile } from "./platform-api";
import { deleteRecord, saveRecord } from "./platform-records";
import { CameraRequired, ProctorCamera, departureLabel, startProctoring, useProctoring, type Departure } from "./proctoring";

/** Share of required steps (module checks, assignment, final exam) the learner has finished. */
function courseProgress(course: Course, e?: Enrollment) {
  if (!e) return 0;
  if (e.completedAt) return 100;
  const steps = course.lessons.length + 2;
  const done = e.lessons.length + (e.assignmentAt || e.assignment ? 1 : 0) + (e.passed ? 1 : 0);
  return Math.min(99, Math.round((done / steps) * 100));
}
export const formatClock = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

export function AcademyPage() {
  const { state, profile } = useHub();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("All levels");
  const [view, setView] = useState("All courses");
  const category = params.get("category") || "All pathways";
  const [platformCourses,setPlatformCourses]=useState<Course[]>([]);
  const [platformEnrollments,setPlatformEnrollments]=useState<Enrollment[]>([]);
  const live=useLiveTick();
  useEffect(()=>{
    let active=true;
    // Trainer-built courses and their enrolments live on the platform API; quiz fields arrive without answers.
    platformApi<{id:string;owner_id:string;data:TeachingData}[]>("/records/courses").then(rows=>{if(active)setPlatformCourses(rows.filter(r=>r.data.published).map(r=>({id:r.id,title:r.data.title,category:r.data.category||"Leadership Development",summary:r.data.description,level:r.data.level||"Beginner",duration:r.data.duration||"Self-paced",skills:r.data.skills||[],outcomes:r.data.outcomes,lessons:(r.data.lessons||[]).map(l=>({title:l.title,content:l.content})),assignment:r.data.assignment||"",question:"",options:[],answer:0,published:true,ownerId:r.owner_id})));}).catch(()=>{});
    platformApi<{course_id:string;lessons:number[];assignment:string;passed:boolean;completed_at:string|null}[]>("/enrollments").then(rows=>{if(active)setPlatformEnrollments(rows.map(e=>({memberId:profile.id,courseId:e.course_id,lessons:e.lessons,assignment:e.assignment,passed:e.passed,completedAt:e.completed_at??undefined})));}).catch(()=>{});
    return()=>{active=false;};
  },[profile.id,live]);
  const published = [...platformCourses,...state.courses.filter(c=>c.published&&!platformCourses.some(r=>r.id===c.id))];
  const mine = [...platformEnrollments,...state.enrollments.filter((e) => e.memberId === profile.id)];
  const list = published.filter((c) => {
    const e = mine.find((x) => x.courseId === c.id);
    return (
      (category === "All pathways" || c.category === category) &&
      (level === "All levels" || c.level === level) &&
      `${c.title} ${c.summary} ${c.skills.join(" ")}`.toLowerCase().includes(search.toLowerCase()) &&
      (view === "All courses" || (view === "In progress" ? e && !e.completedAt : !!e?.completedAt))
    );
  });
  const resume = mine
    .filter((e) => !e.completedAt)
    .map((e) => ({ e, c: published.find((c) => c.id === e.courseId) }))
    .find((x) => x.c);
  return (
    <div className="ac-page">
      <Heading
        eyebrow="PLP LEARNING ACADEMY"
        title="Learn skills that open doors."
        description="Structured courses with readings, timed knowledge checks, a graded assignment, and a final exam. Certificates are issued only when every assessment is passed."
      />
      {resume?.c && (
        <Link to={`/academy/${resume.c.id}`} className="ac-resume">
          <span className="ac-resume-icon"><BookOpen size={20} /></span>
          <div>
            <small>Continue where you left off</small>
            <strong>{resume.c.title}</strong>
            <Progress value={courseProgress(resume.c, resume.e)} label="Course progress" />
          </div>
          <span className="hub-button">Resume <ArrowRight size={16} /></span>
        </Link>
      )}
      <div className="ac-filters">
        <SearchBox value={search} onChange={setSearch} placeholder="Search courses or skills" />
        <select aria-label="Course level" value={level} onChange={(e) => setLevel(e.target.value)}>
          {["All levels", "Beginner", "Intermediate", "Advanced"].map((l) => <option key={l}>{l}</option>)}
        </select>
        <div className="ws-tabs ac-view-tabs" role="tablist" aria-label="My learning">
          {["All courses", "In progress", "Completed"].map((v) => (
            <button key={v} role="tab" aria-selected={view === v} className={view === v ? "active" : ""} onClick={() => setView(v)}>{v}</button>
          ))}
        </div>
      </div>
      <div className="hub-chips" aria-label="Learning categories">
        {["All pathways", ...categories].map((c) => (
          <button className={c === category ? "active" : ""} key={c} onClick={() => setParams(c === "All pathways" ? {} : { category: c })}>{c}</button>
        ))}
      </div>
      <div className="ac-grid">
        {list.map((c) => {
          const i = published.indexOf(c);
          const e = mine.find((x) => x.courseId === c.id);
          const learners = state.enrollments.filter((x) => x.courseId === c.id).length;
          return (
            <Link className="ac-card" key={c.id} to={`/academy/${c.id}`}>
              <div className={`ac-card-art tone-${i % 5}`}>
                <GraduationCap aria-hidden="true" />
                <span>PLP ACADEMY</span>
                <small>{c.category}</small>
              </div>
              <div className="ac-card-body">
                <div className="hub-row">
                  <Tag>{c.level}</Tag>
                  {e?.completedAt ? <span className="ac-badge ok"><CheckCircle2 size={14} /> Completed</span> : e ? <span className="ac-badge">In progress</span> : null}
                </div>
                <h2>{c.title}</h2>
                <p>{c.summary}</p>
                <p className="ac-skills"><strong>Skills you'll gain:</strong> {c.skills.join(", ") || "—"}</p>
                <div className="ac-meta">
                  <span><Clock3 size={14} />{c.duration || "Self-paced"}</span>
                  <span><BookOpen size={14} />{c.lessons.length} modules</span>
                  <span><Users size={14} />{learners} enrolled</span>
                </div>
                {e && <Progress value={courseProgress(c, e)} />}
              </div>
            </Link>
          );
        })}
      </div>
      {!list.length && <Empty>No courses match. Try another pathway, level, or clear your search.</Empty>}
    </div>
  );
}

export type Item = { key: string; label: string; detail: string; icon: typeof BookOpen; locked: boolean; done: boolean };

export function CoursePage() {
 const {id}=useParams();
 const {state}=useHub();
 return id&&isPlatformId(id)&&!state.courses.some(c=>c.id===id)?<PlatformCoursePage/>:<LocalCoursePage/>;
}
function LocalCoursePage() {
  const { id } = useParams();
  const { state, profile, update } = useHub();
  const course = state.courses.find((c) => c.id === id && c.published);
  const enrollment = state.enrollments.find((e) => e.courseId === id && e.memberId === profile.id);
  const [tab, setTab] = useState("Overview");
  const [item, setItem] = useState("reading-0");
  // An attempt whose time ran out while the learner was away is graded on return.
  useEffect(() => {
    if (!course || !enrollment?.active || Date.parse(enrollment.active.endsAt) > Date.now()) return;
    let graded = false;
    update((s) => { graded = !!finishAttempt(s, profile.id, course.id, "time"); });
    if (graded) toast.error("Time expired on your open assessment. It was submitted automatically.");
  }, [course?.id, enrollment?.active?.endsAt]);
  useEffect(() => {
    if (enrollment?.active) { setTab("Modules"); setItem(enrollment.active.assessmentId === "final" ? "final" : `quiz-${enrollment.active.assessmentId.split("-")[1]}`); }
  }, [enrollment?.active?.assessmentId]);
  if (!course)
    return <Empty>Course not found. <TextLink to="/academy">Back to academy</TextLink></Empty>;
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
  if (exam) items.push({ key: "final", label: exam.title, detail: `${exam.questions.length} questions · ${exam.minutes} min · pass ${exam.passMark}%`, icon: GraduationCap, locked: !enrollment || !modulesDone || !assignmentDone, done: !!enrollment?.passed });
  const current = items.find((x) => x.key === item) ?? items[0];
  const enroll = () => update((s) => {
    if (!s.enrollments.some((e) => e.memberId === profile.id && e.courseId === course.id))
      s.enrollments.push({ memberId: profile.id, courseId: course.id, lessons: [], assignment: "", passed: false, viewed: [], attempts: [] });
  }) && (setTab("Modules"), setItem("reading-0"), toast.success(`Enrolled in ${course.title}`));
  const openItem = (x: Item) => {
    if (x.locked) return toast.error(enrollment ? "Complete the previous step to unlock this item." : "Enroll to start this course.");
    if (enrollment?.active && x.key !== current.key) toast.warning("You have an assessment in progress. Finish it before moving on.");
    setItem(x.key);
  };
  return (
    <div className="ac-page">
      <Link className="ac-back" to="/academy"><ArrowLeft size={16} /> Back to the academy</Link>
      <section className="ac-hero">
        <div>
          <p className="ac-hero-kicker">{course.category}</p>
          <h1>{course.title}</h1>
          <p>{course.summary}</p>
          <div className="ac-hero-meta">
            <span><GraduationCap size={15} />{course.level}</span>
            <span><Clock3 size={15} />{course.duration || "Self-paced"}</span>
            <span><BookOpen size={15} />{course.lessons.length} modules · {assessments.length} graded assessments</span>
            <span><Users size={15} />{learners} enrolled</span>
          </div>
          <p className="ac-hero-instructor">Instructor: <strong>{instructor}</strong></p>
        </div>
        <div className="ac-hero-card">
          {enrollment ? (
            <>
              <Progress value={progress} label={enrollment.completedAt ? "Completed" : "Your progress"} />
              {enrollment.completedAt
                ? <Link className="hub-button" to="/certificates"><Award size={16} /> View certificate</Link>
                : <button className="hub-button" onClick={() => { setTab("Modules"); const next = items.find((x) => !x.done && !x.locked); if (next) setItem(next.key); }}>Resume course <ArrowRight size={16} /></button>}
            </>
          ) : (
            <>
              <p>Free for PLP members. Earn a verified certificate and 50 PLP credits when you pass every assessment.</p>
              <button className="hub-button" onClick={enroll}>Enroll in this course <ArrowRight size={17} /></button>
            </>
          )}
        </div>
      </section>
      {enrollment?.active && tab !== "Modules" && (
        <button className="ac-live-banner" onClick={() => setTab("Modules")}><Timer size={16} /> An assessment is in progress. Return to it now — the timer keeps running.</button>
      )}
      <div className="ws-tabs" role="tablist" aria-label="Course sections">
        {["Overview", "Modules", "Grades"].map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === "Overview" && (
        <div className="ac-overview">
          <Panel>
            <h2>What you'll learn</h2>
            <ul className="ac-outcomes">{outcomesFor(course).map((o) => <li key={o}><CheckCircle2 size={17} />{o}</li>)}</ul>
            <h2 className="hub-space">Skills you'll gain</h2>
            <div className="hub-tags">{course.skills.map((s) => <Tag key={s}>{s}</Tag>)}</div>
            <h2 className="hub-space">Syllabus</h2>
            <ol className="ac-syllabus">
              {course.lessons.map((l, i) => (
                <li key={i}><span>Module {i + 1}</span><strong>{l.title}</strong><small>Reading{quizFor(i) ? ` · ${quizFor(i)!.questions.length}-question timed quiz` : ""}</small></li>
              ))}
              <li><span>Assignment</span><strong>Graded written assignment</strong><small>{course.assignment}</small></li>
              {exam && <li><span>Final</span><strong>{exam.title}</strong><small>{exam.questions.length} questions · {exam.minutes} minutes · pass mark {exam.passMark}%</small></li>}
            </ol>
          </Panel>
          <Panel className="ac-rules">
            <h2><ShieldAlert size={18} /> How you pass this course</h2>
            <ul>
              <li>Modules unlock in order. Read each module, then pass its knowledge check with at least 80%.</li>
              <li>Every quiz and exam is timed. The timer starts when you begin and cannot be paused; when it runs out your answers are submitted automatically.</li>
              <li>Quizzes and exams are proctored: your camera must stay on, the assessment opens in full screen, and you cannot leave the page until you submit. The camera feed is not recorded.</li>
              <li>Leaving the tab, leaving full screen or turning off the camera is recorded. After {MAX_FOCUS_LOSSES} departures your attempt is submitted.</li>
              <li>You have {exam?.maxAttempts ?? 3} attempts per assessment every {ATTEMPT_WINDOW_HOURS} hours.</li>
              <li>Submit the graded assignment ({MIN_ASSIGNMENT_WORDS}+ words) to unlock the final exam.</li>
              <li>The course is marked complete only when every assessment is passed. There is no manual "mark as complete".</li>
            </ul>
          </Panel>
        </div>
      )}
      {tab === "Modules" && (
        <div className="ac-learn">
          <aside className="ac-outline" aria-label="Course outline">
            {course.lessons.map((_, i) => (
              <div key={i} className="ac-outline-module">
                <p>Module {i + 1}{moduleDone(i) && <CheckCircle2 size={14} />}</p>
                {items.filter((x) => x.key.endsWith(`-${i}`)).map((x) => <OutlineItem key={x.key} item={x} active={current.key === x.key} onOpen={openItem} />)}
              </div>
            ))}
            <div className="ac-outline-module">
              <p>Final assessment</p>
              {items.filter((x) => x.key === "assignment" || x.key === "final").map((x) => <OutlineItem key={x.key} item={x} active={current.key === x.key} onOpen={openItem} />)}
            </div>
          </aside>
          <div className="ac-stage">
            {!enrollment ? (
              <Panel><h2>Enroll to begin</h2><p>Enroll to unlock module readings, quizzes, and the final exam.</p><button className="hub-button hub-space" onClick={enroll}>Enroll in this course <ArrowRight size={17} /></button></Panel>
            ) : current.locked ? (
              <Panel><h2><LockKeyhole size={18} /> {current.label}</h2><p>This item unlocks after you finish the previous step.</p></Panel>
            ) : current.key.startsWith("reading-") ? (
              <Reading course={course} index={Number(current.key.split("-")[1])} onNext={(next) => setItem(next)} hasQuiz={!!quizFor(Number(current.key.split("-")[1]))} />
            ) : current.key === "assignment" ? (
              <Assignment course={course} enrollment={enrollment} onSubmitted={() => setItem("final")} />
            ) : (
              <AssessmentPanel course={course} enrollment={enrollment} assessment={assessments.find((a) => (current.key === "final" ? a.kind === "exam" : a.moduleIndex === Number(current.key.split("-")[1])))!} />
            )}
            {enrollment?.completedAt && (
              <div className="hub-success hub-space">
                <Award />
                <div>
                  <h3>You earned it.</h3>
                  <p>Every assessment is passed. Completion recorded on {enrollment.completedAt}.</p>
                  <TextLink to="/certificates">View your certificate</TextLink>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {tab === "Grades" && <Grades course={course} enrollment={enrollment} assessments={assessments} />}
      {enrollment && course.documents?.length ? (
        <Panel><h2>Course documents</h2>{course.documents.map((d, i) => <p key={i}><a className="hub-text-link" href={d.data} download={d.name}>{d.name}</a></p>)}</Panel>
      ) : null}
    </div>
  );
}

export function OutlineItem({ item, active, onOpen }: { item: Item; active: boolean; onOpen: (x: Item) => void }) {
  const Icon = item.icon;
  return (
    <button className={`ac-outline-item ${active ? "active" : ""} ${item.locked ? "locked" : ""}`} onClick={() => onOpen(item)} aria-current={active ? "step" : undefined}>
      {item.done ? <CheckCircle2 size={17} className="ac-done" /> : item.locked ? <LockKeyhole size={17} /> : <Icon size={17} />}
      <span><strong>{item.label}</strong><small>{item.detail}</small></span>
    </button>
  );
}

function Reading({ course, index, hasQuiz, onNext }: { course: Course; index: number; hasQuiz: boolean; onNext: (key: string) => void }) {
  const { profile, update } = useHub();
  const lesson = course.lessons[index];
  // Opening a reading records it; modules without a quiz are complete once read.
  useEffect(() => {
    update((s) => {
      const e = s.enrollments.find((x) => x.memberId === profile.id && x.courseId === course.id);
      if (!e) return;
      e.viewed = [...new Set([...(e.viewed ?? []), index])];
      if (!hasQuiz && !e.lessons.includes(index)) { e.lessons.push(index); completeCourse(s, profile.id, course.id); }
    });
  }, [course.id, index]);
  const next = hasQuiz ? `quiz-${index}` : index + 1 < course.lessons.length ? `reading-${index + 1}` : "assignment";
  return (
    <Panel>
      <p className="hub-eyebrow">MODULE {index + 1} OF {course.lessons.length} · READING</p>
      <h2>{lesson.title}</h2>
      <p className="hub-lesson-copy">{lesson.content}</p>
      <div className="ac-reading-next">
        <p className="hub-caption">{hasQuiz ? "Next: a timed knowledge check. You must score at least 80% to complete this module." : "This module has no quiz; reading it completes the module."}</p>
        <button className="hub-button" onClick={() => onNext(next)}>{hasQuiz ? "Go to knowledge check" : "Continue"} <ArrowRight size={16} /></button>
      </div>
    </Panel>
  );
}

function Assignment({ course, enrollment, onSubmitted }: { course: Course; enrollment: Enrollment; onSubmitted: () => void }) {
  const { profile, update } = useHub();
  const [text, setText] = useState(enrollment.assignment);
  const words = wordCount(text);
  const locked = !!enrollment.passed;
  return (
    <Panel>
      <p className="hub-eyebrow">GRADED ASSIGNMENT</p>
      <h2>Put your learning into practice</h2>
      <p>{course.assignment}</p>
      <form className="hub-form hub-space" onSubmit={(e) => {
        e.preventDefault();
        if (words < MIN_ASSIGNMENT_WORDS) return toast.error(`Write at least ${MIN_ASSIGNMENT_WORDS} words. You have ${words}.`);
        if (update((s) => {
          const en = s.enrollments.find((x) => x.memberId === profile.id && x.courseId === course.id)!;
          en.assignment = text.trim();
          en.assignmentAt = new Date().toISOString();
          completeCourse(s, profile.id, course.id);
        })) { toast.success("Assignment submitted. The final exam is now unlocked."); onSubmitted(); }
      }}>
        <Field label="Your response">
          <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={6000} rows={10} disabled={locked} placeholder="Write a specific, honest response based on your own experience…" />
        </Field>
        <p className={`ac-word-count ${words >= MIN_ASSIGNMENT_WORDS ? "ok" : ""}`}>{words} / {MIN_ASSIGNMENT_WORDS} words minimum</p>
        {locked ? <p className="hub-caption">Your assignment is locked because you have passed the final exam.</p> : <button className="hub-button" disabled={words < MIN_ASSIGNMENT_WORDS}>{enrollment.assignmentAt ? "Resubmit assignment" : "Submit assignment"}</button>}
        {enrollment.assignmentAt && <p className="hub-caption">Last submitted {new Date(enrollment.assignmentAt).toLocaleString()}</p>}
      </form>
    </Panel>
  );
}

function AssessmentPanel({ course, enrollment, assessment }: { course: Course; enrollment: Enrollment; assessment: Assessment }) {
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
    if (!result) return undefined;
    if (result.passed) toast.success(`Passed with ${result.percent}%.`);
    else toast.error(`${result.percent}% — the pass mark is ${assessment.passMark}%.`);
    return result;
  };
  useEffect(() => {
    if (!active) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [active?.startedAt]);
  useEffect(() => {
    if (active && remaining <= 0 && submit("time")) toast.error("Time is up. Your answers were submitted automatically.");
  }, [active && remaining <= 0]);
  // Leaving the tab, leaving full screen and turning the camera off all count towards the same limit.
  const depart = (reason: Departure) => {
    let losses = 0;
    update((s) => {
      const e = s.enrollments.find((x) => x.memberId === profile.id && x.courseId === course.id);
      if (e?.active) losses = ++e.active.focusLosses;
    });
    if (!losses) return;
    if (losses >= MAX_FOCUS_LOSSES) { if (submit("focus")) toast.error("Too many departures from the assessment. It was submitted."); }
    else toast.warning(`${departureLabel[reason]} (${losses}/${MAX_FOCUS_LOSSES}). Stay on this page, in full screen, with your camera on.`);
  };
  const proctor = useProctoring(!!active, depart);
  useEffect(() => {
    if (!active) return;
    const onHide = () => { if (document.visibilityState === "hidden") depart("tab"); };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [active?.startedAt]);
  const start = async () => {
    if (!await confirmAction({
      title: `Start ${assessment.title.toLowerCase()}?`,
      description: `You will have ${assessment.minutes} minutes for ${assessment.questions.length} questions. Your camera must stay on and the assessment opens in full screen. The timer cannot be paused, you cannot leave the page, and leaving full screen or this tab is recorded.`,
      confirmLabel: "Turn on camera & start",
    })) return;
    let stream: MediaStream;
    try { stream = await startProctoring(); } catch (e) { toast.error((e as Error).message); return; }
    proctor.attach(stream);
    update((s) => {
      const e = s.enrollments.find((x) => x.memberId === profile.id && x.courseId === course.id);
      if (!e || e.active) return;
      const startedAt = new Date();
      e.active = { assessmentId: assessment.id, startedAt: startedAt.toISOString(), endsAt: new Date(startedAt.getTime() + assessment.minutes * 60_000).toISOString(), order: shuffle(assessment.questions.map((x) => x.id)), answers: {}, focusLosses: 0 };
    });
    setNow(Date.now());
  };
  if (active) {
    const questions = active.order.map((qid) => assessment.questions.find((x) => x.id === qid)!).filter(Boolean);
    const answered = questions.filter((x) => active.answers[x.id] !== undefined).length;
    if (!proctor.stream) return <Panel className="ac-exam"><div className={`ac-timer ${remaining < 60_000 ? "urgent" : ""}`} role="timer"><div><strong>{assessment.title}</strong><small>Camera off</small></div><span><Timer size={18} /> {formatClock(remaining)}</span></div><CameraRequired onEnable={async () => proctor.attach(await startProctoring())} /></Panel>;
    return (
      <Panel className="ac-exam">
        <ProctorCamera stream={proctor.stream} />
        <div className={`ac-timer ${remaining < 60_000 ? "urgent" : ""}`} role="timer" aria-live="off">
          <div><strong>{assessment.title}</strong><small>{answered} of {questions.length} answered · {active.focusLosses}/{MAX_FOCUS_LOSSES} departures · camera on</small></div>
          <span><Timer size={18} /> {formatClock(remaining)}</span>
        </div>
        <form className="hub-form" onSubmit={async (e) => {
          e.preventDefault();
          if (answered < questions.length && !await confirmAction({ title: "Submit with unanswered questions?", description: `${questions.length - answered} question(s) are unanswered and will be marked incorrect.`, confirmLabel: "Submit anyway", destructive: true })) return;
          submit("submitted");
        }}>
          {questions.map((x, n) => (
            <fieldset key={x.id} className="ac-question">
              <legend><span>Question {n + 1}</span>{x.prompt}</legend>
              {x.options.map((o, i) => (
                <label className="hub-radio" key={i}>
                  <input type="radio" name={x.id} checked={active.answers[x.id] === i} onChange={() => update((s) => {
                    const en = s.enrollments.find((y) => y.memberId === profile.id && y.courseId === course.id);
                    if (en?.active?.assessmentId === assessment.id && Date.parse(en.active.endsAt) > Date.now()) en.active.answers[x.id] = i;
                  })} />
                  {o}
                </label>
              ))}
            </fieldset>
          ))}
          <button className="hub-button">Submit {assessment.kind === "exam" ? "exam" : "quiz"}</button>
        </form>
      </Panel>
    );
  }
  return (
    <Panel>
      <p className="hub-eyebrow">{assessment.kind === "exam" ? "FINAL EXAM" : `MODULE ${assessment.moduleIndex! + 1} · GRADED QUIZ`}</p>
      <h2>{assessment.title}</h2>
      <div className="ac-exam-facts">
        <div><ListChecks size={18} /><strong>{assessment.questions.length}</strong><span>questions</span></div>
        <div><Timer size={18} /><strong>{assessment.minutes} min</strong><span>time limit</span></div>
        <div><CircleDot size={18} /><strong>{assessment.passMark}%</strong><span>to pass</span></div>
        <div><ShieldAlert size={18} /><strong>{passed ? "—" : lockedUntil ? 0 : assessment.maxAttempts - attempts.filter((a) => !a.passed && now - Date.parse(a.submittedAt) < ATTEMPT_WINDOW_HOURS * 3600_000).length}</strong><span>attempts left</span></div>
      </div>
      {last && (
        <div className={`ac-result ${last.passed ? "pass" : "fail"}`}>
          {last.passed ? <CheckCircle2 /> : <XCircle />}
          <div>
            <strong>Latest attempt: {last.percent}% ({last.score}/{last.total}) · {last.passed ? "Passed" : "Not passed"}</strong>
            <small>Submitted {new Date(last.submittedAt).toLocaleString()}{last.reason === "time" ? " · time expired" : last.reason === "focus" ? " · submitted after leaving the tab" : ""}</small>
            {assessment.kind === "quiz" && <p>{last.results.map((ok, i) => <span key={i} className={ok ? "ok" : "no"}>Q{i + 1} {ok ? "correct" : "incorrect"}</span>)}</p>}
            {assessment.kind === "exam" && !last.passed && <p className="hub-caption">Exam answers are not revealed. Review the modules before your next attempt.</p>}
          </div>
        </div>
      )}
      {passed ? (
        <p className="hub-feedback">You passed this assessment. Best score: {bestAttempt(enrollment, assessment.id)?.percent}%.</p>
      ) : otherActive ? (
        <p className="hub-feedback">Finish your other open assessment before starting this one.</p>
      ) : lockedUntil ? (
        <p className="hub-feedback">You have used all {assessment.maxAttempts} attempts. Your next attempt opens {lockedUntil.toLocaleString()}.</p>
      ) : (
        <button className="hub-button hub-space" onClick={() => void start()}><Timer size={16} /> {attempts.length ? "Retake" : "Start"} {assessment.kind === "exam" ? "exam" : "quiz"}</button>
      )}
    </Panel>
  );
}

function Grades({ course, enrollment, assessments }: { course: Course; enrollment?: Enrollment; assessments: Assessment[] }) {
  if (!enrollment) return <Empty>Enroll to see your grades.</Empty>;
  return (
    <Panel>
      <div className="ws-panel-title"><h2>Grades</h2><span className="ws-pill">{enrollment.completedAt ? `Completed ${enrollment.completedAt}` : "In progress"}</span></div>
      <div className="ws-table-wrap">
        <table className="ws-table">
          <thead><tr><th>Item</th><th>Status</th><th>Best score</th><th>Pass mark</th><th>Attempts</th></tr></thead>
          <tbody>
            {assessments.filter((a) => a.kind === "quiz").map((a) => {
              const best = bestAttempt(enrollment, a.id);
              return <tr key={a.id}><td><strong>{a.title}</strong><small>{course.lessons[a.moduleIndex!]?.title}</small></td><td>{hasPassed(enrollment, a.id) ? "Passed" : best ? "Not passed" : "Not started"}</td><td>{best ? `${best.percent}%` : "—"}</td><td>{a.passMark}%</td><td>{attemptsFor(enrollment, a.id).length}</td></tr>;
            })}
            <tr><td><strong>Graded assignment</strong><small>At least {MIN_ASSIGNMENT_WORDS} words</small></td><td>{enrollment.assignmentAt || wordCount(enrollment.assignment) >= MIN_ASSIGNMENT_WORDS ? "Submitted" : "Not submitted"}</td><td>—</td><td>{MIN_ASSIGNMENT_WORDS} words</td><td>—</td></tr>
            {assessments.filter((a) => a.kind === "exam").map((a) => {
              const best = bestAttempt(enrollment, a.id);
              return <tr key={a.id}><td><strong>{a.title}</strong><small>{a.questions.length} questions · {a.minutes} min</small></td><td>{hasPassed(enrollment, a.id) || enrollment.passed ? "Passed" : best ? "Not passed" : "Not started"}</td><td>{best ? `${best.percent}%` : "—"}</td><td>{a.passMark}%</td><td>{attemptsFor(enrollment, a.id).length}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
export function AlxPage() {
  const { state, profile } = useHub();
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<(typeof alxPrograms)[number] | null>(null);
  const statusOf = (id: string) => state.proofs.find((p) => p.memberId === profile.id && p.programId === id);
  return (
    <div className="ws-page">
      <Heading
        title="ALX learning zone"
        description="Take a programme on ALX, then upload your completion certificate here. PLP recognises it straight away."
        action={<a className="hub-button secondary" href="https://www.alxafrica.com/" target="_blank" rel="noreferrer">Visit ALX ↗</a>}
      />
      <div className="alx-grid">
        {alxPrograms.map((program) => {
          const proof = statusOf(program.id);
          const recognised = proof?.status === "Recognized";
          return (
            <article className="alx-card" key={program.id}>
              <div className="alx-top">
                <span className="alx-focus">{program.focus}</span>
                <span className={`alx-status${recognised ? " done" : proof?.status === "Returned" ? " review" : ""}`}>{recognised ? "Recognised" : proof?.status === "Returned" ? "Revoked" : proof?.file ? "Processing" : "Not submitted"}</span>
              </div>
              <h2>{program.title}</h2>
              <p>{program.description}</p>
              <footer>
                <a className="hub-text-link" href={program.url} target="_blank" rel="noreferrer">Open on ALX ↗</a>
                {!recognised && <button className="hub-button secondary" onClick={() => setUploading(program)}>{proof?.file ? "Replace" : "Upload certificate"}</button>}
              </footer>
            </article>
          );
        })}
      </div>
      {uploading && (
        <FormModal title={`Upload certificate: ${uploading.title}`} description="PDF, PNG or JPG, up to 1.5 MB. It is recognised as soon as it uploads; PLP may revoke certificates that are not genuine." onClose={() => setUploading(null)}>
          <form
            className="hub-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const file = new FormData(e.currentTarget).get("proof") as File;
              if (!file?.size) return void toast.error("Choose your ALX completion certificate.");
              if (file.size > 1500000) return void toast.error("Choose a PDF or image smaller than 1.5 MB.");
              if (!["application/pdf", "image/png", "image/jpeg"].includes(file.type)) return void toast.error("Use a PDF, PNG, or JPG.");
              setBusy(true);
              try {
                // Evidence is stored on the platform so administrators can review it from any device.
                const attachment = await uploadFile(file);
                const previous = statusOf(uploading.id);
                await saveRecord("proofs", { title: uploading.title, category: uploading.id, description: file.name, attachments: [attachment] });
                if (previous && previous.status !== "Recognized" && previous.version) await deleteRecord("proofs", previous.id).catch(() => {});
                toast.success("Certificate uploaded and recognised");
                setUploading(null);
              } catch (err) {
                toast.error((err as Error).message || "Could not read this file. Please try another.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field label="Completion certificate"><input name="proof" required type="file" accept="application/pdf,image/png,image/jpeg" /></Field>
            <div className="hub-actions hub-dialog-actions">
              <button type="button" className="hub-button secondary" onClick={() => setUploading(null)}>Cancel</button>
              <button className="hub-button" disabled={busy}>{busy ? "Uploading…" : "Submit certificate"}</button>
            </div>
          </form>
        </FormModal>
      )}
    </div>
  );
}
