// Fills a local development database with a realistic PLP story, acted out through the API by demo accounts:
// schools and leaders, registers, activities with attendance and reports, a published course, mentoring,
// opportunities, ALX recognition and membership certificates. Every account uses the password DemoPass2026!.
// Usage (API running):  node scripts/demo-seed.mjs
import { randomUUID } from "node:crypto";
import { as, createAccount, day, db, DOMAIN, pdf, PASSWORD } from "./demo-common.mjs";

const mail = (local) => `${local}@${DOMAIN}`;
if ((await db.query("SELECT 1 FROM users WHERE email=$1", [mail("admin")])).rowCount) {
  console.log("Demo data is already loaded. Run `node scripts/demo-live.mjs` to watch new activity happen.");
  process.exit(0);
}
const step = (text) => console.log("•", text);

// People. Staff accounts are approved; members are the young people PLP serves.
const people = {
  admin: ["Grace Uwase", "admin"], trainer: ["Eric Mugisha", "trainer"], mentor: ["Aline Mukamana", "mentor"],
  leader1: ["Jean Habimana", "leader"], leader2: ["Diane Ingabire", "leader"],
  kevin: ["Kevin Niyonzima", "member"], sandrine: ["Sandrine Uwimana", "member"], patrick: ["Patrick Nshuti", "member"],
  claudine: ["Claudine Mutoni", "member"], olivier: ["Olivier Ndayisaba", "member"], esther: ["Esther Umutoni", "member"],
};
for (const [key, [name, role]] of Object.entries(people)) await createAccount(name, mail(key), role);
step(`${Object.keys(people).length} demo accounts (password ${PASSWORD})`);

const admin = await as(mail("admin"));
const hillside = (await admin.post("/schools", { name: "Hillside Secondary School", district: "Gasabo" })).id;
const riverside = (await admin.post("/schools", { name: "Riverside High School", district: "Kicukiro" })).id;
const users = await admin.get("/users");
const idOf = (key) => users.find((u) => u.email === mail(key)).id;
for (const [key, role, school] of [["leader1", "leader", hillside], ["leader2", "leader", riverside], ["kevin", "member", hillside], ["sandrine", "member", hillside], ["patrick", "member", hillside], ["claudine", "member", riverside], ["olivier", "member", riverside], ["esther", "member", null]])
  await admin.patch(`/users/${idOf(key)}`, { role, status: "approved", school_id: school });
step("2 schools, with a club leader each and students linked to their school");

const jean = await as(mail("leader1")), diane = await as(mail("leader2"));
const register = {};
for (const [leader, school, list] of [
  [jean, hillside, [["Kevin Niyonzima", "kevin"], ["Sandrine Uwimana", "sandrine"], ["Patrick Nshuti", "patrick"], ["Alice Iradukunda"], ["Moses Hakizimana"], ["Ange Uwera"]]],
  [diane, riverside, [["Claudine Mutoni", "claudine"], ["Olivier Ndayisaba", "olivier"], ["Yves Manzi"], ["Bella Keza"]]],
]) for (const [name, key] of list) register[name] = (await leader.post("/records/members", { title: name, ...(key ? { email: mail(key) } : {}), category: "Student", school_id: school })).id;
step("School registers: 6 members at Hillside, 4 at Riverside");

// Past activities: held, attendance taken, reported (credits awarded), some reviewed by PLP.
const past = [
  [jean, hillside, "Peace club launch meeting", -19, "Meeting", 2, "Thirty students met to elect the club committee and agree on this term's plan.", ["Kevin Niyonzima", "Sandrine Uwimana", "Patrick Nshuti", "Alice Iradukunda"], true],
  [diane, riverside, "Market clean-up and peace messages", -12, "Volunteering", 3, "We cleaned the Kicukiro market square and talked with traders about peaceful conflict resolution.", ["Claudine Mutoni", "Olivier Ndayisaba", "Yves Manzi"], true],
  [jean, hillside, "Debate: dialogue over division", -5, "Challenge", 2, "Two teams debated how young people can stop rumours that divide classmates. Kevin's team won.", ["Kevin Niyonzima", "Patrick Nshuti", "Moses Hakizimana", "Ange Uwera"], false],
];
for (const [leader, school, title, offset, type, hours, report, attended, reviewed] of past) {
  const id = (await leader.post("/records/events", { title, date: day(offset), description: report.split(".")[0] + ".", activity_type: type, hours, school_id: school })).id;
  await leader.put(`/events/${id}/attendance`, { member_ids: [], register_member_ids: attended.map((n) => register[n]) });
  await leader.post(`/events/${id}/report`, { report });
  if (reviewed) await admin.update("events", id, { status: "approved" });
}
step("3 past activities with attendance and reports; credits awarded to attendees");

