// Who hears about what. Each rule runs after the change is committed; a failed notification never undoes the change.
import { notify } from "./live.mjs";

const day = (d) => (d ? new Date(`${String(d).slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "");
const leadersOf = async (db, schoolId) => schoolId ? (await db.query("SELECT id FROM users WHERE role='leader' AND status='approved' AND school_id=$1", [schoolId])).rows.map((r) => r.id) : [];
async function host(db, schoolId, data) {
  if (schoolId) return (await db.query("SELECT name FROM schools WHERE id=$1", [schoolId])).rows[0]?.name ?? "A school";
  return data?.category && !/^[a-f0-9-]{36}$/.test(data.category) ? data.category : "PLP";
}
const safe = (fn) => async (...args) => { try { await fn(...args); } catch (e) { console.error("notification failed:", e.message); } };

export const onRecordCreated = safe(async (db, user, kind, data, schoolId) => {
  if (kind === "events")
    return notify(db, "member", { title: `New activity: ${data.title}`, body: `${await host(db, schoolId, data)} · ${day(data.date)}. Let them know if you'll participate.`, link: "/clubs" }, user.id);
  if (kind === "applications" && data.category?.startsWith("activity:")) {
    const event = (await db.query("SELECT owner_id,school_id,data FROM records WHERE id=$1 AND kind='events'", [data.category.slice(9)])).rows[0];
    if (event) return notify(db, [event.owner_id, ...(await leadersOf(db, event.school_id))], { title: `${user.name} will participate`, body: event.data.title, link: `/clubs?activity=${data.category.slice(9)}` }, user.id);
  }
  if (kind === "applications" && data.reference_id) {
    const opp = (await db.query("SELECT owner_id,data FROM records WHERE id=$1", [data.reference_id])).rows[0];
    if (opp) return notify(db, [opp.owner_id], { title: `New application from ${user.name}`, body: opp.data.title, link: "/opportunities" }, user.id);
  }
  if (kind === "opportunities" && data.published)
    return notify(db, "member", { title: `New opportunity: ${data.title}`, body: data.organization ? `From ${data.organization}` : "Open for applications", link: "/opportunities" }, user.id);
  if (kind === "courses" && data.published)
    return notify(db, "member", { title: `New course: ${data.title}`, body: data.description?.slice(0, 120) ?? "", link: "/academy" }, user.id);
  if (kind === "materials")
    return notify(db, "leader", { title: `New learning material: ${data.title}`, body: "Available for your school", link: "/learning-materials" }, user.id);
});

export const onRecordUpdated = safe(async (db, user, kind, before, after, row) => {
  const b = before ?? {}, a = after ?? {};
  if (kind === "courses") {
    if (a.review_state === "submitted" && b.review_state !== "submitted")
      await notify(db, "admin", { title: "Course submitted for publication", body: `${a.title} · by ${user.name}`, link: "/studio" }, user.id);
    if (a.published && !b.published) {
      await notify(db, [row.owner_id], { title: "Your course is published", body: a.title, link: "/studio" }, user.id);
      await notify(db, "member", { title: `New course: ${a.title}`, body: a.description?.slice(0, 120) ?? "", link: "/academy" });
    }
    if (a.review_state === "changes_requested" && b.review_state !== "changes_requested")
      await notify(db, [row.owner_id], { title: `Changes requested: ${a.title}`, body: a.review_note ?? "", link: "/studio" }, user.id);
  }
  if ((kind === "proofs" || kind === "applications") && a.status !== b.status && ["approved", "rejected"].includes(a.status)) {
    const what = kind === "proofs" ? "ALX certificate" : "application";
    await notify(db, [row.owner_id], { title: `Your ${what} was ${a.status === "approved" ? "approved" : "not approved"}`, body: a.feedback || a.title || "", link: kind === "proofs" ? "/alx" : "/opportunities" }, user.id);
  }
  if (kind === "events" && a.status === "approved" && b.status !== "approved")
    await notify(db, [row.owner_id, ...(await leadersOf(db, row.school_id))], { title: "Activity report reviewed", body: a.title, link: `/clubs?activity=${row.id}` }, user.id);
  if (kind === "opportunities" && a.published && !b.published)
    await notify(db, "member", { title: `New opportunity: ${a.title}`, body: a.organization ? `From ${a.organization}` : "Open for applications", link: "/opportunities" }, user.id);
});

export const onActivityReported = safe(async (db, user, event, attendeeIds, amount, present = attendeeIds.length) => {
  await notify(db, attendeeIds, { title: `You earned ${amount} PLP credits`, body: `For attending ${event.data.title}`, link: "/credits" }, user.id);
  if (user.role !== "admin") await notify(db, "admin", { title: "Activity report submitted", body: `${event.data.title} · ${present} attended`, link: `/clubs?activity=${event.id}` });
});

export const onAccessChanged = safe(async (db, user, id, role, status) => {
  if (status === "approved") await notify(db, [id], { title: "Your account is approved", body: `You now have ${role === "member" ? "member" : role} access to the PLP Hub.`, link: "/hub" }, user.id);
});

export const onMentorship = safe(async (db, user, kind, recipientEmail, menteeName) => {
  const to = (await db.query("SELECT id FROM users WHERE email=$1", [recipientEmail])).rows[0]?.id;
  const text = {
    requested: [`New session request from ${user.name}`, "Accept, reschedule or decline it on your dashboard."],
    updated: [`${user.name} changed their session request`, "Review the new time."],
    cancelled: [`${user.name} cancelled a session`, ""],
    confirmed: [`${user.name} confirmed your mentoring session`, "See the time and meeting details."],
    rescheduled: [`${user.name} proposed a new session time`, ""],
    declined: [`${user.name} can't take this session`, "You can request another mentor."],
    completed: [`Session with ${user.name} recorded`, "Thank you for showing up. Add your reflection."],
  }[kind];
  if (to && text) await notify(db, [to], { title: text[0], body: text[1], link: kind === "requested" || kind === "updated" || kind === "cancelled" ? "/hub" : "/mentorship" }, user.id);
});

export const onCertificateRequest = safe(async (db, user, request, decision) => {
  if (!decision) return notify(db, "admin", { title: "Certificate request submitted", body: `${user.name} · ${request.members?.length ?? 0} members`, link: "/certificate-centre" }, user.id);
  await notify(db, [request.requested_by], decision === "issued"
    ? { title: "Membership certificates issued", body: `${request.members.length} certificates are ready to download.`, link: "/certificate-centre" }
    : { title: "Certificate request returned", body: "An administrator asked for a correction.", link: "/certificate-centre" }, user.id);
  if (decision === "issued") {
    const ids = (await db.query("SELECT member_id FROM certificates WHERE request_id=$1 AND member_id IS NOT NULL", [request.id])).rows.map((r) => r.member_id);
    await notify(db, ids, { title: "You received a membership certificate", body: "Service as a PLP member", link: "/certificates" });
  }
});
