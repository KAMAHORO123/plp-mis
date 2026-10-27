import { teachingRoute } from "./teaching.mjs";
import { meetingsRoute } from "./meetings.mjs";
import { mentorshipRoute } from "./mentorship.mjs";
import { assessmentsRoute, wordCount } from "./assessments.mjs";
import { requestResetCode, confirmResetCode } from "./password-reset-codes.mjs";
import {
  requestVerification,
  confirmVerification,
} from "./email-verification.mjs";
import { googleClient, googleRoute } from "./google.mjs";
import { mailConfigured } from "./mail-config.mjs";
import { schoolCertificates } from "./school-certificates.mjs";
import { funCornerSchema } from "./fun-corner.mjs";
import { filesRoute, validateAttachments, avatarRoute } from "./files.mjs";
import http from "node:http";
import { isDeepStrictEqual } from "node:util";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { z } from "zod";
import { connectDatabase, transaction } from "./db.mjs";
import {
  hashPassword,
  verifyPassword,
  digest,
  sessionToken,
  cookie,
  readToken,
  readSession,
  sessionJwt,
  jwtSecrets,
} from "./auth.mjs";
import { kinds, canWrite, canRead, publicRecord } from "./policy.mjs";
import { liveRoute, broadcast } from "./live.mjs";
import { reportsRoute } from "./reports.mjs";
import { validateRecord, validatePublishable, kigaliToday } from "./validation.mjs";
import { passwordProblem } from "./password-policy.mjs";
import { onRecordCreated, onRecordUpdated, onActivityReported, onAccessChanged } from "./notify-rules.mjs";
const text = z.string().trim().min(1).max(200);
const uuid = z.string().uuid();
const credentials = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    password: z.string().min(12).max(128),
    remember: z.boolean().optional(),
  })
  .strict();
const lessonVideo = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("youtube"), youtube_id: z.string().regex(/^[A-Za-z0-9_-]{11}$/), title: z.string().trim().max(120).optional() }).strict(),
  z.object({ kind: z.literal("file"), file_id: uuid, name: z.string().trim().max(120), title: z.string().trim().max(120).optional() }).strict(),
]);
const questionSchema = z
  .object({
    id: z.string().trim().min(1).max(40),
    prompt: z.string().trim().min(3).max(400),
    options: z.array(text).min(2).max(6),
    answer: z.number().int().min(0).max(5),
  })
  .strict()
  .refine((q) => q.answer < q.options.length, { message: "Each question needs a valid correct answer" });
const recordSchema = z
  .object({
    title: text,
    school_id: uuid.optional(),
    school_ids: z.array(uuid).max(500).optional(),
    activity_type: z.string().trim().min(1).max(40).optional(),
    report: z.string().max(10000).optional(),
    status: z
      .enum([
        "pending",
        "approved",
        "returned",
        "rejected",
        "completed",
        "cancelled",
      ])
      .optional(),
    feedback: z.string().max(2000).optional(),
    reference_id: uuid.optional(),
    attachments: z.array(uuid).max(100).optional(),
    description: z.string().max(10000).default(""),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    published: z.boolean().optional(),
    lessons: z
      .array(z.object({ title: text, content: z.string().max(20000), video: lessonVideo.optional(), quiz: z.array(questionSchema).max(30).optional(), quiz_minutes: z.number().int().min(1).max(120).optional() }))
      .max(100)
      .optional(),
    exam: z.array(questionSchema).max(60).optional(),
    exam_minutes: z.number().int().min(2).max(240).optional(),
    pass_mark: z.number().int().min(50).max(100).optional(),
    max_attempts: z.number().int().min(1).max(5).optional(),
    outcomes: z.array(z.string().trim().min(1).max(200)).max(12).optional(),
    organization: z.string().trim().max(100).optional(),
    location: z.string().trim().max(100).optional(),
    deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    eligibility: z.string().max(1000).optional(),
    opportunity_type: z.string().trim().max(40).optional(),
    format: z.enum(["On-site", "Remote", "Hybrid"]).optional(),
    commitment: z.string().trim().max(60).optional(),
    apply_mode: z.enum(["internal", "external"]).optional(),
    external: z.boolean().optional(),
    hours: z.number().min(0).max(1000).optional(),
    skills: z.array(z.string().trim().min(1).max(60)).max(12).optional(),
    duration: z.string().max(100).optional(),
    level: z.enum(["Beginner","Intermediate","Advanced"]).optional(),
    review_state: z.enum(["draft","submitted","changes_requested","approved"]).optional(),
    review_note: z.string().max(2000).optional(),
    question: text.optional(),
    options: z.array(text).min(2).max(6).optional(),
    answer: z.number().int().min(0).max(5).optional(),
    assignment: z.string().max(4000).optional(),
    email: z.string().email().optional(),
    category: text.optional(),
    url: z
      .string()
      .url()
      .refine((v) => v.startsWith("https://"))
      .optional(),
  })
  .strict();