// Upcoming activities from both schools and from PLP itself.
const upcoming = {};
for (const [actor, data] of [
  [jean, { title: "Tree planting at Hillside", date: day(3), activity_type: "Volunteering", hours: 3, school_id: hillside, description: "Plant 60 trees around the school compound with parents and neighbours. Bring a water bottle." }],
  [diane, { title: "Peace storytelling evening", date: day(6), activity_type: "Meeting", hours: 2, school_id: riverside, description: "Students share stories of reconciliation from their families, then plan a short assembly presentation." }],
  [admin, { title: "PLP youth leadership summit", date: day(14), activity_type: "Challenge", hours: 6, category: "PLP Kigali", description: "A day of workshops for club leaders and members from every school: planning projects, public speaking and teamwork." }],
  [admin, { title: "Recruitment drive: bring a friend", date: day(21), activity_type: "Recruitment", hours: 2, category: "PLP Kigali", description: "Invite a friend to learn what PLP clubs do. Every new member who joins earns you recognition." }],
]) upcoming[data.title] = (await actor.post("/records/events", data)).id;
step("4 upcoming activities (2 from schools, 2 from PLP)");

const kevin = await as(mail("kevin")), sandrine = await as(mail("sandrine")), claudine = await as(mail("claudine")), esther = await as(mail("esther"));
const participate = (who, title) => who.post("/records/applications", { title: who.name, description: "Activity participation", category: `activity:${upcoming[title]}` });
await participate(kevin, "Tree planting at Hillside");
await participate(sandrine, "Tree planting at Hillside");
await participate(claudine, "Peace storytelling evening");
await participate(kevin, "PLP youth leadership summit");
await participate(esther, "PLP youth leadership summit");
step("Members said they'll participate in upcoming activities");

// A trainer builds a full course; PLP reviews and publishes it.
const trainer = await as(mail("trainer"));
const q = (id, prompt, options, answer) => ({ id, prompt, options, answer });
const course = (await trainer.post("/records/courses", {
  title: "Leading a School Peace Club",
  description: "Plan, run and grow a peace club at your school: from the first meeting to a community project.",
  category: "Leadership Development", level: "Beginner", duration: "3 weeks", published: false, review_state: "draft",
  outcomes: ["Run a well-organised club meeting", "Plan a small community project", "Resolve disagreements between members calmly"],
  skills: ["Leadership", "Facilitation", "Conflict resolution"],
  lessons: [
    { title: "Your first club meeting", content: "Set a clear purpose, agree on simple rules together, and give every member a role. Keep the first meeting under an hour and end with one action everyone can take this week.", quiz: [q("m1", "What should every first meeting end with?", ["One action everyone can take", "A long speech", "Nothing"], 0), q("m2", "Who should agree the club rules?", ["Only the leader", "All members together", "The head teacher"], 1)], quiz_minutes: 4 },
    { title: "Planning a community project", content: "Start from a real need you can see. Choose something small enough to finish in a month, list what you need, split the work, and decide how you will know it worked.", quiz: [q("p1", "Where should a project idea start?", ["A real need you can see", "Whatever is easiest", "A competition"], 0), q("p2", "How long should a first project take?", ["About a month", "Two years", "One hour"], 0)], quiz_minutes: 4 },
  ],
  assignment: "Describe a community project your club could finish in one month: the need, the plan, who does what, and how you will measure success.",
  exam: [q("e1", "What keeps a first meeting effective?", ["A clear purpose and short length", "No agenda", "Only the leader speaking"], 0), q("e2", "A good first project is…", ["Small and finishable", "As big as possible", "Secret"], 0), q("e3", "When two members disagree, you should first…", ["Listen to both sides", "Pick a side", "Ignore it"], 0)],
  exam_minutes: 8, pass_mark: 70, max_attempts: 3,
})).id;
await trainer.update("courses", course, { review_state: "submitted" });
await admin.update("courses", course, { published: true, review_state: "approved" });
step("Course 'Leading a School Peace Club' built by the trainer and published by PLP");

