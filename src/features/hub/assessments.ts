import type { Course, Question } from "./data";

export const QUIZ_PASS_MARK = 80;
export const EXAM_PASS_MARK = 70;
export const MAX_ATTEMPTS = 3;
export const ATTEMPT_WINDOW_HOURS = 24;
export const MAX_FOCUS_LOSSES = 1;
export const MIN_ASSIGNMENT_WORDS = 60;

export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  startedAt: string;
  submittedAt: string;
  score: number;
  total: number;
  percent: number;
  passed: boolean;
  reason: "submitted" | "time" | "focus";
  focusLosses: number;
  results?: boolean[];
}
export interface ActiveAttempt {
  assessmentId: string;
  startedAt: string;
  endsAt: string;
  order: string[];
  answers: Record<string, number>;
  focusLosses: number;
}
export interface Assessment {
  id: string;
  kind: "quiz" | "exam";
  title: string;
  questions: Question[];
  minutes: number;
  passMark: number;
  maxAttempts: number;
  moduleIndex?: number;
}
interface AttemptRecord {
  attempts?: AssessmentAttempt[];
}


// Preset assessments by course id. The old sample courses were removed, so every course now uses the
// quizzes and exam its trainer wrote (or the generated fallback below).
const bank: Record<string, { outcomes: string[]; modules: Question[][]; exam: Question[] }> = {};

export function outcomesFor(course: Course) {
  return course.outcomes?.length ? course.outcomes : bank[course.id]?.outcomes ?? course.skills.map(s => `Build practical ${s.toLowerCase()} skills`);
}

export function assessmentsFor(course: Course): Assessment[] {
  const preset = bank[course.id];
  const modules = course.lessons.flatMap((lesson, i): Assessment[] => {
    const questions = lesson.quiz?.length ? lesson.quiz : preset?.modules[i] ?? [];
    return questions.length ? [{ id: `module-${i}`, kind: "quiz", title: `Module ${i + 1} knowledge check`, questions, minutes: lesson.quizMinutes ?? Math.max(3, questions.length * 2), passMark: QUIZ_PASS_MARK, maxAttempts: MAX_ATTEMPTS, moduleIndex: i }] : [];
  });
  const fallback = course.question && course.options.length >= 2 ? [{ id: `${course.id}-legacy`, prompt: course.question, options: course.options, answer: course.answer }] : [];
  const exam = course.exam?.length ? course.exam : preset?.exam ?? fallback;
  return exam.length ? [...modules, { id: "final", kind: "exam", title: "Final graded exam", questions: exam, minutes: course.examMinutes ?? Math.max(5, exam.length * 2), passMark: course.passMark ?? EXAM_PASS_MARK, maxAttempts: course.maxAttempts ?? MAX_ATTEMPTS }] : modules;
}

export const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export function attemptsFor(record: AttemptRecord | undefined, assessmentId: string) {
  return (record?.attempts ?? []).filter(a => a.assessmentId === assessmentId);
}
export function bestAttempt(record: AttemptRecord | undefined, assessmentId: string) {
  return attemptsFor(record, assessmentId).reduce<AssessmentAttempt | undefined>((best, a) => (!best || a.percent > best.percent ? a : best), undefined);
}
export const hasPassed = (record: AttemptRecord | undefined, assessmentId: string) => attemptsFor(record, assessmentId).some(a => a.passed);

/** Attempts are limited per rolling window; returns when the next attempt opens, or null if one is available now. */
export function nextAttemptAt(record: AttemptRecord | undefined, assessment: Assessment, now = Date.now()) {
  const windowMs = ATTEMPT_WINDOW_HOURS * 3600_000;
  const recent = attemptsFor(record, assessment.id).filter(a => now - Date.parse(a.submittedAt) < windowMs && !a.passed);
  if (recent.length < assessment.maxAttempts) return null;
  return new Date(Math.min(...recent.map(a => Date.parse(a.submittedAt))) + windowMs);
}

export function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function grade(assessment: Assessment, active: ActiveAttempt, reason: AssessmentAttempt["reason"], id: string): AssessmentAttempt {
  const questions = active.order.map(qid => assessment.questions.find(x => x.id === qid)).filter((x): x is Question => !!x);
  const results = questions.map(x => active.answers[x.id] === x.answer);
  const score = results.filter(Boolean).length;
  const percent = questions.length ? Math.round((score / questions.length) * 100) : 0;
  return { id, assessmentId: assessment.id, startedAt: active.startedAt, submittedAt: new Date().toISOString(), score, total: questions.length, percent, passed: reason !== "focus" && percent >= assessment.passMark, reason, focusLosses: active.focusLosses, results };
}
