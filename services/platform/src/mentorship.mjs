import { onMentorship } from "./notify-rules.mjs";
import { renderEmail } from "./email-template.mjs";
import { transaction } from "./db.mjs";
import { randomUUID } from "node:crypto";
import { z } from "zod";

// Requests may only email PLP mentor mailboxes (or registered members, when a mentor replies).
export const mentorDomains = (env = process.env) =>
  (env.MENTOR_EMAIL_DOMAINS || "peaceloveproclaimers.org").split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
const HOURLY_LIMIT = 20;
const line = z.string().trim().max(200);
const notifySchema = z.object({
  kind: z.enum(["requested", "updated", "cancelled", "confirmed", "declined", "rescheduled", "completed"]),
  session_id: z.string().uuid(),
  recipient_email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()),
  recipient_name: line.min(1),
  mentor_name: line.min(1),
  mentee_name: line.min(1),
  topic: line.default(""),
  date: z.string().datetime(),
  goal: z.string().trim().max(1200).default(""),
  meeting_link: z.string().trim().max(300).default(""),
  session_type: z.enum(["Online", "In person", "Visit"]).default("Online"),
  location: z.string().trim().max(300).default(""),
  note: z.string().trim().max(2000).default(""),
}).strict();
const toMentor = new Set(["requested", "updated", "cancelled"]);
const profileSchema = z.object({
  title: z.string().trim().min(3).max(100),
  area: z.string().trim().min(3).max(60),
  bio: z.string().trim().min(20).max(600),
  avatar: z.string().trim().max(500).refine((v) => v === "" || (URL.canParse(v) && new URL(v).protocol === "https:"), "Use an https:// photo address").default(""),
  accepting: z.boolean().default(true),
}).strict();
function demand(ok, status, message) { if (!ok) throw Object.assign(new Error(message), { status }); }
const kigaliTime = (iso) => new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Kigali" }).format(new Date(iso)) + " (Kigali time)";

/** `replyTo` is the mentee's address, shown to the mentor so they can reply directly. */
export function composeMentorshipEmail(input, origin, replyTo = "") {
  const when = kigaliTime(input.date);
  const dashboard = new URL("/mentor-sessions", origin).href, mine = new URL("/mentorship", origin).href;
  const details = [["Session time", when], ["Format", input.session_type || "Online"], ...(input.location ? [["Location", input.location]] : []), ...(input.meeting_link ? [["Meeting", input.meeting_link]] : []), ...(input.topic ? [["Topic", input.topic]] : []), ...(input.goal ? [["Goal", input.goal]] : [])];
  const message = input.note ? { label: "Message", text: input.note } : undefined;
  const toMentorGreeting = `Hello ${input.mentor_name},`, toMenteeGreeting = `Hello ${input.mentee_name},`;
  const spec = {
    requested: { subject: `New mentorship session request from ${input.mentee_name}`, greeting: toMentorGreeting, heading: "New session request", paragraphs: [`${input.mentee_name} has requested a mentorship session with you on PLP Hub.`], details, button: { label: "Review the request", url: dashboard }, footnote: "Accept, reschedule or decline it from your mentor dashboard." },
    updated: { subject: `${input.mentee_name} updated their mentorship request`, greeting: toMentorGreeting, heading: "A session request was updated", paragraphs: [`${input.mentee_name} changed their session request.`], details, button: { label: "Review the request", url: dashboard } },
    cancelled: { subject: `${input.mentee_name} cancelled a mentorship session`, greeting: toMentorGreeting, heading: "Session cancelled", paragraphs: [`${input.mentee_name} cancelled the session planned for ${when}.`], button: { label: "Open your dashboard", url: dashboard } },
    confirmed: { subject: `${input.mentor_name} confirmed your mentorship session`, greeting: toMenteeGreeting, heading: "Your session is confirmed", paragraphs: [`${input.mentor_name} confirmed your mentorship session.`], details, note: message, button: { label: "View my sessions", url: mine } },
    declined: { subject: `${input.mentor_name} is unable to take your session request`, greeting: toMenteeGreeting, heading: "Your request was declined", paragraphs: [`${input.mentor_name} cannot take the session requested for ${when}.`], note: message, button: { label: "Request another time or mentor", url: mine } },
    rescheduled: { subject: `${input.mentor_name} updated the time of your session`, greeting: toMenteeGreeting, heading: "Your session has a new time", paragraphs: [`${input.mentor_name} moved your session.`], details: [["New time", when], ...details.slice(1)], note: message, button: { label: "View my sessions", url: mine } },
    completed: { subject: `Your session with ${input.mentor_name} is complete`, greeting: toMenteeGreeting, heading: "Thank you for meeting", paragraphs: [`Thank you for meeting with ${input.mentor_name}.`], note: input.note ? { label: "Session notes", text: input.note } : undefined, button: { label: "Add your takeaway", url: mine } },
  }[input.kind];
  if (replyTo) spec.footnote = [spec.footnote, `Reply to the mentee at ${replyTo}.`].filter(Boolean).join(" ");
  const { html, text } = renderEmail({ origin, preheader: spec.paragraphs[0], ...spec });
  return { subject: spec.subject, body: text, html };
}

