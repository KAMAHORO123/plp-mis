import { randomInt, randomUUID } from "node:crypto";
import { z } from "zod";
import { transaction } from "./db.mjs";

// Server-enforced timed assessments for trainer-built courses. Answers never leave the server.
export const QUIZ_PASS_MARK = 80, EXAM_PASS_MARK = 70, MAX_ATTEMPTS = 3, MAX_FOCUS_LOSSES = 1, MIN_ASSIGNMENT_WORDS = 60;
const GRACE = "interval '0 seconds'";
const demand = (ok, status, message) => { if (!ok) throw Object.assign(new Error(message), { status }); };
export const wordCount = (text) => String(text || "").trim().split(/\s+/).filter(Boolean).length;

export function assessmentsOf(data) {
  const maxAttempts = data.max_attempts ?? MAX_ATTEMPTS;
  const list = (data.lessons || []).flatMap((l, i) => l.quiz?.length
    ? [{ id: `module-${i}`, kind: "quiz", moduleIndex: i, questions: l.quiz, minutes: l.quiz_minutes ?? Math.max(3, l.quiz.length * 2), passMark: QUIZ_PASS_MARK, maxAttempts }]
    : []);
  if (data.exam?.length) list.push({ id: "final", kind: "exam", questions: data.exam, minutes: data.exam_minutes ?? Math.max(5, data.exam.length * 2), passMark: data.pass_mark ?? EXAM_PASS_MARK, maxAttempts });
  return list;
}
/** Removes correct answers from a course for anyone who is not its trainer or an administrator. */
export function withoutAnswers(data) {
  const strip = (q) => ({ id: q.id, prompt: q.prompt, options: q.options });
  const result = { ...data, lessons: (data.lessons || []).map((l) => (l.quiz ? { ...l, quiz: l.quiz.map(strip) } : l)) };
  if (data.exam) result.exam = data.exam.map(strip);
  delete result.answer;
  return result;
}
function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) { const j = randomInt(i + 1); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}
const summary = (a, kind) => ({ id: a.id, assessment_id: a.assessment_id, started_at: a.started_at, submitted_at: a.submitted_at, score: a.score, total: a.total, percent: a.percent, passed: a.passed, reason: a.reason, focus_losses: a.focus_losses, ...(kind === "quiz" ? { results: a.results } : {}) });

export async function completeIfEligible(tx, e, course) {
  const lessons = course.data.lessons || [];
  if (e.completed_at || !e.passed || !lessons.every((_, i) => e.lessons.includes(i)) || wordCount(e.assignment) < MIN_ASSIGNMENT_WORDS) return false;
  const member = (await tx.query("SELECT name FROM users WHERE id=$1", [e.member_id])).rows[0];
  await tx.query("UPDATE enrollments SET completed_at=now() WHERE id=$1", [e.id]);
  await tx.query("INSERT INTO certificates(id,member_id,course_id,recipient,programme) VALUES($1,$2,$3,$4,$5) ON CONFLICT(member_id,course_id) DO NOTHING", [randomUUID(), e.member_id, course.id, member.name, course.data.title]);
  await tx.query("INSERT INTO credits(id,member_id,source,label,amount) VALUES($1,$2,$3,$4,50) ON CONFLICT(member_id,source) DO NOTHING", [randomUUID(), e.member_id, "course:" + course.id, "Completed " + course.data.title]);
  return true;
}

