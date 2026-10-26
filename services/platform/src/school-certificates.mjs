import { onCertificateRequest } from "./notify-rules.mjs";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { transaction } from "./db.mjs";
const uuid = z.string().uuid();
const membersSchema = z.array(uuid).min(1).max(100);
const demand = (ok, status, message) => {
  if (!ok) throw Object.assign(new Error(message), { status });
};
const plain = (schema) => schema.refine((v) => !/[<>]/.test(v), "Use plain text without < or >");
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => { const d = new Date(`${s}T00:00:00Z`); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s; }, "Use a real date");
// Wording printed on the certificate. The club leader drafts it; the approving administrator may adjust it.
const wording = z.object({
  title: plain(z.string().trim().min(3).max(60)).optional(),
  programme: plain(z.string().trim().min(3).max(100)).optional(),
  citation: plain(z.string().trim().max(300)).optional(),
  period_from: isoDate.nullable().optional(),
  period_to: isoDate.nullable().optional(),
  roles: z.record(uuid, plain(z.string().trim().max(60))).optional(),
});
function checkPeriod(w) {
  demand(!w.period_from || !w.period_to || w.period_from <= w.period_to, 400, "The term must end after it starts.");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Kigali" }).format(new Date());
  demand(!w.period_from || w.period_from <= today, 400, "The term cannot start in the future.");
}
async function snapshot(tx, school, ids, roles = {}) {
  const members = [];
  for (const id of new Set(ids)) {
    const row = (
      await tx.query(
        "SELECT id,data FROM records WHERE id=$1 AND kind='members' AND school_id=$2 FOR SHARE",
        [id, school],
      )
    ).rows[0];
    demand(row, 400, "Choose members from this school register");
    members.push({ id: row.id, name: row.data.title, email: row.data.email || "", role: roles[id] || "" });
  }
  return members;
}
// Certificates link to the member's own account (by register email), so each member sees only their own.
// Each certificate keeps its own copy of the wording, so later edits never change one already issued.
async function issueCertificates(tx, request, issuerId) {
  for (const member of request.members)
    await tx.query(
      "INSERT INTO certificates(id,school_id,request_id,school_member_id,recipient,programme,issued_by,member_id,title,citation,role,period_from,period_to) VALUES($1,$2,$3,$4,$5,$6,$7,(SELECT u.id FROM users u JOIN records r ON lower(u.email)=lower(r.data->>'email') WHERE r.id=$4 AND u.status='approved' LIMIT 1),$8,$9,$10,$11,$12)",
      [randomUUID(), request.school_id, request.id, member.id, member.name, request.programme, issuerId, request.title, request.citation, member.role || null, request.period_from, request.period_to],
    );
}
// A member holds at most one membership certificate, and cannot be in two open requests.
async function alreadyCertified(tx, members, exceptRequest = null) {
  const ids = members.map((m) => m.id);
  const held = (await tx.query("SELECT DISTINCT recipient FROM certificates WHERE school_member_id = ANY($1::uuid[]) AND revoked_at IS NULL", [ids])).rows.map((r) => r.recipient);
  demand(!held.length, 409, `${held.join(", ")} already ${held.length === 1 ? "has" : "have"} a membership certificate. Remove ${held.length === 1 ? "this member" : "them"} and try again.`);
  const waiting = (await tx.query("SELECT DISTINCT m->>'name' AS name FROM certificate_requests r, jsonb_array_elements(r.members) m WHERE r.status IN ('submitted','corrected') AND r.id IS DISTINCT FROM $2::uuid AND m->>'id' = ANY($1::text[])", [ids, exceptRequest])).rows.map((r) => r.name);
  demand(!waiting.length, 409, `${waiting.join(", ")} ${waiting.length === 1 ? "is" : "are"} already in a request waiting for approval.`);
}
const applyWording = (w, fallback = {}) => ({
  title: w.title ?? fallback.title ?? "Certificate of Membership",
  programme: w.programme ?? fallback.programme ?? "Service as a PLP member",
  citation: w.citation ?? fallback.citation ?? "",
  period_from: w.period_from === undefined ? fallback.period_from ?? null : w.period_from,
  period_to: w.period_to === undefined ? fallback.period_to ?? null : w.period_to,
});
// Postgres returns DATE columns as local-midnight Date objects. Read the local calendar day:
// toISOString() would convert to UTC and move the date back a day east of Greenwich (Kigali is UTC+2).
const isoOf = (d) => (d instanceof Date ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : d ?? null);