const userFields = "id,email,name,role,status,school_id,created_at,requested_role,role_review,avatar_file_id";
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const requireIt = (condition, status, message) => {
  if (!condition) throw new HttpError(status, message);
};
// Uploaded lesson videos become course attachments, so the files are readable wherever the course is.
function withVideoAttachments(data) {
  const videos = (data.lessons || []).flatMap((l) => (l.video?.kind === "file" ? [l.video.file_id] : []));
  data.attachments = [...new Set([...(data.attachments || []), ...videos])];
}
function validateCourse(data) {
  if (data.answer !== undefined)
    requireIt(
      data.options && data.answer < data.options.length,
      400,
      "Invalid answer",
    );
  if (data.published && data.exam?.length)
    requireIt(
      data.lessons?.length &&
        data.lessons.every((l) => l.quiz?.length) &&
        data.exam.length >= 3 &&
        wordCount(data.assignment || "") >= 5,
      400,
      "Published courses need modules with quizzes, an assignment and at least three final exam questions",
    );
  else if (data.published)
    requireIt(
      data.lessons?.length &&
        data.question &&
        data.options?.length &&
        data.answer !== undefined,
      400,
      "Published courses need lessons and an assessment",
    );
}
async function body(req) {
  let buffer = "";
  for await (const chunk of req) {
    buffer += chunk;
    requireIt(Buffer.byteLength(buffer) <= 256000, 413, "Request too large");
  }
  try {
    return JSON.parse(buffer);
  } catch {
    throw new HttpError(400, "Invalid JSON");
  }
}
async function audit(db, user, action, id) {
  await db.query(
    "INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,$2,$3)",
    [user.id, action, id],
  );
}
export function createServer({
  db,
  origin,
  secure = true,
  credentialUrl = process.env.CREDENTIAL_URL,
  trustProxy = false,
  // Relative paths (e.g. ./uploads) are kept inside the platform service folder.
  uploadDirectory = process.env.UPLOAD_DIR ? path.resolve(fileURLToPath(new URL("..", import.meta.url)), process.env.UPLOAD_DIR) : undefined,
  google = googleClient(origin),
  recoveryEnabled = mailConfigured(),
}) {
  if (!origin) throw Error("APP_ORIGIN is required");
  jwtSecrets(); // fails fast in production without a strong JWT_SECRET
  return http.createServer(async (req, res) => {
    const send = (status, data) => {
      res.writeHead(status);
      res.end(JSON.stringify(data));
    };
    res.setHeader("Content-Type", "application/json");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store");
    // The API never serves pages to frame or run scripts in, so lock its responses down completely.
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; sandbox");
    if (secure) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    try {
      const url = new URL(req.url, "http://localhost"),
        p = url.pathname.replace(/^\/api/, "");
      // Tell open pages that data changed so they refresh what they show; they re-fetch through normal permission checks.
      if (!["GET", "HEAD"].includes(req.method) && !p.startsWith("/auth/") && !p.startsWith("/notifications"))
        res.on("finish", () => { if (res.statusCode < 400) broadcast("change", { area: p.split("/")[1] || "" }); });
      if (req.method === "GET" && p === "/healthz") {
        await db.query("SELECT 1");
        return send(200, { status: "ok" });
      }
      if (!["GET", "HEAD"].includes(req.method))
        requireIt(req.headers.origin === origin, 403, "Origin not allowed");
      if (
        (p.startsWith("/auth/") &&
          (req.method === "POST" || p === "/auth/google")) ||
        (p === "/me/password" && req.method === "PUT")
      ) {
        const key = digest(
          `${trustProxy ? req.headers["x-real-ip"] || req.socket.remoteAddress : req.socket.remoteAddress}:${p}`,
        );
        const limit = await db.query(
          "INSERT INTO auth_limits(key,count,expires_at) VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET count=CASE WHEN auth_limits.expires_at<now() THEN 1 ELSE auth_limits.count+1 END,expires_at=CASE WHEN auth_limits.expires_at<now() THEN now()+interval '15 minutes' ELSE auth_limits.expires_at END RETURNING count",
          [key],
        );
        requireIt(
          limit.rows[0].count <= 30,
          429,
          "Too many attempts. Try later.",
        );
      }
      if (p === "/auth/providers" && req.method === "GET")
        return send(200, {
          google: Boolean(google),
          recovery: recoveryEnabled,
        });
      if (
        await googleRoute({
          req,
          res,
          url,
          p,
          db,
          origin,
          secure,
          client: google,
        })
      )
        return;
      if (p === "/auth/forgot" && req.method === "POST") {
        requireIt(
          recoveryEnabled,
          503,
          "Password recovery is temporarily unavailable. Contact PLP support.",
        );
        const { email } = credentials
          .pick({ email: true })
          .parse(await body(req));
        await requestResetCode(db, email);
        return send(202, {
          message:
            "If an approved account uses that email, a 6-digit code will arrive shortly. Check your spam folder too.",
        });
      }
      if (p === "/auth/forgot/verify" && req.method === "POST") {
        const { email, code } = credentials
          .pick({ email: true })
          .extend({ code: z.string().regex(/^\d{6}$/) })
          .parse(await body(req));
        const token = await confirmResetCode(db, email, code);
        requireIt(
          token,
          400,
          "This code is incorrect, expired or has too many attempts. Request a new code.",
        );
        return send(200, { token });
      }
      if (p === "/auth/reset" && req.method === "POST") {
        const input = z
          .object({
            token: z.string().min(40).max(100),
            password: z.string().min(12).max(128),
          })
          .strict()
          .parse(await body(req));
        const weak = passwordProblem(input.password);
        requireIt(!weak, 400, weak);
        const hash = await hashPassword(input.password);
        await transaction(db, async (tx) => {
          const reset = (
            await tx.query(
              "DELETE FROM password_resets WHERE token_hash=$1 AND expires_at>now() RETURNING user_id",
              [digest(input.token)],
            )
          ).rows[0];
          requireIt(reset, 400, "Recovery link is invalid or expired");
          await tx.query("UPDATE users SET password_hash=$1 WHERE id=$2", [
            hash,
            reset.user_id,
          ]);
          await tx.query("DELETE FROM sessions WHERE user_id=$1", [
            reset.user_id,
          ]);
          await tx.query("DELETE FROM password_resets WHERE user_id=$1", [
            reset.user_id,
          ]);
          await audit(
            tx,
            { id: reset.user_id },
            "password.reset",
            reset.user_id,
          );
        });
        return send(200, { ok: true });
      }
      if (p === "/auth/verification/request" && req.method === "POST") {
        requireIt(
          recoveryEnabled,
          503,
          "Email delivery is currently unavailable. Please try again later.",
        );
        const { email } = credentials
          .pick({ email: true })
          .parse(await body(req));
        await requestVerification(db, email);
        return send(202, {
          message:
            "If your account needs verification, a code will arrive shortly. Check your spam folder too.",
        });
      }
      if (p === "/auth/verification/confirm" && req.method === "POST") {
        const { email, code } = credentials
          .pick({ email: true })
          .extend({ code: z.string().regex(/^\d{6}$/) })
          .parse(await body(req));
        requireIt(
          await confirmVerification(db, email, code),
          400,
          "This code is incorrect, expired or has too many attempts. Request a new code.",
        );
        const verified = (await db.query("SELECT status,requested_role FROM users WHERE email=$1",[email])).rows[0];
        return send(200, {
          awaitingApproval: verified?.status === "pending",
          message: verified?.status === "pending" ? "Email verified. Your staff application is awaiting administrator approval." : "Email verified. You can now sign in.",
        });
      }
      if (p === "/auth/register" && req.method === "POST") {
        const input = credentials.extend({ name: text, requested_role: z.enum(["leader","trainer","mentor"]).optional() }).parse(await body(req));
        const weak = passwordProblem(input.password, { email: input.email, name: input.name });
        requireIt(!weak, 400, weak);
        requireIt(recoveryEnabled, 503, "Email delivery is currently unavailable. Please try again later.");
        const hash = await hashPassword(input.password);
        await db.query(
          "INSERT INTO users(id,email,name,password_hash,requested_role) VALUES($1,$2,$3,$4,$5) ON CONFLICT(email) DO NOTHING",
          [randomUUID(), input.email, input.name, hash, input.requested_role || null],
        );
        await requestVerification(db, input.email);
        return send(202, {
          message:
            "Check your email for a 6-digit verification code before signing in.",
        });
      }
      if (p === "/auth/login" && req.method === "POST") {
        const input = credentials.parse(await body(req));
        // Per-account lockout on top of the per-address limit: 10 failed attempts lock the account for 15 minutes.
        const accountKey = digest(`login-account:${input.email}`);
        const failures = (await db.query("SELECT count FROM auth_limits WHERE key=$1 AND expires_at>now()", [accountKey])).rows[0]?.count ?? 0;
        requireIt(failures < 10, 429, "Too many failed sign-in attempts for this account. Wait 15 minutes or reset your password.");
        const result = await db.query("SELECT * FROM users WHERE email=$1", [
          input.email,
        ]);
        const user = result.rows[0];
        const valid = await verifyPassword(
          input.password,
          user?.password_hash ||
            "00000000000000000000000000000000:" + "00".repeat(64),
        );
        if (!(user && valid)) {
          const count = (await db.query(
            "INSERT INTO auth_limits(key,count,expires_at) VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET count=CASE WHEN auth_limits.expires_at<now() THEN 1 ELSE auth_limits.count+1 END,expires_at=CASE WHEN auth_limits.expires_at<now() THEN now()+interval '15 minutes' ELSE auth_limits.expires_at END RETURNING count",
            [accountKey],
          )).rows[0].count;
          if (user && count === 10) await audit(db, { id: user.id }, "auth.locked", user.id);
        }
        requireIt(user && valid, 401, "Email or password is incorrect");
        await db.query("DELETE FROM auth_limits WHERE key=$1", [accountKey]);
        requireIt(
          user.email_verified_at,
          403,
          "Verify your email before signing in. Request a code on the email verification page.",
        );
        if (user.status === "pending" && user.requested_role)
          return send(200, {pendingApproval:true,requestedRole:user.requested_role});
        requireIt(user.status === "approved", 403, "Your account is not approved. Contact PLP for help.");
        const token = sessionToken();
        // "Keep me signed in" keeps the session cookie for 30 days instead of one.
        const days = input.remember ? 30 : 1;
        await db.query(
          "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+make_interval(days=>$3))",
          [digest(token), user.id, days],
        );
        await audit(db, { id: user.id }, "auth.login", user.id);
        res.setHeader("Set-Cookie", cookie(sessionJwt(user.id, token, days), secure, days));
        return send(200, { id: user.id, name: user.name, role: user.role, requested_role:user.requested_role });
      }
      if (p === "/auth/logout" && req.method === "POST") {
        await db.query("DELETE FROM sessions WHERE token_hash=$1", [
          digest(readToken(req)),
        ]);
        res.setHeader("Set-Cookie", cookie("", secure));
        return send(200, { ok: true });
      }
      if (p === "/public/fun-corner" && req.method === "GET") {
        // Empty lists tell the site to keep its built-in questions and quotes.
        const row = (await db.query("SELECT data FROM content WHERE key='fun-corner'")).rows[0];
        return send(200, row?.data ?? { trivia: [], quotes: [] });
      }
      if (p === "/public/announcement" && req.method === "GET") {
        const row = (
          await db.query("SELECT data FROM content WHERE key='announcement'")
        ).rows[0];
        let data = row?.data;
        const meetingId = data?.href?.match(/^\/meetings\/([a-f0-9-]{36})$/i)?.[1];
        if (meetingId) {
          const meeting = (await db.query('SELECT title,location,opens_at,closes_at,closed FROM meetings WHERE id=$1',[meetingId])).rows[0];
          data = meeting ? {...data,title:meeting.title,location:meeting.location,date:new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Kigali'}).format(meeting.opens_at),endsAt:meeting.closes_at.toISOString(),enabled:data.enabled&&!meeting.closed&&new Date(meeting.closes_at)>new Date()} : null;
        }
        return send(
          200,
          data?.enabled && (data.endsAt ? new Date(data.endsAt)>new Date() : data.date >= new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Kigali"}).format(new Date()))
            ? data
            : {
                enabled: false,
                title: "",
                date: "",
                location: "",
                href: "/",
                linkLabel: "Explore event",
                sample: false,
              },
        );
      }
      if (p.startsWith("/public/certificates/") && req.method === "GET") {
        const id = uuid.parse(p.split("/").at(-1));
        const record = (
          await db.query(
            "SELECT c.id,c.recipient,c.programme,c.issued_at,c.revoked_at,CASE WHEN c.request_id IS NULL THEN 'course' ELSE 'school' END AS kind,c.title,c.citation,c.role,to_char(c.period_from,'YYYY-MM-DD') AS period_from,to_char(c.period_to,'YYYY-MM-DD') AS period_to,s.name AS school FROM certificates c LEFT JOIN schools s ON s.id=c.school_id WHERE c.id=$1",
            [id],
          )
        ).rows[0];
        requireIt(record, 404, "Certificate not found");
        return send(200, record);
      }
      if (p.startsWith("/public/meetings") && await meetingsRoute({p,req,db,send})) return;
      // The JWT must be valid and name a live session belonging to the same user.
      const session = readSession(req);
      const user = (
        await db.query(
          `SELECT ${userFields
            .split(",")
            .map((k) => "u." + k)
            .join(
              ",",
            )} FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND u.id=$2 AND s.expires_at>now() AND u.status='approved' AND u.email_verified_at IS NOT NULL`,
          [digest(session?.sid ?? ""), session?.userId ?? null],
        )
      ).rows[0];
      requireIt(user, 401, "Sign in required");
      if (await liveRoute({ p, req, res, db, user, body: () => body(req), send })) return;
      if (await reportsRoute({ p, req, db, user, send })) return;
      if (await meetingsRoute({p,req,db,user,body:()=>body(req),send})) return;
      if (await teachingRoute({p,req,db,user,body:()=>body(req),send})) return;
      if (await assessmentsRoute({p,req,db,user,body:()=>body(req),send})) return;
      if (await mentorshipRoute({p,req,db,user,body:()=>body(req),send,origin,mailEnabled:recoveryEnabled})) return;
      if (
        p.startsWith("/files") &&
        (await filesRoute({
          req,
          res,
          pathname: p,
          db,
          user,
          directory: uploadDirectory,
        }))
      )
        return;
      if (
        await schoolCertificates({
          path: p,
          method: req.method,
          db,
          user,
          body: () => body(req),
          send,
        })
      )
        return;
      if (await avatarRoute({ req, res, pathname: p, db, user, directory: uploadDirectory })) return;
      if (p === "/me" && req.method === "GET") return send(200, user);
      if (p === "/me/password" && req.method === "PUT") {
        const input = z
          .object({
            current: z.string().max(128),
            password: z.string().min(12).max(128),
          })
          .strict()
          .parse(await body(req));
        const row = (
          await db.query("SELECT password_hash FROM users WHERE id=$1", [
            user.id,
          ])
        ).rows[0];
        requireIt(
          await verifyPassword(input.current, row.password_hash),
          403,
          "Current password is incorrect",
        );
        const weak = passwordProblem(input.password, { email: user.email, name: user.name });
        requireIt(!weak, 400, weak);
        const hash = await hashPassword(input.password);
        await transaction(db, async (tx) => {
          await tx.query("UPDATE users SET password_hash=$1 WHERE id=$2", [
            hash,
            user.id,
          ]);
          await tx.query("DELETE FROM sessions WHERE user_id=$1", [user.id]);
          await audit(tx, user, "password.change", user.id);
        });
        res.setHeader("Set-Cookie", cookie("", secure));
        return send(200, { ok: true });
      }
      if (p === "/announcement" && req.method === "GET") {
        requireIt(user.role === "admin", 403, "Administrator required");
        return send(
          200,
          (await db.query("SELECT data FROM content WHERE key='announcement'"))
            .rows[0]?.data || {
            enabled: false,
            title: "",
            date: "",
            location: "",
            href: "/",
            linkLabel: "Explore event",
          },
        );
      }
      if (
        p.match(/^\/certificates\/[a-f0-9-]+\/download$/) &&
        req.method === "GET"
      ) {
        const id = uuid.parse(p.split("/")[2]);
        const cert = (
          await db.query("SELECT * FROM certificates WHERE id=$1", [id])
        ).rows[0];
        requireIt(
          cert &&
            (user.role === "admin" ||
              cert.member_id === user.id ||
              (user.role === "leader" &&
                user.school_id &&
                cert.school_id === user.school_id)),
          404,
          "Certificate not found",
        );
        requireIt(!cert.revoked_at, 409, "Certificate revoked");
        requireIt(credentialUrl, 503, "Certificate renderer unavailable");
        const rendered = await fetch(new URL("/render", credentialUrl), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cert),
          signal: AbortSignal.timeout(15000),
        });
        requireIt(rendered.ok, 503, "Certificate renderer unavailable");
        const pdf = Buffer.from(await rendered.arrayBuffer());
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="PLP-${id}.pdf"`,
        );
        res.writeHead(200);
        res.end(pdf);
        return;
      }
      if (p === "/overview" && req.method === "GET") {
        const scope = user.role === "admin" ? null : user.id;
        const courses = Number(
          (
            await db.query(
              "SELECT count(*) FROM records WHERE kind='courses' AND data->>'published'='true'",
            )
          ).rows[0].count,
        );
        const events = Number(
          (
            await db.query(
              "SELECT count(*) FROM records WHERE kind='events' AND data->>'date'>=$1",
              [new Date().toISOString().slice(0, 10)],
            )
          ).rows[0].count,
        );
        const completed = Number(
          (
            await db.query(
              "SELECT count(*) FROM enrollments WHERE passed AND ($1::uuid IS NULL OR member_id=$1)",
              [scope],
            )
          ).rows[0].count,
        );
        const certificates = Number(
          (
            await db.query(
              "SELECT count(*) FROM certificates WHERE revoked_at IS NULL AND ($1::uuid IS NULL OR member_id=$1)",
              [scope],
            )
          ).rows[0].count,
        );
        const trend = (
          await db.query(
            "SELECT to_char(issued_at,'YYYY-MM') AS month,count(*)::int AS total FROM certificates WHERE revoked_at IS NULL AND ($1::uuid IS NULL OR member_id=$1) AND issued_at>=date_trunc('month',now())-interval '11 months' GROUP BY 1 ORDER BY 1",
            [scope],
          )
        ).rows;
        return send(200, { courses, events, completed, certificates, trend });
      }
      if (p === "/school-members" && req.method === "GET") {
        requireIt(
          user.role === "admin" || (user.role === "leader" && user.school_id),
          403,
          "School management access required",
        );
        return send(
          200,
          (
            await db.query(
              "SELECT id,name,email,school_id FROM users WHERE status='approved' AND ($1::uuid IS NULL OR school_id=$1) ORDER BY name",
              [user.role === "admin" ? null : user.school_id],
            )
          ).rows,
        );
      }
      if (
        p.match(/^\/schools\/[a-f0-9-]+$/) &&
        ["PUT", "DELETE"].includes(req.method)
      ) {
        requireIt(user.role === "admin", 403, "Administrator required");
        const id = uuid.parse(p.split("/")[2]);
        const input =
          req.method === "PUT"
            ? z
                .object({ name: text, district: text })
                .strict()
                .parse(await body(req))
            : null;
        await transaction(db, async (tx) => {
          const result = input
            ? await tx.query(
                "UPDATE schools SET name=$1,district=$2 WHERE id=$3 RETURNING id",
                [input.name, input.district, id],
              )
            : await tx.query("DELETE FROM schools WHERE id=$1 RETURNING id", [
                id,
              ]);
          requireIt(result.rowCount, 404, "School not found");
          await audit(tx, user, input ? "school.update" : "school.delete", id);
        });
        return send(200, { ok: true });
      }
      if (p === "/users" && req.method === "GET") {
        requireIt(user.role === "admin", 403, "Administrator required");
        return send(
          200,
          (
            await db.query(
              `SELECT ${userFields} FROM users ORDER BY created_at DESC LIMIT 500`,
            )
          ).rows,
        );
      }
      if (p.startsWith("/users/") && req.method === "PATCH") {
        requireIt(user.role === "admin", 403, "Administrator required");
        const id = uuid.parse(p.split("/").at(-1));
        requireIt(id !== user.id, 409, "Cannot change your own access");
        const input = z
          .object({
            role: z.enum(["member", "leader", "trainer", "mentor", "admin"]),
            status: z.enum(["pending", "approved", "suspended", "rejected"]),
            school_id: uuid.nullable(),
            review: z.string().trim().max(1000).optional(),
          })
          .strict()
          .parse(await body(req));
        await transaction(db, async (tx) => {
          const r = await tx.query(
            "UPDATE users SET role=$1,status=$2,school_id=$3,requested_role=NULL,role_review=$5 WHERE id=$4 RETURNING id",
            [input.role, input.status, input.school_id, id,input.review || ""],
          );
          requireIt(r.rowCount, 404, "User not found");
          await tx.query("DELETE FROM sessions WHERE user_id=$1", [id]);
          await audit(tx, user, "access.update", id);
        });
        await onAccessChanged(db, user, id, input.role, input.status);
        return send(200, { ok: true });
      }
      if (p === "/users" && req.method === "POST") {
        requireIt(user.role === "admin", 403, "Administrator required");
        const input = z
          .object({
            name: text,
            email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()),
            role: z.enum(["member", "leader", "trainer", "mentor", "admin"]),
            school_id: uuid.nullable().default(null),
          })
          .strict()
          .parse(await body(req));
        // Administrator-created accounts are pre-approved; the person sets a password with "Forgot password".
        const id = randomUUID();
        const created = await db.query(
          "INSERT INTO users(id,email,name,password_hash,role,status,school_id,email_verified_at) VALUES($1,$2,$3,$4,$5,'approved',$6,now()) ON CONFLICT(email) DO NOTHING RETURNING id",
          [id, input.email, input.name, await hashPassword(randomUUID() + randomUUID()), input.role, input.school_id],
        );
        requireIt(created.rowCount, 409, "An account with this email already exists");
        await audit(db, user, "access.create", id);
        return send(201, { id });
      }
      if (p.startsWith("/users/") && req.method === "DELETE") {
        requireIt(user.role === "admin", 403, "Administrator required");
        const id = uuid.parse(p.split("/").at(-1));
        requireIt(id !== user.id, 409, "You cannot delete your own account");
        try {
          await transaction(db, async (tx) => {
            const r = await tx.query("DELETE FROM users WHERE id=$1 RETURNING id", [id]);
            requireIt(r.rowCount, 404, "User not found");
            await audit(tx, user, "access.delete", id);
          });
        } catch (error) {
          // Accounts with learning, attendance or authored records are kept for the audit trail.
          if (error.code === "23503") throw new HttpError(409, "This account has learning, attendance or authored records. Suspend it instead.");
          throw error;
        }
        return send(200, { ok: true });
      }
      // Trainers author their own courses; administrators only review and publish them.
      if (p === "/course-assignments")
        throw new HttpError(403, "Courses are created by trainers. Approve a trainer in Members & staff instead.");
      if (p === "/material-completions" && req.method === "GET") {
        requireIt(
          user.role === "admin" || (user.role === "leader" && user.school_id),
          403,
          "School leadership access required",
        );
        return send(
          200,
          (
            await db.query(
              "SELECT * FROM material_completions WHERE ($1::uuid IS NULL OR school_id=$1)",
              [user.role === "admin" ? null : user.school_id],
            )
          ).rows,
        );
      }
      if (
        p.match(/^\/materials\/[a-f0-9-]+\/completion$/) &&
        req.method === "PUT"
      ) {
        requireIt(
          user.role === "admin" || (user.role === "leader" && user.school_id),
          403,
          "School leadership access required",
        );
        const id = uuid.parse(p.split("/")[2]);
        const input = z
          .object({ school_id: uuid })
          .strict()
          .parse(await body(req));
        requireIt(
          user.role === "admin" || user.school_id === input.school_id,
          403,
          "School outside your assignment",
        );
        await transaction(db, async (tx) => {
          const material = (
            await tx.query(
              "SELECT * FROM records WHERE id=$1 AND kind='materials' FOR SHARE",
              [id],
            )
          ).rows[0];
          requireIt(
            material &&
              canRead({ ...user, school_id: input.school_id }, material),
            404,
            "Material not found",
          );
          requireIt(
            !material.data.school_ids?.length ||
              material.data.school_ids.includes(input.school_id),
            403,
            "Material is not assigned to this school",
          );
          await tx.query(
            "INSERT INTO material_completions(material_id,school_id,completed_by) VALUES($1,$2,$3) ON CONFLICT(material_id,school_id) DO NOTHING",
            [id, input.school_id, user.id],
          );
          await audit(tx, user, "material.complete", id);
        });
        return send(200, { ok: true });
      }
      if (p === "/reports" && req.method === "GET") {
        requireIt(
          user.role === "admin" || (user.role === "leader" && user.school_id),
          403,
          "Reporting access required",
        );
        const scope = user.role === "admin" ? null : user.school_id;
        return send(
          200,
          (
            await db.query(
              `SELECT s.id,s.name,s.district,
         (SELECT count(*)::int FROM users u WHERE u.school_id=s.id AND u.status='approved') AS accounts,
         (SELECT count(*)::int FROM records r WHERE r.school_id=s.id AND r.kind='members') AS register_members,
         (SELECT count(*)::int FROM records r WHERE r.school_id=s.id AND r.kind='events') AS events,
         (SELECT count(*)::int FROM material_completions m WHERE m.school_id=s.id) AS completed_materials,
         (SELECT count(*)::int FROM certificates c WHERE c.school_id=s.id AND c.revoked_at IS NULL) AS certificates
         FROM schools s WHERE ($1::uuid IS NULL OR s.id=$1) ORDER BY s.name`,
              [scope],
            )
          ).rows,
        );
      }
      if (p === "/schools" && req.method === "GET")
        return send(
          200,
          (await db.query("SELECT * FROM schools ORDER BY name")).rows,
        );
      if (p === "/schools" && req.method === "POST") {
        requireIt(user.role === "admin", 403, "Administrator required");
        const input = z
          .object({ name: text, district: text })
          .strict()
          .parse(await body(req));
        const id = randomUUID();
        await transaction(db, async (tx) => {
          await tx.query(
            "INSERT INTO schools(id,name,district) VALUES($1,$2,$3)",
            [id, input.name, input.district],
          );
          await audit(tx, user, "school.create", id);
        });
        return send(201, { id });
      }
      if (p === "/fun-corner" && req.method === "PUT") {
        requireIt(user.role === "admin", 403, "Administrator required");
        const input = funCornerSchema.parse(await body(req));
        await transaction(db, async (tx) => {
          await tx.query(
            "INSERT INTO content(key,data) VALUES('fun-corner',$1) ON CONFLICT(key) DO UPDATE SET data=$1,updated_at=now()",
            [input],
          );
          await audit(tx, user, "fun-corner.update", "fun-corner");
        });
        return send(200, input);
      }
      if (p === "/fun-corner" && req.method === "DELETE") {
        requireIt(user.role === "admin", 403, "Administrator required");
        await transaction(db, async (tx) => {
          await tx.query("DELETE FROM content WHERE key='fun-corner'");
          await audit(tx, user, "fun-corner.reset", "fun-corner");
        });
        return send(200, { trivia: [], quotes: [] });
      }
      if (p === "/announcement" && req.method === "PUT") {
        requireIt(user.role === "admin", 403, "Administrator required");
        const input = z
          .object({
            enabled: z.boolean(),
            title: text,
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            location: z.string().max(200),
            href: z
              .string()
              .max(1000)
              .refine(
                (v) =>
                  (/^\/(?!\/)/.test(v) || v.startsWith("https://")) &&
                  !/[\\\s]/.test(v),
              ),
            linkLabel: text,
          })
          .strict()
          .parse(await body(req));
        await transaction(db, async (tx) => {
          await tx.query(
            "INSERT INTO content(key,data) VALUES('announcement',$1) ON CONFLICT(key) DO UPDATE SET data=$1,updated_at=now()",
            [input],
          );
          await audit(tx, user, "announcement.update", "announcement");
        });
        return send(200, input);
      }
      const match = p.match(/^\/records\/([a-z]+)(?:\/([a-f0-9-]+))?$/);
      if (match) {
        const [, kind, id] = match;
        requireIt(kinds.includes(kind), 404, "Unknown resource");
        if (id) uuid.parse(id);
        if (req.method === "GET") {
          const values = [kind];
          let where = "kind=$1";
          if (id) {
            values.push(id);
            where += " AND id=$2";
          }
          if (user.role !== "admin") {
            let owner = "";
            if (
              [
                "applications",
                "mentorship",
                "projects",
                "proofs",
                "courses",
              ].includes(kind)
            ) {
              values.push(user.id);
              owner = "$" + values.length;
            }
            if (
              ["applications", "mentorship", "projects", "proofs"].includes(
                kind,
              )
            )
              where += " AND owner_id=" + owner;
            if (kind === "courses")
              where += ` AND (data->>'published'='true' OR owner_id=${owner})`;
            if (kind === "members") {
              if (user.role === "leader") {
                values.push(user.school_id);
                where += " AND school_id=$" + values.length;
              } else where += " AND false";
            }
          }
          if (user.role !== "admin" && kind === "materials") {
            values.push(user.school_id);
            where += ` AND (COALESCE(jsonb_array_length(data->'school_ids'),0)=0 OR data->'school_ids' @> jsonb_build_array($${values.length}::text))`;
          }
          const records = (
            await db.query(
              "SELECT * FROM records WHERE " +
                where +
                " ORDER BY created_at DESC LIMIT 500",
              values,
            )
          ).rows
            .filter((r) => canRead(user, r))
            .map((r) => publicRecord(r, user));
          if (id) {
            requireIt(records[0], 404, "Record not found");
            return send(200, records[0]);
          }
          return send(200, records);
        }
        if (req.method === "POST" && !id) {
          requireIt(canWrite(user, kind), 403, "Not allowed");
          requireIt(kind !== "courses" || user.role === "trainer", 403, "Courses are created by approved trainers");
          const input = recordSchema.parse(await body(req));
          if (kind === "courses") withVideoAttachments(input);
          requireIt(
            user.role === "admin" ||
              !input.school_id ||
              input.school_id === user.school_id,
            403,
            "School outside your assignment",
          );
          if (kind === "courses") {
            // Trainers publish their own courses once they meet the publication checklist.
            if (input.published) validatePublishable(input);
            // Trainers mark their own course approved when they publish it.
            if(user.role!=="admin")requireIt(!input.review_state || ["draft","submitted"].includes(input.review_state) || (input.review_state==="approved" && input.published),403,"Only administrators approve courses");
            if(user.role!=="admin")requireIt(!input.review_note,403,"Only administrators can write publication feedback");
            validateCourse(input);
          }
          if (["applications", "proofs", "mentorship"].includes(kind)) {
            requireIt(
              user.role === "admin" ||
                !input.status ||
                input.status === "pending",
              403,
              "Only administrators can review submissions",
            );
            requireIt(
              user.role === "admin" || !input.feedback,
              403,
              "Only administrators can write review feedback",
            );
            input.status = input.status || "pending";
          }
          // ALX certificates are recognised on upload; administrators can revoke one afterwards.
          if (kind === "proofs") input.status = "approved";
          if (kind === "applications" && input.category?.startsWith("activity:")) {
            const event = (await db.query("SELECT data FROM records WHERE kind='events' AND id::text=$1", [input.category.slice(9)])).rows[0];
            requireIt(event, 404, "Activity not found");
            requireIt(event.data.date >= kigaliToday(), 409, "This activity has already taken place.");
            requireIt(!(await db.query("SELECT 1 FROM records WHERE kind='applications' AND owner_id=$1 AND data->>'category'=$2 AND coalesce(data->>'status','')<>'rejected'", [user.id, input.category])).rowCount, 409, "You have already said you'll participate.");
          }
          if (kind === "members")
            requireIt(
              input.school_id || user.school_id,
              400,
              "A school is required for register entries",
            );
          if (kind === "opportunities")
            requireIt(input.apply_mode !== "external" || !!input.url, 400, "External opportunities need an https:// application link");
          if (kind === "applications" && input.reference_id) {
            // One application per member per opportunity, and only to opportunities that are open.
            const target = (await db.query("SELECT data FROM records WHERE id=$1 AND kind='opportunities'", [input.reference_id])).rows[0];
            requireIt(target?.data.published, 404, "Opportunity not found");
            requireIt(!target.data.deadline || target.data.deadline >= new Date().toISOString().slice(0, 10), 409, "Applications for this opportunity are closed");
            requireIt(!(await db.query("SELECT 1 FROM records WHERE kind='applications' AND owner_id=$1 AND data->>'reference_id'=$2", [user.id, input.reference_id])).rowCount, 409, "You have already applied");
          }
          // Content rules run after the permission checks above, so a refused action is never reported as a typing mistake.
          validateRecord(kind, input);
          const rid = randomUUID();
          await transaction(db, async (tx) => {
            await validateAttachments(tx, user, input);
            await tx.query(
              "INSERT INTO records(id,kind,owner_id,school_id,data) VALUES($1,$2,$3,$4,$5)",
              [
                rid,
                kind,
                user.id,
                user.role === "admin" && input.school_id
                  ? input.school_id
                  : user.school_id,
                input,
              ],
            );
            await audit(tx, user, kind + ".create", rid);
          });
          await onRecordCreated(db, user, kind, input, user.role === "admin" && input.school_id ? input.school_id : user.school_id);
          return send(201, { id: rid });
        }
        if (id && ["PUT", "DELETE"].includes(req.method)) {
          const input =
            req.method === "PUT"
              ? z
                  .object({
                    version: z.number().int().positive(),
                    data: recordSchema,
                  })
                  .strict()
                  .parse(await body(req))
              : null;
          if (input && kind === "courses") withVideoAttachments(input.data);
          let prior;
          await transaction(db, async (tx) => {
            const row = (
              await tx.query(
                "SELECT * FROM records WHERE id=$1 AND kind=$2 FOR UPDATE",
                [id, kind],
              )
            ).rows[0];
            requireIt(row, 404, "Record not found");
            requireIt(canWrite(user, kind, row), 403, "Not allowed");
            prior = row;
            if (input) {
              validateRecord(kind, input.data, row.data);
              if (
                ["applications", "proofs", "mentorship"].includes(kind) &&
                user.role !== "admin"
              ) {
                requireIt(
                  (input.data.status || "pending") ===
                    (row.data.status || "pending") &&
                    (input.data.feedback || "") === (row.data.feedback || ""),
                  403,
                  "Only administrators can review submissions",
                );
              }
              requireIt(
                !input.data.school_id || input.data.school_id === row.school_id,
                409,
                "School assignment cannot be changed here",
              );
              await validateAttachments(tx, user, input.data);
              requireIt(
                input.version === row.version,
                409,
                "Record changed. Reload before editing",
              );
              if (kind === "courses") {
                // Administrators review: they may publish, unpublish or request changes, never rewrite content.
                if (user.role === "admin")
                  requireIt(
                    isDeepStrictEqual(
                      { ...input.data, published: false, review_state: null, review_note: null },
                      { ...row.data, published: false, review_state: null, review_note: null },
                    ),
                    403,
                    "Administrators review courses but cannot change their content",
                  );
                if(user.role!=="admin") {
                  requireIt(!input.data.review_state || ["draft","submitted"].includes(input.data.review_state) || input.data.review_state===row.data.review_state || (input.data.review_state==="approved" && input.data.published),403,"Only administrators approve courses");
                  requireIt((input.data.review_note||"")===(row.data.review_note||""),403,"Only administrators can write publication feedback");
                }
                validateCourse(input.data);
                const enrolled = await tx.query(
                  "SELECT 1 FROM enrollments WHERE course_id=$1 LIMIT 1",
                  [id],
                );
                requireIt(
                  !enrolled.rowCount ||
                    isDeepStrictEqual(
                      { ...input.data, published: false, review_state:null,review_note:null },
                      { ...row.data, published: false, review_state:null,review_note:null },
                    ),
                  409,
                  "Enrolled course content is locked. Create a new course version.",
                );
              }
              if (kind === "courses" && input.data.published && !row.data.published) validatePublishable(input.data);
              await tx.query(
                "UPDATE records SET data=$1,version=version+1,updated_at=now() WHERE id=$2",
                [input.data, id],
              );
            } else {
              if (kind === "courses")
                requireIt(!(await tx.query("SELECT 1 FROM enrollments WHERE course_id=$1 LIMIT 1", [id])).rowCount, 409, "Courses with enrolled learners cannot be deleted. Unpublish it instead.");
              if (kind === "opportunities")
                requireIt(!(await tx.query("SELECT 1 FROM records WHERE kind='applications' AND data->>'reference_id'=$1 LIMIT 1", [id])).rowCount, 409, "This opportunity has applications. Unpublish it instead.");
              await tx.query("DELETE FROM records WHERE id=$1", [id]);
            }
            await audit(
              tx,
              user,
              kind + "." + (input ? "update" : "delete"),
              id,
            );
          });
          if (input) await onRecordUpdated(db, user, kind, prior.data, input.data, prior);
          return send(200, { ok: true });
        }
      }
      if (p === "/enrollments" && req.method === "GET")
        return send(
          200,
          (
            await db.query("SELECT * FROM enrollments WHERE member_id=$1", [
              user.id,
            ])
          ).rows,
        );
      if (p === "/enrollments" && req.method === "POST") {
        const input = z
          .object({ course_id: uuid })
          .strict()
          .parse(await body(req));
        await transaction(db, async (tx) => {
          const course = (
            await tx.query(
              "SELECT * FROM records WHERE id=$1 AND kind='courses' FOR UPDATE",
              [input.course_id],
            )
          ).rows[0];
          requireIt(course?.data.published, 404, "Published course not found");
          await tx.query(
            "INSERT INTO enrollments(id,member_id,course_id) VALUES($1,$2,$3) ON CONFLICT(member_id,course_id) DO NOTHING",
            [randomUUID(), user.id, input.course_id],
          );
        });
        return send(200, { ok: true });
      }
      if (
        p.match(/^\/enrollments\/[a-f0-9-]+\/progress$/) &&
        req.method === "POST"
      ) {
        const id = uuid.parse(p.split("/")[2]);
        const input = z
          .object({
            lesson: z.number().int().min(0).optional(),
            assignment: z.string().max(10000).optional(),
            answer: z.number().int().min(0).optional(),
          })
          .strict()
          .parse(await body(req));
        const result = await transaction(db, async (tx) => {
          const e = (
            await tx.query(
              "SELECT * FROM enrollments WHERE id=$1 AND member_id=$2 FOR UPDATE",
              [id, user.id],
            )
          ).rows[0];
          requireIt(e, 404, "Enrollment not found");
          const course = (
            await tx.query("SELECT * FROM records WHERE id=$1", [e.course_id])
          ).rows[0];
          requireIt(course?.data.published, 409, "Course unavailable");
          const lessons = course.data.lessons || [];
          // Assessed courses complete only through graded attempts; this endpoint just stores the assignment.
          if (course.data.exam?.length) {
            requireIt(input.lesson === undefined && input.answer === undefined, 409, "Modules and the final exam are completed by passing their timed assessments");
            if (input.assignment !== undefined) {
              requireIt(lessons.every((_, i) => e.lessons.includes(i)), 400, "Pass every module quiz before submitting the assignment");
              requireIt(!e.passed, 409, "The assignment is locked after the final exam is passed");
              requireIt(wordCount(input.assignment) >= 60, 400, "Write at least 60 words");
              await tx.query("UPDATE enrollments SET assignment=$1,assignment_at=now(),reviewed_at=NULL WHERE id=$2", [input.assignment.trim(), id]);
            }
            await audit(tx, user, "learning.progress", id);
            return { passed: e.passed };
          }
          if (input.lesson !== undefined) {
            requireIt(input.lesson < lessons.length, 400, "Unknown lesson");
            e.lessons = [...new Set([...e.lessons, input.lesson])];
          }
          if (input.assignment !== undefined) e.assignment = input.assignment;
          let passed = e.passed;
          if (input.answer !== undefined) {
            requireIt(
              lessons.length > 0 &&
                e.lessons.length === lessons.length &&
                e.assignment.trim().length >= 20,
              400,
              "Complete lessons and assignment first",
            );
            // One question is easy to guess, so wrong answers are limited: 3 in total, at most one per 24 hours.
            if (!e.passed) {
              requireIt(e.legacy_wrong < 3, 429, "You have used all 3 attempts for this knowledge check. Ask the course trainer for help.");
              requireIt(!e.legacy_last_wrong || Date.now() - new Date(e.legacy_last_wrong).getTime() >= 86400000, 429, "After a wrong answer, you can try again in 24 hours. Review the lessons in the meantime.");
              passed = input.answer === course.data.answer;
              if (!passed) await tx.query("UPDATE enrollments SET legacy_wrong=legacy_wrong+1,legacy_last_wrong=now() WHERE id=$1", [id]);
            }
          }
          await tx.query(
            "UPDATE enrollments SET lessons=$1,assignment=$2,passed=$3,completed_at=CASE WHEN $3 THEN COALESCE(completed_at,now()) ELSE completed_at END WHERE id=$4",
            [e.lessons, e.assignment, passed, id],
          );
          if (passed)
            await tx.query(
              "INSERT INTO certificates(id,member_id,course_id,recipient,programme) VALUES($1,$2,$3,$4,$5) ON CONFLICT(member_id,course_id) DO NOTHING",
              [randomUUID(), user.id, course.id, user.name, course.data.title],
            );
          if (passed)
            await tx.query(
              "INSERT INTO credits(id,member_id,source,label,amount) VALUES($1,$2,$3,$4,50) ON CONFLICT(member_id,source) DO NOTHING",
              [
                randomUUID(),
                user.id,
                "course:" + course.id,
                "Completed " + course.data.title,
              ],
            );
          await audit(tx, user, "learning.progress", id);
          return { passed };
        });
        return send(200, result);
      }
      // How many people said they'll participate, per activity the user organises (all activities for admins).
      if (p === "/events/registrations/summary" && req.method === "GET") {
        if (!["admin", "leader"].includes(user.role)) return send(200, {});
        const rows = (await db.query(
          "SELECT e.id, count(a.id)::int AS going FROM records e JOIN records a ON a.kind='applications' AND a.data->>'category'='activity:'||e.id::text AND coalesce(a.data->>'status','')<>'rejected' WHERE e.kind='events' AND ($1 OR (e.school_id IS NOT NULL AND e.school_id=$2)) GROUP BY e.id",
          [user.role === "admin", user.school_id],
        )).rows;
        return send(200, Object.fromEntries(rows.map((r) => [r.id, r.going])));
      }
      // Organisers see who registered for their activity; registrations are otherwise private to each member.
      if (p.match(/^\/events\/[a-f0-9-]+\/registrations$/) && req.method === "GET") {
        const id = uuid.parse(p.split("/")[2]);
        const event = (await db.query("SELECT * FROM records WHERE id=$1 AND kind='events'", [id])).rows[0];
        requireIt(event && canWrite(user, "events", event), 403, "Event management access required");
        return send(200, (await db.query(
          // Organisers see emails of their own school's members only; administrators see all.
          "SELECT r.id, r.owner_id AS member_id, u.name, CASE WHEN $2 OR u.school_id=$3 THEN u.email ELSE '' END AS email, r.created_at, coalesce(r.data->>'status','registered') AS status FROM records r JOIN users u ON u.id=r.owner_id WHERE r.kind='applications' AND r.data->>'category'=$1 AND coalesce(r.data->>'status','')<>'rejected' ORDER BY r.created_at",
          [`activity:${id}`, user.role === "admin", user.school_id],
        )).rows);
      }
      if (p.match(/^\/events\/[a-f0-9-]+\/attendance$/)) {
        const id = uuid.parse(p.split("/")[2]);
        const event = (
          await db.query(
            "SELECT * FROM records WHERE id=$1 AND kind='events'",
            [id],
          )
        ).rows[0];
        requireIt(
          event && canWrite(user, "events", event),
          403,
          "Event management access required",
        );
        if (req.method === "GET")
          return send(200, [
            ...(
              await db.query(
                "SELECT member_id FROM attendance WHERE event_id=$1",
                [id],
              )
            ).rows,
            ...(
              await db.query(
                "SELECT school_member_id AS register_member_id FROM register_attendance WHERE event_id=$1",
                [id],
              )
            ).rows,
          ]);
        if (req.method === "PUT") {
          const input = z
            .object({
              member_ids: z.array(uuid).max(500),
              register_member_ids: z.array(uuid).max(500).optional(),
            })
            .strict()
            .parse(await body(req));
          await transaction(db, async (tx) => {
            await tx.query("SELECT id FROM records WHERE id=$1 FOR UPDATE", [
              id,
            ]);
            if (input.register_member_ids) {
              for (const mid of input.register_member_ids) {
                const m = (
                  await tx.query(
                    "SELECT school_id FROM records WHERE id=$1 AND kind='members'",
                    [mid],
                  )
                ).rows[0];
                requireIt(
                  m &&
                    (user.role === "admin" || m.school_id === user.school_id),
                  403,
                  "Register member outside your school",
                );
              }
              await tx.query(
                "DELETE FROM register_attendance WHERE event_id=$1",
                [id],
              );
              for (const mid of new Set(input.register_member_ids))
                await tx.query(
                  "INSERT INTO register_attendance(event_id,school_member_id,recorded_by) VALUES($1,$2,$3)",
                  [id, mid, user.id],
                );
            }
            for (const mid of input.member_ids) {
              const member = (
                await tx.query("SELECT school_id FROM users WHERE id=$1", [mid])
              ).rows[0];
              const registered = (await tx.query("SELECT 1 FROM records WHERE kind='applications' AND owner_id=$1 AND data->>'category'=$2 AND coalesce(data->>'status','')<>'rejected'", [mid, `activity:${id}`])).rowCount > 0;
              requireIt(
                member &&
                  (user.role === "admin" ||
                    member.school_id === user.school_id ||
                    registered),
                403,
                "Member outside your school",
              );
            }
            await tx.query("DELETE FROM attendance WHERE event_id=$1", [id]);
            for (const mid of new Set(input.member_ids))
              await tx.query(
                "INSERT INTO attendance(event_id,member_id,recorded_by) VALUES($1,$2,$3)",
                [id, mid, user.id],
              );
            await audit(tx, user, "attendance.update", id);
          });
          return send(200, { ok: true });
        }
      }
      if (p === "/credits/balance" && req.method === "GET")
        return send(200, (await db.query("SELECT COALESCE(sum(amount),0)::int AS balance FROM credits WHERE member_id=$1", [user.id])).rows[0]);
      if (p === "/credits" && req.method === "GET")
        return send(
          200,
          (
            await db.query(
              "SELECT id,source,label,amount,awarded_at FROM credits WHERE member_id=$1 ORDER BY awarded_at DESC LIMIT 500",
              [user.id],
            )
          ).rows,
        );
      if (p.match(/^\/events\/[a-f0-9-]+\/report$/) && req.method === "POST") {
        const id = uuid.parse(p.split("/")[2]);
        const input = z
          .object({ report: z.string().trim().min(20).max(10000) })
          .strict()
          .parse(await body(req));
        let reported;
        await transaction(db, async (tx) => {
          const event = (
            await tx.query(
              "SELECT * FROM records WHERE id=$1 AND kind='events' FOR UPDATE",
              [id],
            )
          ).rows[0];
          requireIt(
            event && canWrite(user, "events", event),
            403,
            "Event management access required",
          );
          requireIt(!event.data.date || event.data.date <= kigaliToday(), 409, "You can submit the report on or after the activity date.");
          await tx.query(
            "UPDATE records SET data=jsonb_set(data,'{report}',$1::jsonb),version=version+1,updated_at=now() WHERE id=$2",
            [JSON.stringify(input.report), id],
          );
          // Credits go to attending accounts, including register members whose email matches an approved account.
          const attendees = (
            await tx.query(
              // Register entries earn credits only for an account at that school, or one that signed up for the activity,
              // so typing someone's email into a register cannot hand them credits.
              "SELECT a.member_id FROM attendance a JOIN users u ON u.id=a.member_id WHERE a.event_id=$1 AND u.status='approved' UNION SELECT u.id FROM register_attendance ra JOIN records r ON r.id=ra.school_member_id JOIN users u ON lower(u.email)=lower(r.data->>'email') WHERE ra.event_id=$1 AND u.status='approved' AND (u.school_id=r.school_id OR EXISTS (SELECT 1 FROM records ap WHERE ap.kind='applications' AND ap.owner_id=u.id AND ap.data->>'category'='activity:'||$1::text))",
              [id],
            )
          ).rows;
          const amount = {
            Meeting: 10,
            Volunteering: 20,
            Challenge: 25,
            Recruitment: 15,
          }[event.data.activity_type || "Meeting"] ?? 10;
          for (const row of attendees)
            await tx.query(
              "INSERT INTO credits(id,member_id,source,label,amount) VALUES($1,$2,$3,$4,$5) ON CONFLICT(member_id,source) DO NOTHING",
              [
                randomUUID(),
                row.member_id,
                "activity:" + id,
                event.data.title,
                amount,
              ],
            );
          await audit(tx, user, "activity.report", id);
          // Everyone recorded as present, including register members without an account (who earn no credits).
          const present = (await tx.query("SELECT (SELECT count(*) FROM attendance WHERE event_id=$1) + (SELECT count(*) FROM register_attendance WHERE event_id=$1) AS n", [id])).rows[0].n;
          reported = { event, attendees: attendees.map((r) => r.member_id), amount, present: Number(present) };
        });
        await onActivityReported(db, user, reported.event, reported.attendees, reported.amount, reported.present);
        return send(200, { ok: true });
      }
      if (p === "/certificates" && req.method === "GET") {
        return send(
          200,
          (
            await db.query(
              // Everyone, including administrators and club leaders, sees only certificates issued to them here.
              "SELECT c.id,c.recipient,c.programme,c.issued_at,c.revoked_at,CASE WHEN c.request_id IS NULL THEN 'course' ELSE 'school' END AS kind,c.title,c.citation,c.role,to_char(c.period_from,'YYYY-MM-DD') AS period_from,to_char(c.period_to,'YYYY-MM-DD') AS period_to,s.name AS school,c.course_id FROM certificates c LEFT JOIN schools s ON s.id=c.school_id WHERE c.member_id=$1 ORDER BY c.issued_at DESC LIMIT 500",
              [user.id],
            )
          ).rows,
        );
      }
      if (p === "/certificates" && req.method === "POST") {
        requireIt(user.role === "admin", 403, "Administrator required");
        const input = z
          .object({ member_id: uuid, programme: text })
          .strict()
          .parse(await body(req));
        const id = randomUUID();
        await transaction(db, async (tx) => {
          const member = (
            await tx.query(
              "SELECT name FROM users WHERE id=$1 AND status='approved'",
              [input.member_id],
            )
          ).rows[0];
          requireIt(member, 400, "Approved member required");
          await tx.query(
            "INSERT INTO certificates(id,member_id,recipient,programme,issued_by) VALUES($1,$2,$3,$4,$5)",
            [id, input.member_id, member.name, input.programme, user.id],
          );
          await audit(tx, user, "certificate.issue", id);
        });
        return send(201, { id });
      }
      if (
        p.match(/^\/certificates\/[a-f0-9-]+\/revoke$/) &&
        req.method === "POST"
      ) {
        requireIt(user.role === "admin", 403, "Administrator required");
        const id = uuid.parse(p.split("/")[2]);
        const input = z
          .object({ reason: text })
          .strict()
          .parse(await body(req));
        await transaction(db, async (tx) => {
          const r = await tx.query(
            "UPDATE certificates SET revoked_at=now(),reason=$1 WHERE id=$2 AND revoked_at IS NULL",
            [input.reason, id],
          );
          requireIt(r.rowCount, 404, "Active certificate not found");
          await audit(tx, user, "certificate.revoke", id);
        });
        return send(200, { ok: true });
      }
      if (p === "/audit" && req.method === "GET") {
        requireIt(user.role === "admin", 403, "Administrator required");
        return send(
          200,
          (await db.query("SELECT * FROM audit_log ORDER BY id DESC LIMIT 200"))
            .rows,
        );
      }
      send(404, { error: "Not found" });
    } catch (error) {
      if (error instanceof z.ZodError)
        return send(400, {
          error: "Invalid input",
          fields: error.issues.map((i) => i.path.join(".")),
        });
      if (error.code === "23503")
        return send(409, {
          error: "Record is referenced or linked record does not exist",
        });
      if (error.code === "23505")
        return send(409, { error: "Record already exists" });
      send(error.status || 500, {
        error: error.status ? error.message : "Request failed",
      });
      if (!error.status)
        console.error("Request failed", error.code || error.name);
    }
  });
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const db = connectDatabase(),
    server = createServer({
      db,
      origin: process.env.APP_ORIGIN,
      secure: process.env.NODE_ENV !== "development",
      trustProxy: process.env.TRUST_PROXY === "true",
    });
  // Course video uploads (up to 500 MB) can take longer than Node's 5-minute default on slow connections.
  server.requestTimeout = 60 * 60 * 1000;
  server.listen(Number(process.env.PORT || 8082), "0.0.0.0");
  process.on("SIGTERM", () =>
    server.close(async () => {
      await db.end();
      process.exit(0);
    }),
  );
}
