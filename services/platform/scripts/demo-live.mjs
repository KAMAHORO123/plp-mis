// Plays out a few minutes of everyday PLP activity so you can watch pages update and notifications arrive live.
// Sign in as a demo account in the browser first (password DemoPass2026!), then run:
//   node scripts/demo-live.mjs            (8 seconds between actions)
//   node scripts/demo-live.mjs --delay 4
import { randomUUID } from "node:crypto";
import { as, day, db, DOMAIN, pdf, sleep } from "./demo-common.mjs";

const delay = Number(process.argv[process.argv.indexOf("--delay") + 1]) || 8;
const mail = (local) => `${local}@${DOMAIN}`;
const [admin, jean, diane, aline, kevin, patrick, olivier, esther, claudine] = await Promise.all(
  ["admin", "leader1", "leader2", "mentor", "kevin", "patrick", "olivier", "esther", "claudine"].map((k) => as(mail(k))),
);
const eventId = async (title) => (await db.query("SELECT id FROM records WHERE kind='events' AND data->>'title'=$1 ORDER BY created_at DESC LIMIT 1", [title])).rows[0]?.id;
const stamp = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const timeline = [
  ["Jean (Hillside) publishes a new activity → every member is notified", async () =>
    jean.post("/records/events", { title: `Football for peace tournament (${stamp})`, date: day(9), activity_type: "Challenge", hours: 4, description: "Mixed teams from both schools play short matches; every team must include players who have never met." })],
  ["Patrick says he'll participate in the tree planting → Jean is notified", async () =>
    patrick.post("/records/applications", { title: patrick.name, description: "Activity participation", category: `activity:${await eventId("Tree planting at Hillside")}` })],
  ["Olivier joins the storytelling evening → Diane is notified", async () =>
    olivier.post("/records/applications", { title: olivier.name, description: "Activity participation", category: `activity:${await eventId("Peace storytelling evening")}` })],
  ["Kevin asks Aline for a mentoring session → Aline is notified", async () =>
    kevin.post("/mentorship/notify", { kind: "requested", session_id: randomUUID(), recipient_email: aline.email, recipient_name: aline.name, mentor_name: aline.name, mentee_name: kevin.name, topic: "Leadership Development", date: new Date(Date.now() + 10 * 864e5).toISOString(), goal: "Prepare to lead the football for peace tournament.", meeting_link: "", note: "" })],
  ["Aline confirms Claudine's waiting request → Claudine is notified", async () => {
    const s = (await db.query("SELECT * FROM mentor_sessions WHERE member_id=$1 AND status='Requested' ORDER BY date LIMIT 1", [claudine.id])).rows[0];
    if (!s) throw Error("no waiting request");
    return aline.post("/mentorship/notify", { kind: "confirmed", session_id: s.id, recipient_email: claudine.email, recipient_name: claudine.name, mentor_name: aline.name, mentee_name: claudine.name, topic: s.topic, date: new Date(s.date).toISOString(), goal: s.goal, meeting_link: "https://meet.google.com/plp-demo", note: "" });
  }],
  ["PLP publishes a new opportunity → every member is notified", async () =>
    admin.post("/records/opportunities", { title: `Peace journalism workshop (${stamp})`, organization: "PLP Media", description: "Two Saturdays learning to report community stories fairly and safely.", opportunity_type: "Training", format: "On-site", commitment: "2 Saturdays", location: "Kigali", deadline: day(12), apply_mode: "internal", published: true })],
  ["Esther uploads her ALX certificate → admins are notified", async () => {
    const file = await esther.upload("alx-data-analytics.pdf", pdf("ALX Data Analytics - Esther Umutoni"), "application/pdf");
    return esther.post("/records/proofs", { title: "Data Analytics", category: "alx-data", description: "alx-data-analytics.pdf", attachments: [file] });
  }],
  ["PLP recognises Esther's certificate → Esther is notified", async () => {
    const proof = (await db.query("SELECT id FROM records WHERE kind='proofs' AND owner_id=$1 AND coalesce(data->>'status','pending')='pending' ORDER BY created_at DESC LIMIT 1", [esther.id])).rows[0];
    if (!proof) throw Error("nothing waiting");
    return admin.update("proofs", proof.id, { status: "approved", feedback: "Recognised. Great work, Esther!" });
  }],
  ["PLP issues Riverside's membership certificates → Diane, Claudine and Olivier are notified", async () => {
    const request = (await db.query("SELECT r.id FROM certificate_requests r JOIN schools s ON s.id=r.school_id WHERE s.name='Riverside High School' AND r.status IN ('submitted','corrected') LIMIT 1")).rows[0];
    if (!request) throw Error("nothing waiting");
    return admin.post(`/certificate-requests/${request.id}/review`, { decision: "issued", note: "" });
  }],
  ["PLP reviews the debate report → Jean is notified", async () => {
    const id = await eventId("Debate: dialogue over division");
    return admin.update("events", id, { status: "approved" });
  }],
];

console.log(`Playing ${timeline.length} actions, ${delay}s apart. Keep the Hub open in your browser — no refresh needed.\n`);
for (const [i, [label, run]] of timeline.entries()) {
  await sleep(delay * 1000);
  try { await run(); console.log(`${String(i + 1).padStart(2)}. ${label}`); }
  catch (e) { console.log(`${String(i + 1).padStart(2)}. (skipped: ${e.message.split("→").pop().trim()}) ${label}`); }
}
console.log("\nDone. Run it again any time for more live activity.");
await db.end();