export async function schoolCertificates({
  path,
  method,
  db,
  user,
  body,
  send,
}) {
  if (!path.startsWith("/certificate-requests")) return false;
  demand(
    user.role === "admin" || (user.role === "leader" && user.school_id),
    403,
    "School leadership access required",
  );
  if (path === "/certificate-requests" && method === "GET") {
    send(
      200,
      (
        await db.query(
          "SELECT r.*,to_char(r.period_from,'YYYY-MM-DD') AS period_from,to_char(r.period_to,'YYYY-MM-DD') AS period_to,s.name AS school_name,u.name AS reviewed_by_name FROM certificate_requests r JOIN schools s ON s.id=r.school_id LEFT JOIN users u ON u.id=r.reviewed_by WHERE ($1::uuid IS NULL OR r.school_id=$1) ORDER BY requested_at DESC LIMIT 500",
          [user.role === "admin" ? null : user.school_id],
        )
      ).rows,
    );
    return true;
  }
  if (path === "/certificate-requests" && method === "POST") {
    const input = wording
      .extend({ school_id: uuid, member_ids: membersSchema })
      .strict()
      .parse(await body());
    demand(
      user.role === "admin" || input.school_id === user.school_id,
      403,
      "School outside your assignment",
    );
    const text = applyWording(input);
    checkPeriod(text);
    // Requests wait for an administrator, who checks the names and wording before issuing.
    const id = randomUUID();
    let request;
    await transaction(db, async (tx) => {
      const members = await snapshot(tx, input.school_id, input.member_ids, input.roles);
      await alreadyCertified(tx, members);
      request = (await tx.query(
        "INSERT INTO certificate_requests(id,school_id,requested_by,members,title,programme,citation,period_from,period_to) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",
        [id, input.school_id, user.id, JSON.stringify(members), text.title, text.programme, text.citation, text.period_from, text.period_to],
      )).rows[0];
      await tx.query(
        "INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,'certificate.request',$2)",
        [user.id, id],
      );
    });
    await onCertificateRequest(db, user, request);
    send(201, { id, status: "submitted" });
    return true;
  }
  const issued = path.match(/^\/certificate-requests\/([a-f0-9-]+)\/certificates$/);
  if (issued && method === "GET") {
    // Certificate ids let downloaded PDFs link to the public verification page.
    const rows = (await db.query("SELECT c.id,c.school_member_id,c.recipient,c.issued_at,c.revoked_at,c.title,c.programme,c.citation,c.role,to_char(c.period_from,'YYYY-MM-DD') AS period_from,to_char(c.period_to,'YYYY-MM-DD') AS period_to FROM certificates c JOIN certificate_requests r ON r.id=c.request_id WHERE r.id=$1 AND ($2::uuid IS NULL OR r.school_id=$2)", [uuid.parse(issued[1]), user.role === "admin" ? null : user.school_id])).rows;
    send(200, rows);
    return true;
  }
  const match = path.match(/^\/certificate-requests\/([a-f0-9-]+)(\/review)?$/);
  if (!match) return false;
  const id = uuid.parse(match[1]);
  if (method === "PUT" && !match[2]) {
    const input = wording
      .extend({ member_ids: membersSchema })
      .strict()
      .parse(await body());
    await transaction(db, async (tx) => {
      const request = (
        await tx.query(
          "SELECT * FROM certificate_requests WHERE id=$1 FOR UPDATE",
          [id],
        )
      ).rows[0];
      demand(
        request &&
          (user.role === "admin" || request.school_id === user.school_id),
        404,
        "Request not found",
      );
      demand(
        request.status === "returned",
        409,
        "Only returned requests can be corrected",
      );
      const text = applyWording(input, { ...request, period_from: isoOf(request.period_from), period_to: isoOf(request.period_to) });
      checkPeriod(text);
      const members = await snapshot(tx, request.school_id, input.member_ids, input.roles);
      await alreadyCertified(tx, members, id);
      await tx.query(
        "UPDATE certificate_requests SET members=$1,status='corrected',corrected_at=now(),title=$3,programme=$4,citation=$5,period_from=$6,period_to=$7 WHERE id=$2",
        [JSON.stringify(members), id, text.title, text.programme, text.citation, text.period_from, text.period_to],
      );
      await tx.query(
        "INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,'certificate.corrected',$2)",
        [user.id, id],
      );
    });
    send(200, { ok: true });
    return true;
  }
  if (method === "POST" && match[2]) {
    demand(user.role === "admin", 403, "Administrator required");
    const input = wording
      .extend({
        decision: z.enum(["issued", "returned"]),
        note: z.string().trim().max(1000).default(""),
      })
      .strict()
      .parse(await body());
    demand(
      input.decision !== "returned" || input.note.length > 0,
      400,
      "Explain the required correction",
    );
    await transaction(db, async (tx) => {
      const request = (
        await tx.query(
          "SELECT * FROM certificate_requests WHERE id=$1 FOR UPDATE",
          [id],
        )
      ).rows[0];
      demand(request, 404, "Request not found");
      demand(
        ["submitted", "corrected"].includes(request.status),
        409,
        "Request has already been reviewed",
      );
      if (input.decision === "issued") {
        // The administrator may polish the wording and roles while approving.
        const text = applyWording(input, { ...request, period_from: isoOf(request.period_from), period_to: isoOf(request.period_to) });
        checkPeriod(text);
        const members = request.members.map((m) => ({ ...m, role: input.roles?.[m.id] ?? m.role ?? "" }));
        await alreadyCertified(tx, members, id);
        const updated = (await tx.query(
          "UPDATE certificate_requests SET members=$2,title=$3,programme=$4,citation=$5,period_from=$6,period_to=$7 WHERE id=$1 RETURNING *",
          [id, JSON.stringify(members), text.title, text.programme, text.citation, text.period_from, text.period_to],
        )).rows[0];
        await issueCertificates(tx, updated, user.id);
      }
      await tx.query(
        "UPDATE certificate_requests SET status=$1,note=$2,reviewed_by=$3,issued_at=CASE WHEN $1='issued' THEN now() ELSE NULL END WHERE id=$4",
        [input.decision, input.note, user.id, id],
      );
      await tx.query(
        "INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,$2,$3)",
        [user.id, "certificate.request." + input.decision, id],
      );
    });
    await onCertificateRequest(db, user, (await db.query("SELECT * FROM certificate_requests WHERE id=$1", [id])).rows[0], input.decision);
    send(200, { ok: true });
    return true;
  }
  return false;
}
