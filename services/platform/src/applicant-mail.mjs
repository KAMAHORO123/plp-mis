// Administrators email the applicants they select, each message personalised with the person's name and what they applied for.
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { renderEmail } from "./email-template.mjs";
import { notify } from "./live.mjs";

const schema = z.object({
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(4000),
  recipients: z.array(z.object({ user_id: z.string().uuid(), applied_for: z.string().trim().min(1).max(160) })).min(1).max(200),
}).strict();
// Reserved test domains (RFC 2606) can never receive mail; those accounts get the in-app notification only.
const undeliverable = (email) => /\.(test|invalid|example|localhost)$/i.test(email);

// Names are often written surname-first in capitals ("UWASE Grace"); the given name is the first word that is not all caps.
export const givenName = (name) => { const words = name.trim().split(/\s+/); return words.find((w) => w !== w.toUpperCase()) ?? words[0]; };
/** Fills {name}, {first_name} and {applied_for}; unknown placeholders are left as typed. */
export function personalise(template, person) {
  const values = { name: person.name, first_name: givenName(person.name), applied_for: person.applied_for };
  return template.replace(/\{(name|first_name|applied_for)\}/g, (_, key) => values[key]);
}

export async function applicantMailRoute({ p, req, db, user, body, send, origin, mailEnabled }) {
  if (p !== "/applicant-emails" || req.method !== "POST") return false;
  if (user.role !== "admin") { send(403, { error: "Only administrators can email applicants" }); return true; }
  const input = schema.parse(await body());
  const people = (await db.query("SELECT id,name,email FROM users WHERE id = ANY($1::uuid[])", [input.recipients.map((r) => r.user_id)])).rows;
  let queued = 0, inApp = 0;
  for (const r of input.recipients) {
    const person = people.find((x) => x.id === r.user_id);
    if (!person) continue;
    const subject = personalise(input.subject, { ...person, applied_for: r.applied_for });
    const paragraphs = personalise(input.message, { ...person, applied_for: r.applied_for }).split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
    await notify(db, [person.id], { title: subject, body: paragraphs[0]?.slice(0, 200) ?? "", link: "/opportunities" });
    inApp++;
    if (!mailEnabled || undeliverable(person.email)) continue;
    const { html, text } = renderEmail({ origin, preheader: paragraphs[0], heading: subject, paragraphs, details: [["Application", r.applied_for]], button: { label: "Open the PLP Hub", url: new URL("/hub", origin).href }, footnote: `Sent by ${user.name} on behalf of Peace and Love Proclaimers.` });
    await db.query("INSERT INTO notification_mail(id,sender_id,recipient,subject,body,html) VALUES($1,$2,$3,$4,$5,$6)", [randomUUID(), user.id, person.email, subject, text, html]);
    queued++;
  }
  send(202, { queued, notified: inApp });
  return true;
}
