// Server-backed course data, shared by the trainer studio and the learner course page.
export interface TeachingQuestion { id: string; prompt: string; options: string[]; answer?: number }
export type LessonVideo = { kind: "youtube"; youtube_id: string; title?: string } | { kind: "file"; file_id: string; name: string; title?: string };
export interface TeachingLesson { title: string; content: string; video?: LessonVideo; quiz?: TeachingQuestion[]; quiz_minutes?: number }
/** Accepts youtube.com/watch, youtu.be, /embed/ and /shorts/ links, or a bare 11-character video id. */
export function youtubeId(input: string) {
  const value = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (!/(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/.test(url.hostname)) return null;
    const id = url.hostname.endsWith("youtu.be") ? url.pathname.slice(1) : url.searchParams.get("v") ?? url.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/)?.[1];
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}
export interface TeachingData {
  title: string;
  description: string;
  category?: string;
  duration?: string;
  level?: "Beginner" | "Intermediate" | "Advanced";
  published: boolean;
  lessons: TeachingLesson[];
  assignment?: string;
  outcomes?: string[];
  skills?: string[];
  exam?: TeachingQuestion[];
  exam_minutes?: number;
  pass_mark?: number;
  max_attempts?: number;
  /** Legacy single-question knowledge check, used only by courses without an exam. */
  question?: string;
  options?: string[];
  answer?: number;
  review_state?: string;
  review_note?: string;
}
export interface ServerAssessment { id: string; kind: "quiz" | "exam"; title: string; moduleIndex?: number; questions: TeachingQuestion[]; minutes: number; passMark: number; maxAttempts: number }

export const QUIZ_PASS_MARK = 80;
export const EXAM_PASS_MARK = 70;
export const MAX_ATTEMPTS = 3;
export const MIN_ASSIGNMENT_WORDS = 60;

/** Mirrors assessmentsOf() in services/platform/src/assessments.mjs. */
export function serverAssessments(data: TeachingData): ServerAssessment[] {
  const maxAttempts = data.max_attempts ?? MAX_ATTEMPTS;
  const list: ServerAssessment[] = (data.lessons || []).flatMap((l, i) => l.quiz?.length
    ? [{ id: `module-${i}`, kind: "quiz" as const, title: `Module ${i + 1} knowledge check`, moduleIndex: i, questions: l.quiz, minutes: l.quiz_minutes ?? Math.max(3, l.quiz.length * 2), passMark: QUIZ_PASS_MARK, maxAttempts }]
    : []);
  if (data.exam?.length) list.push({ id: "final", kind: "exam", title: "Final graded exam", questions: data.exam, minutes: data.exam_minutes ?? Math.max(5, data.exam.length * 2), passMark: data.pass_mark ?? EXAM_PASS_MARK, maxAttempts });
  return list;
}

/** What a course still needs before it can be submitted for publication. */
export function courseChecklist(d: TeachingData) {
  return [
    { label: "Title, summary and pathway", done: !!(d.title.trim() && d.description.trim() && d.category) },
    { label: "Learning outcomes", done: (d.outcomes?.filter(Boolean).length ?? 0) >= 2 },
    { label: "At least one module with a reading", done: d.lessons.length > 0 && d.lessons.every((l) => l.title.trim() && l.content.trim()) },
    { label: "A knowledge check in every module", done: d.lessons.length > 0 && d.lessons.every((l) => (l.quiz?.length ?? 0) > 0) },
    { label: "Graded assignment brief", done: !!d.assignment?.trim() },
    { label: "Final exam with at least three questions", done: (d.exam?.length ?? 0) >= 3 },
  ];
}
export const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