export async function mentorshipRoute({ p, req, db, user, body, send, origin, mailEnabled, env = process.env }) {
  if (p === "/mentors" && req.method === "GET") {
    send(200,(await db.query("SELECT u.id,u.name,u.email,coalesce(m.title,'') AS title,coalesce(m.area,'') AS area,coalesce(m.bio,'') AS bio,CASE WHEN u.avatar_file_id IS NOT NULL THEN '/api/avatars/'||u.id||'?v='||u.avatar_file_id ELSE coalesce(m.avatar,'') END AS avatar,coalesce(m.accepting,true) AS accepting FROM users u LEFT JOIN mentor_profiles m ON m.user_id=u.id WHERE u.role='mentor' AND u.status='approved' AND u.email_verified_at IS NOT NULL ORDER BY u.name")).rows);return true;
  }
  if (p === "/mentors/me" && req.method === "PUT") {
    demand(user.role === "mentor", 403, "Approved mentor access required");
    const input = profileSchema.parse(await body());
    await db.query("INSERT INTO mentor_profiles(user_id,title,area,bio,avatar,accepting) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(user_id) DO UPDATE SET title=$2,area=$3,bio=$4,avatar=$5,accepting=$6,updated_at=now()", [user.id, input.title, input.area, input.bio, input.avatar, input.accepting]);
    send(200, { ok: true });
    return true;
  }
  if (p === "/mentorship/sessions" && req.method === "GET") {
    send(200,(await db.query("SELECT s.*,m.name AS member_name,m.email AS member_email,t.name AS mentor_name,t.email AS mentor_email FROM mentor_sessions s JOIN users m ON m.id=s.member_id JOIN users t ON t.id=s.mentor_id WHERE s.member_id=$1 OR (s.mentor_id=$1 AND $2='mentor') ORDER BY s.date",[user.id,user.role])).rows);return true;
  }
  if (p !== "/mentorship/notify") return false;
  demand(req.method === "POST", 405, "Method not allowed");

  const input = notifySchema.parse(await body());
  if (/^[a-z][a-z0-9+.-]*:/i.test(input.meeting_link)) demand(URL.canParse(input.meeting_link) && new URL(input.meeting_link).protocol === 'https:', 400, 'Use an HTTPS meeting link');
  const parties=await transaction(db,async tx=>{
    const existing=(await tx.query('SELECT * FROM mentor_sessions WHERE id=$1 FOR UPDATE',[input.session_id])).rows[0];
    if(toMentor.has(input.kind)) {
      const mentor=(await tx.query("SELECT id,name,email FROM users WHERE email=$1 AND role='mentor' AND status='approved' AND email_verified_at IS NOT NULL",[input.recipient_email])).rows[0];
      demand(mentor,400,'Choose an approved mentor');
      demand(mentor.id!==user.id,400,'Choose another mentor');
      if(input.kind==='requested') {
        demand(!(await tx.query('SELECT 1 FROM mentor_profiles WHERE user_id=$1 AND NOT accepting',[mentor.id])).rowCount,409,'This mentor is not taking new requests right now');
        demand(!existing,409,'Session already exists');demand(new Date(input.date)>new Date(),400,'Choose a future session time');
        await tx.query("INSERT INTO mentor_sessions(id,member_id,mentor_id,date,topic,goal,session_type,location,meeting_link) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",[input.session_id,user.id,mentor.id,input.date,input.topic,input.goal,input.session_type,input.location,input.meeting_link]);
      } else {
        demand(existing&&existing.member_id===user.id&&existing.mentor_id===mentor.id,404,'Session not found');
        demand(['Requested','Confirmed'].includes(existing.status),409,'This session can no longer be changed');
        if(input.kind==='updated')demand(new Date(input.date)>new Date(),400,'Choose a future session time');
        await tx.query("UPDATE mentor_sessions SET date=$2,topic=$3,goal=$4,status=$5,meeting_link=$6,session_type=$7,location=$8,updated_at=now() WHERE id=$1",[input.session_id,input.date,input.topic,input.goal,input.kind==='cancelled'?'Cancelled':'Requested',input.meeting_link,input.session_type,input.location]);
      }
      return {mentor_name:mentor.name,mentee_name:user.name,recipient_email:mentor.email};
    }
    demand(user.role==='mentor',403,'Approved mentor access required');
    demand(existing&&existing.mentor_id===user.id,404,'Session not found');
    demand(['Requested','Confirmed'].includes(existing.status),409,'This session is already closed');
    if(input.kind==='completed')demand(existing.status==='Confirmed'&&new Date(existing.date)<=new Date(),400,'Only a confirmed session that has started can be completed');
    if(['confirmed','rescheduled'].includes(input.kind))demand(new Date(input.date)>new Date(),400,'Choose a future session time');
    // A venue may be plain text; anything that looks like a link must be HTTPS.
    if(/^[a-z][a-z0-9+.-]*:/i.test(input.meeting_link))demand(URL.canParse(input.meeting_link)&&new URL(input.meeting_link).protocol==='https:',400,'Use an HTTPS meeting link, or type the venue');
    const status={confirmed:'Confirmed',rescheduled:'Confirmed',declined:'Declined',completed:'Completed'}[input.kind];
    await tx.query('UPDATE mentor_sessions SET status=$2,date=$3,meeting_link=$4,mentor_notes=$5,decline_reason=$6,session_type=$7,location=$8,updated_at=now() WHERE id=$1',[input.session_id,status,input.date,input.meeting_link,input.kind==='completed'?input.note:existing.mentor_notes,input.kind==='declined'?input.note:'',input.session_type,input.location]);
    const member=(await tx.query('SELECT name,email FROM users WHERE id=$1',[existing.member_id])).rows[0];
    return {mentor_name:user.name,mentee_name:member.name,recipient_email:member.email};
  });
  await onMentorship(db,user,input.kind,parties.recipient_email);
  // Reserved test domains (RFC 2606) can never receive mail, so demo and test accounts get in-app notifications only.
  if(!mailEnabled||/\.(test|invalid|example|localhost)$/i.test(parties.recipient_email)){send(200,{queued:false,saved:true});return true;}
  const recent = (await db.query("SELECT count(*)::int AS n FROM notification_mail WHERE sender_id=$1 AND created_at>now()-interval '1 hour'", [user.id])).rows[0].n;
  // The session change is already saved; over the limit we skip the email rather than fail the request.
  if (recent >= HOURLY_LIMIT) { send(200, { queued: false, saved: true, reason: "Hourly email limit reached" }); return true; }
  // Mentees cannot impersonate someone else in a request: their own account details are used.
  const message = composeMentorshipEmail({...input,...parties}, origin, toMentor.has(input.kind) ? user.email : "");
  await db.query("INSERT INTO notification_mail(id,sender_id,recipient,subject,body,html) VALUES($1,$2,$3,$4,$5,$6)", [randomUUID(), user.id, parties.recipient_email, message.subject, message.body, message.html]);
  send(202, { queued: true });
  return true;
}