async function grade(tx, attempt, e, course, reason) {
  const a = assessmentsOf(course.data).find((x) => x.id === attempt.assessment_id);
  const results = attempt.question_ids.map((qid) => { const q = a?.questions.find((x) => x.id === qid); return !!q && attempt.answers[qid] === q.answer; });
  const score = results.filter(Boolean).length, total = results.length, percent = total ? Math.round((score / total) * 100) : 0, passed = reason !== "focus" && !!a && percent >= a.passMark;
  const row = (await tx.query("UPDATE assessment_attempts SET submitted_at=now(),score=$2,total=$3,percent=$4,passed=$5,reason=$6,results=$7 WHERE id=$1 RETURNING *", [attempt.id, score, total, percent, passed, reason, results])).rows[0];
  if (passed && a.kind === "quiz" && !e.lessons.includes(a.moduleIndex)) e.lessons = [...e.lessons, a.moduleIndex];
  if (passed && a.kind === "exam") e.passed = true;
  await tx.query("UPDATE enrollments SET lessons=$2,passed=$3 WHERE id=$1", [e.id, e.lessons, e.passed]);
  await completeIfEligible(tx, e, course);
  return summary(row, a?.kind);
}
async function lockEnrollment(tx, id, user) {
  const e = (await tx.query("SELECT * FROM enrollments WHERE id=$1 AND member_id=$2 FOR UPDATE", [id, user.id])).rows[0];
  demand(e, 404, "Enrollment not found");
  const course = (await tx.query("SELECT * FROM records WHERE id=$1", [e.course_id])).rows[0];
  demand(course?.data.published, 409, "Course unavailable");
  return { e, course };
}
async function closeExpired(tx, e, course) {
  const expired = (await tx.query(`SELECT * FROM assessment_attempts WHERE enrollment_id=$1 AND submitted_at IS NULL AND now()>ends_at+${GRACE}`, [e.id])).rows;
  for (const attempt of expired) await grade(tx, attempt, e, course, "time");
}
function activePayload(attempt, course) {
  const a = assessmentsOf(course.data).find((x) => x.id === attempt.assessment_id);
  return { id: attempt.id, assessment_id: attempt.assessment_id, server_time: new Date().toISOString(), started_at: attempt.started_at, ends_at: attempt.ends_at, answers: attempt.answers, focus_losses: attempt.focus_losses, questions: attempt.question_ids.map((qid) => a?.questions.find((q) => q.id === qid)).filter(Boolean).map((q) => ({ id: q.id, prompt: q.prompt, options: q.options })) };
}