// Mentoring: a profile, two requests, one confirmed.
const mentor = await as(mail("mentor"));
await mentor.put("/mentors/me", { title: "Youth leadership coach", area: "Leadership Development", bio: "I have led youth peace clubs for eight years and help new leaders plan their first projects.", avatar: "", accepting: true });
const ask = async (member, days, topic, goal) => {
  const session = { kind: "requested", session_id: randomUUID(), recipient_email: mentor.email, recipient_name: mentor.name, mentor_name: mentor.name, mentee_name: member.name, topic, date: new Date(Date.now() + days * 864e5 + 3600e3 * 5).toISOString(), goal, meeting_link: "", note: "" };
  await member.post("/mentorship/notify", session);
  return session;
};
const first = await ask(kevin, 4, "Leadership Development", "Plan our club's tree planting day so every member has a role.");
await ask(claudine, 7, "Leadership Development", "Get advice on speaking confidently at the school assembly.");
await mentor.post("/mentorship/notify", { ...first, kind: "confirmed", recipient_email: kevin.email, recipient_name: kevin.name, meeting_link: "PLP office, Kacyiru" });
step("Mentor profile, 2 session requests (1 confirmed)");

// Opportunities, a learning material, an ALX certificate and a membership certificate request.
await admin.post("/records/opportunities", { title: "Youth Peace Ambassadors 2027", organization: "PLP Rwanda", description: "Represent your school in a year-long ambassador programme with monthly training and a final community project.", opportunity_type: "Leadership programme", format: "Hybrid", commitment: "4 hours a month", location: "Kigali", deadline: day(30), eligibility: "Club members aged 15–24", apply_mode: "external", url: "https://www.alxafrica.com/", published: true });
await admin.post("/records/opportunities", { title: "Community radio volunteer", organization: "PLP Media", description: "Help produce a weekly youth radio segment about peace and reconciliation.", opportunity_type: "Volunteering", format: "On-site", commitment: "Saturdays", location: "Kigali", deadline: day(18), apply_mode: "internal", published: true });
const handout = await admin.upload("club-meeting-guide.pdf", pdf("PLP club meeting guide"), "application/pdf");
await admin.post("/records/materials", { title: "Club meeting guide", description: "club-meeting-guide.pdf", attachments: [handout], school_ids: [], published: true });
const proof = await sandrine.upload("alx-ai-certificate.pdf", pdf("ALX AI Career Essentials - Sandrine Uwimana"), "application/pdf");
const proofId = (await sandrine.post("/records/proofs", { title: "AI Career Essentials", category: "alx-ai", description: "alx-ai-certificate.pdf", attachments: [proof] })).id;
await admin.update("proofs", proofId, { status: "approved", feedback: "Well done, Sandrine. Recognised as a PLP digital skills achievement." });
const certificate = await jean.post("/certificate-requests", { school_id: hillside, member_ids: [register["Kevin Niyonzima"], register["Sandrine Uwimana"], register["Patrick Nshuti"]] });
await admin.post(`/certificate-requests/${certificate.id}/review`, { decision: "issued", note: "" });
await diane.post("/certificate-requests", { school_id: riverside, member_ids: [register["Claudine Mutoni"], register["Olivier Ndayisaba"]] });
step("2 opportunities, a learning material, a recognised ALX certificate, membership certificates (1 issued, 1 waiting)");

console.log(`\nDone. Sign in at ${process.env.APP_ORIGIN}/sign-in with any of these (password ${PASSWORD}):`);
for (const [key, [name, role]] of Object.entries(people)) console.log(`  ${role.padEnd(8)} ${name.padEnd(18)} ${mail(key)}`);
await db.end();
