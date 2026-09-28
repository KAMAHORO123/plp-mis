import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Award,
  LockKeyhole,
} from "lucide-react";
import { toast } from "sonner";
import { categories, alxPrograms } from "./data";
import { useHub, completeCourse, uid } from "./store";
import {
  Empty,
  Field,
  Heading,
  Panel,
  Progress,
  SearchBox,
  Tag,
  TextLink,
} from "./ui";
export function AcademyPage() {
  const { state, profile } = useHub();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const category = params.get("category") || "All pathways";
  const [mine, setMine] = useState(false);
  const list = state.courses.filter(
    (c) =>
      c.published &&
      (category === "All pathways" || c.category === category) &&
      `${c.title} ${c.skills.join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!mine ||
        state.enrollments.some(
          (e) => e.courseId === c.id && e.memberId === profile.id,
        )),
  );
  return (
    <>
      <Heading
        eyebrow="LEARN. PRACTICE. GROW."
        title="Learning academy"
        description="Build skills that take you further. Choose a pathway and learn at your own pace."
      />
      <div className="hub-academy-banner">
        <BookOpen size={42} />
        <div>
          <Tag>Discover & Develop</Tag>
          <h2>One small step today. A new possibility tomorrow.</h2>
          <p>
            Complete lessons, a practical reflection, and a knowledge check to
            earn a sample certificate and 50 credits.
          </p>
        </div>
      </div>
      <div className="hub-toolbar">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Search courses or skills"
        />
        <label className="hub-check">
          <input
            type="checkbox"
            checked={mine}
            onChange={(e) => setMine(e.target.checked)}
          />{" "}
          My learning only
        </label>
      </div>
      <div className="hub-chips" aria-label="Learning categories">
        {["All pathways", ...categories].map((c) => (
          <button
            className={c === category ? "active" : ""}
            key={c}
            onClick={() =>
              setParams(c === "All pathways" ? {} : { category: c })
            }
          >
            {c}
          </button>
        ))}
      </div>
      <p className="hub-caption">
        {list.length} courses · Starter content for this preview; not an
        official PLP curriculum.
      </p>
      <div className="hub-grid three">
        {list.map((c, i) => {
          const e = state.enrollments.find(
            (e) => e.memberId === profile.id && e.courseId === c.id,
          );
          const progress = e?.completedAt
            ? 100
            : Math.round(
                ((e?.lessons.length || 0) / (c.lessons.length + 1)) * 100,
              );
          return (
            <Link
              className="hub-course-card"
              key={c.id}
              to={`/academy/${c.id}`}
            >
              <div className={`hub-course-art tone-${i % 5}`}>
                <BookOpen size={40} />
                <span>PLP ACADEMY</span>
                <small>{c.category}</small>
              </div>
              <div className="hub-course-body">
                <div className="hub-row">
                  <Tag>{c.level}</Tag>
                  {e?.completedAt && <CheckCircle2 size={19} />}
                </div>
                <h2>{c.title}</h2>
                <p>{c.summary}</p>
                <div className="hub-course-meta">
                  <Clock3 size={14} />
                  {c.duration}
                  <span>·</span>
                  {c.lessons.length} lessons
                </div>
                {e ? (
                  <Progress value={progress} />
                ) : (
                  <p className="hub-caption">Certificate + 50 credits</p>
                )}
                <span className="hub-text-link">
                  {e?.completedAt
                    ? "Review course"
                    : e
                      ? "Continue learning"
                      : "Explore course"}
                  <ArrowRight size={16} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
      {!list.length && (
        <Empty>
          No courses match. Try another pathway or clear your search.
        </Empty>
      )}
    </>
  );
}
export function CoursePage() {
  const { id } = useParams();
  const { state, profile, update } = useHub();
  const course = state.courses.find((c) => c.id === id && c.published);
  const enrollment = state.enrollments.find(
    (e) => e.courseId === id && e.memberId === profile.id,
  );
  const [lesson, setLesson] = useState(0);
  const [feedback, setFeedback] = useState("");
  if (!course)
    return (
      <Empty>
        Course not found. <TextLink to="/academy">Back to academy</TextLink>
      </Empty>
    );
  const canSubmit =
    !!enrollment &&
    course.lessons.every((_, i) => enrollment.lessons.includes(i));
  return (
    <>
      <TextLink to="/academy">Back to the academy</TextLink>
      <Heading
        eyebrow={course.category}
        title={course.title}
        description={course.summary}
      />
      <div className="hub-course-detail">
        <aside>
          <Panel>
            <Tag>{course.level}</Tag>
            <p>
              {course.duration} · {course.lessons.length} lessons
            </p>
            <h3>In this course</h3>
            {course.lessons.map((l, i) => (
              <button
                className={`hub-lesson-button ${lesson === i ? "active" : ""}`}
                key={l.title}
                onClick={() => setLesson(i)}
              >
                {enrollment?.lessons.includes(i) ? (
                  <CheckCircle2 size={17} />
                ) : (
                  <span>{i + 1}</span>
                )}
                {l.title}
              </button>
            ))}
            <div className="hub-space">
              <h3>Skills you’ll build</h3>
              <div className="hub-tags">
                {course.skills.map((s) => (
                  <Tag key={s}>{s}</Tag>
                ))}
              </div>
            </div>
          </Panel>
        </aside>
        <div className="hub-stack">
          <Panel>
            <p className="hub-eyebrow">
              LESSON {lesson + 1} OF {course.lessons.length}
            </p>
            <h2>{course.lessons[lesson].title}</h2>
            <p className="hub-lesson-copy">{course.lessons[lesson].content}</p>
            {!enrollment ? (
              <button
                className="hub-button"
                onClick={() =>
                  update((s) => {
                    if (
                      !s.enrollments.some(
                        (e) =>
                          e.memberId === profile.id && e.courseId === course.id,
                      )
                    )
                      s.enrollments.push({
                        memberId: profile.id,
                        courseId: course.id,
                        lessons: [],
                        assignment: "",
                        passed: false,
                      });
                  })
                }
              >
                Enroll in this course <ArrowRight size={17} />
              </button>
            ) : (
              <button
                className="hub-button"
                disabled={enrollment.lessons.includes(lesson)}
                onClick={() => {
                  update((s) => {
                    const e = s.enrollments.find(
                      (x) => x.memberId === profile.id && x.courseId === id,
                    )!;
                    if (!e.lessons.includes(lesson)) e.lessons.push(lesson);
                    completeCourse(s, profile.id, course.id);
                  });
                  if (lesson < course.lessons.length - 1) setLesson(lesson + 1);
                }}
              >
                {enrollment.lessons.includes(lesson)
                  ? "Lesson completed"
                  : "Mark lesson complete"}
                <CheckCircle2 size={17} />
              </button>
            )}
          </Panel>
          <Panel>
            <h2>Put your learning into practice</h2>
            {!canSubmit && (
              <p className="hub-muted">
                <LockKeyhole size={16} /> Complete all lessons to unlock the
                assignment and assessment.
              </p>
            )}
            <form
              key={`${profile.id}-${course.id}`}
              className="hub-form"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const assignment = String(f.get("assignment")).trim();
                if (assignment.length < 30) {
                  setFeedback(
                    "Write a reflection of at least 30 characters, excluding surrounding spaces.",
                  );
                  return;
                }
                const passed = Number(f.get("answer")) === course.answer;
                if (!passed) {
                  setFeedback(
                    "Not quite. Review the lessons and try again. Your reflection has not been submitted.",
                  );
                  return;
                }
                const ok = update((s) => {
                  const en = s.enrollments.find(
                    (x) => x.memberId === profile.id && x.courseId === id,
                  )!;
                  en.assignment = assignment;
                  en.passed = true;
                  completeCourse(s, profile.id, course.id);
                });
                if (ok) {
                  setFeedback(
                    "Course completed! Your certificate, skills, and 50 credits have been added to your passport.",
                  );
                  toast.success("Learning milestone unlocked");
                }
              }}
            >
              <Field label={course.assignment}>
                <textarea
                  name="assignment"
                  required
                  minLength={30}
                  maxLength={3000}
                  defaultValue={enrollment?.assignment || ""}
                  disabled={!canSubmit || !!enrollment?.completedAt}
                  placeholder="Reflect in at least 30 characters…"
                />
              </Field>
              <fieldset disabled={!canSubmit || !!enrollment?.completedAt}>
                <legend>{course.question}</legend>
                {course.options.map((a, i) => (
                  <label className="hub-radio" key={a}>
                    <input
                      type="radio"
                      name="answer"
                      value={i}
                      required
                      defaultChecked={enrollment?.passed && i === course.answer}
                    />
                    {a}
                  </label>
                ))}
              </fieldset>
              <button
                className="hub-button"
                disabled={!canSubmit || !!enrollment?.completedAt}
              >
                {enrollment?.completedAt
                  ? "Course completed"
                  : "Submit & complete course"}
              </button>
              {feedback && (
                <p role="status" className="hub-feedback">
                  {feedback}
                </p>
              )}
            </form>
            {enrollment?.completedAt && (
              <div className="hub-success hub-space">
                <Award />
                <div>
                  <h3>You earned it.</h3>
                  <p>
                    Your completion is recorded on {enrollment.completedAt}.
                  </p>
                  <TextLink to="/certificates">View your certificate</TextLink>
                </div>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
export function AlxPage() {
  const { state, profile, update } = useHub();
  const [busy, setBusy] = useState(false);
  const [focus, setFocus] = useState("Digital Skills");
  return (
    <>
      <Heading
        eyebrow="GO FURTHER WITH ALX"
        title="ALX learning zone"
        description="Explore external learning, track your progress, and submit completion evidence for PLP recognition."
      />
      <div className="hub-academy-banner alx">
        <div className="hub-alx-logo">ALX</div>
        <div>
          <Tag>Partner learning pathway</Tag>
          <h2>Learn beyond the Hub.</h2>
          <p>
            Register through the official ALX website. Progress here is
            self-reported; recognition requires a review in this preview.
          </p>
          <a
            href="https://www.alxafrica.com/"
            target="_blank"
            rel="noreferrer"
            className="hub-text-link"
          >
            Visit the official ALX catalogue ↗
          </a>
        </div>
      </div>
      <div className="hub-toolbar">
        <Field label="Your ALX learning goal">
          <select value={focus} onChange={(e) => setFocus(e.target.value)}>
            <option>Digital Skills</option>
            <option>Entrepreneurship</option>
          </select>
        </Field>
        <p className="hub-caption">
          Recommendations match your selected goal. Confirm eligibility, costs,
          and availability with ALX.
        </p>
      </div>
      <div className="hub-grid three">
        {alxPrograms.map((program) => {
          const proof = state.proofs.find(
            (p) => p.memberId === profile.id && p.programId === program.id,
          );
          return (
            <Panel key={`${profile.id}-${program.id}`}>
              <Tag>
                {program.focus === focus
                  ? "Recommended for your goal"
                  : program.focus}
              </Tag>
              <h2>{program.title}</h2>
              <p>{program.description}</p>
              <a
                href={program.url}
                target="_blank"
                rel="noreferrer"
                className="hub-text-link"
              >
                Explore & register at ALX ↗
              </a>
              <form
                className="hub-form hub-space"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const f = new FormData(form);
                  const file = f.get("proof") as File;
                  const progress = Number(f.get("progress"));
                  if (file?.size > 1500000) {
                    toast.error("Choose a PDF or image smaller than 1.5 MB.");
                    return;
                  }
                  if (
                    file?.size &&
                    !["application/pdf", "image/png", "image/jpeg"].includes(
                      file.type,
                    )
                  ) {
                    toast.error("Use a PDF, PNG, or JPG.");
                    return;
                  }
                  setBusy(true);
                  try {
                    const fileData = file?.size
                      ? await new Promise<string>((resolve, reject) => {
                          const r = new FileReader();
                          r.onload = () => resolve(String(r.result));
                          r.onerror = () =>
                            reject(new Error("File could not be read"));
                          r.readAsDataURL(file);
                        })
                      : undefined;
                    const ok = update((s) => {
                      let p = s.proofs.find(
                        (p) =>
                          p.memberId === profile.id &&
                          p.programId === program.id,
                      );
                      if (!p) {
                        p = {
                          id: uid(),
                          memberId: profile.id,
                          programId: program.id,
                          progress: 0,
                          status: "Learning",
                        };
                        s.proofs.push(p);
                      }
                      p.progress = progress;
                      if (fileData) {
                        p.file = fileData;
                        p.fileName = file.name;
                        p.status = "Pending review";
                      }
                    });
                    if (ok)
                      toast.success(
                        fileData
                          ? "Proof submitted for local review"
                          : "Progress saved",
                      );
                  } catch {
                    toast.error(
                      "Could not read this file. Please try another.",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Field label="Your progress (%)">
                  <input
                    type="number"
                    name="progress"
                    min="0"
                    max="100"
                    required
                    defaultValue={proof?.progress || 0}
                    disabled={proof?.status === "Recognized"}
                  />
                </Field>
                <Field label="Completion proof (PDF, PNG, JPG; max 1.5 MB)">
                  <input
                    name="proof"
                    type="file"
                    accept="application/pdf,image/png,image/jpeg"
                    disabled={proof?.status === "Recognized"}
                  />
                </Field>
                <button
                  className="hub-button secondary"
                  disabled={busy || proof?.status === "Recognized"}
                >
                  Save progress / submit proof
                </button>
              </form>
              <div className="hub-space">
                <Progress value={proof?.progress || 0} />
                <Tag>{proof?.status || "Not started"}</Tag>
                {proof?.fileName && (
                  <p className="hub-caption">Evidence: {proof.fileName}</p>
                )}
                {proof?.status === "Recognized" && (
                  <p className="hub-feedback">ALX recognition badge earned</p>
                )}
              </div>
            </Panel>
          );
        })}
      </div>
      <Panel className="hub-space">
        <h2>ALX learner stories</h2>
        <p>
          Read learners’ experiences on ALX’s official website. Approved PLP
          member stories can be added when supplied.
        </p>
        <a
          href="https://www.alxafrica.com/learners-voices/"
          target="_blank"
          rel="noreferrer"
          className="hub-text-link"
        >
          Explore ALX learner voices ↗
        </a>
      </Panel>
    </>
  );
}