const answersSchema = z.record(z.string().max(40), z.number().int().min(0).max(5));
export async function assessmentsRoute({ p, req, db, user, body, send }) {
  let m = p.match(/^\/enrollments\/([a-f0-9-]+)\/(assessments|viewed)$/);
  if (m) {
    const id = z.string().uuid().parse(m[1]);
    if (m[2] === "viewed") {
      demand(req.method === "POST", 405, "Method not allowed");
      const { lesson } = z.object({ lesson: z.number().int().min(0) }).strict().parse(await body());
      await transaction(db, async (tx) => {
        const { e, course } = await lockEnrollment(tx, id, user);
        const lessons = course.data.lessons || [];
        demand(lesson < lessons.length, 400, "Unknown module");
        demand(lesson === 0 || e.lessons.includes(lesson - 1), 409, "Complete the previous module first");
        const viewed = [...new Set([...e.viewed, lesson])];
        if (!lessons[lesson].quiz?.length && !e.lessons.includes(lesson)) e.lessons = [...e.lessons, lesson];
        await tx.query("UPDATE enrollments SET viewed=$2,lessons=$3 WHERE id=$1", [id, viewed, e.lessons]);
      });
      send(200, { ok: true });
      return true;
    }
    demand(req.method === "GET", 405, "Method not allowed");
    const result = await transaction(db, async (tx) => {
      const { e, course } = await lockEnrollment(tx, id, user);
      await closeExpired(tx, e, course);
      const kinds = Object.fromEntries(assessmentsOf(course.data).map((a) => [a.id, a.kind]));
      const rows = (await tx.query("SELECT * FROM assessment_attempts WHERE enrollment_id=$1 ORDER BY started_at", [id])).rows;
      const open = rows.find((r) => !r.submitted_at);
      const fresh = (await tx.query("SELECT lessons,viewed,passed,completed_at,assignment,assignment_at FROM enrollments WHERE id=$1", [id])).rows[0];
      return { enrollment: fresh, attempts: rows.filter((r) => r.submitted_at).map((r) => summary(r, kinds[r.assessment_id])), active: open ? activePayload(open, course) : null };
    });
    send(200, result);
    return true;
  }
  m = p.match(/^\/enrollments\/([a-f0-9-]+)\/assessments\/([a-z0-9-]+)\/start$/);
  if (m) {
    demand(req.method === "POST", 405, "Method not allowed");
    const id = z.string().uuid().parse(m[1]), assessmentId = m[2];
    const active = await transaction(db, async (tx) => {
      const { e, course } = await lockEnrollment(tx, id, user);
      await closeExpired(tx, e, course);
      const a = assessmentsOf(course.data).find((x) => x.id === assessmentId);
      demand(a, 404, "Assessment not found");
      demand(!(await tx.query("SELECT 1 FROM assessment_attempts WHERE enrollment_id=$1 AND submitted_at IS NULL", [id])).rowCount, 409, "Finish your open assessment first");
      demand(!(await tx.query("SELECT 1 FROM assessment_attempts WHERE enrollment_id=$1 AND assessment_id=$2 AND passed", [id, a.id])).rowCount, 409, "You have already passed this assessment");
      const lessons = course.data.lessons || [];
      if (a.kind === "quiz") {
        demand(a.moduleIndex === 0 || e.lessons.includes(a.moduleIndex - 1), 409, "Complete the previous module first");
        demand(e.viewed.includes(a.moduleIndex), 409, "Read the module before taking its quiz");
      } else {
        demand(lessons.every((_, i) => e.lessons.includes(i)), 409, "Pass every module quiz first");
        demand(wordCount(e.assignment) >= MIN_ASSIGNMENT_WORDS, 409, "Submit the graded assignment first");
      }
      const recent = (await tx.query("SELECT submitted_at FROM assessment_attempts WHERE enrollment_id=$1 AND assessment_id=$2 AND NOT passed AND submitted_at>now()-interval '24 hours' ORDER BY submitted_at", [id, a.id])).rows;
      if (recent.length >= a.maxAttempts) demand(false, 429, `You have used all ${a.maxAttempts} attempts. Try again after ${new Date(recent[0].submitted_at.getTime() + 86400000).toISOString()}.`);
      const attempt = (await tx.query(`INSERT INTO assessment_attempts(id,enrollment_id,assessment_id,question_ids,ends_at) VALUES($1,$2,$3,$4,now()+make_interval(mins=>$5)) RETURNING *`, [randomUUID(), id, a.id, shuffle(a.questions.map((q) => q.id)), a.minutes])).rows[0];
      return activePayload(attempt, course);
    });
    send(201, active);
    return true;
  }
  m = p.match(/^\/assessment-attempts\/([a-f0-9-]+)(\/submit)?$/);
  if (m) {
    const attemptId = z.string().uuid().parse(m[1]);
    const submitting = !!m[2];
    demand(req.method === (submitting ? "POST" : "PUT"), 405, "Method not allowed");
    const input = z.object({ answers: answersSchema.default({}), focus_losses: z.number().int().min(0).max(50).optional(), reason: z.enum(["submitted", "time", "focus"]).default("submitted") }).strict().parse(await body());
    const result = await transaction(db, async (tx) => {
      const attempt = (await tx.query(`SELECT a.*,a.ends_at+${GRACE}>=now() AS open_window FROM assessment_attempts a JOIN enrollments e ON e.id=a.enrollment_id WHERE a.id=$1 AND e.member_id=$2 FOR UPDATE OF a`, [attemptId, user.id])).rows[0];
      demand(attempt, 404, "Attempt not found");
      const { e, course } = await lockEnrollment(tx, attempt.enrollment_id, user);
      if (attempt.submitted_at) return { submitted: summary(attempt, assessmentsOf(course.data).find(a => a.id === attempt.assessment_id)?.kind) };
      // Answers sent after the time limit are ignored; the attempt is graded on what was saved in time.
      if (attempt.open_window) {
        for (const [qid, value] of Object.entries(input.answers)) if (attempt.question_ids.includes(qid)) attempt.answers[qid] = value;
        attempt.focus_losses = Math.max(attempt.focus_losses, input.focus_losses ?? 0);
        await tx.query("UPDATE assessment_attempts SET answers=$2,focus_losses=$3 WHERE id=$1", [attempt.id, attempt.answers, attempt.focus_losses]);
      }
      if (!attempt.open_window) return { submitted: await grade(tx, attempt, e, course, "time") };
      if (attempt.focus_losses >= MAX_FOCUS_LOSSES) return { submitted: await grade(tx, attempt, e, course, "focus") };
      if (submitting) return { submitted: await grade(tx, attempt, e, course, input.reason === "focus" ? "focus" : input.reason) };
      return { saved: true };
    });
    send(200, result);
    return true;
  }
  return false;
}
