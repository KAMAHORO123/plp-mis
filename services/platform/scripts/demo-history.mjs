// Adds a year of past school activity to the local demo, so dashboards show real trends.
// Activities, attendance and reports go through the API as the club leaders; then, for demo data only,
// credit and join dates are moved back to when they would have happened. Run after demo-seed.mjs:
//   node scripts/demo-history.mjs
import { as, db, DOMAIN } from "./demo-common.mjs";

const mail = (local) => `${local}@${DOMAIN}`;
if ((await db.query("SELECT 1 FROM records WHERE kind='events' AND data->>'title' LIKE 'Monthly peace club meeting%'")).rowCount) {
  console.log("Demo history is already loaded.");
  process.exit(0);
}
const jean = await as(mail("leader1")), diane = await as(mail("leader2"));
const plans = [
  ["Monthly peace club meeting", "Meeting", 2, "Members met to plan the month and share how peace-building went at home and in class."],
  ["Neighbourhood clean-up", "Volunteering", 3, "Members cleaned the streets around the school and talked with neighbours about living together peacefully."],
  ["Debate challenge", "Challenge", 2, "Teams debated how young people can stop rumours and division among classmates."],
  ["Bring-a-friend recruitment day", "Recruitment", 2, "Members brought friends to learn what the peace club does and how to join."],
  ["Visit to the elderly", "Volunteering", 4, "Members visited elderly neighbours, helped with chores and listened to their stories."],
];
const day = (monthsAgo, d) => { const t = new Date(); t.setDate(1); t.setMonth(t.getMonth() - monthsAgo); t.setDate(d); return t.toISOString().slice(0, 10); };
let seq = 0;
const pick = (list, n) => [...list].sort(() => Math.random() - 0.5).slice(0, n);
let made = 0;
for (let monthsAgo = 11; monthsAgo >= 1; monthsAgo--) {
  // Activity grows through the year, as a new club would.
  const busy = 1 + Math.floor((11 - monthsAgo) / 4);
  for (const [leader, perMonth] of [[jean, busy + 1], [diane, busy]]) {
    const register = (await leader.get("/records/members")).map((m) => m.id);
    for (let i = 0; i < perMonth; i++) {
      const [title, type, hours, report] = plans[(seq++) % plans.length];
      const date = day(monthsAgo, 3 + i * 9);
      const month = new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { month: "long" });
      const id = (await leader.post("/records/events", { title: `${title} · ${month}`, date, description: report.split(".")[0] + ".", activity_type: type, hours })).id;
      const attended = pick(register, Math.min(register.length, 2 + Math.floor(Math.random() * (register.length - 1))));
      await leader.put(`/events/${id}/attendance`, { member_ids: [], register_member_ids: attended });
      await leader.post(`/events/${id}/report`, { report });
      // Demo only: credits are dated to the activity, not to today.
      await db.query("UPDATE credits SET awarded_at=$2::date + interval '18 hours' WHERE source=$1", [`activity:${id}`, date]);
      made++;
    }
  }
}
// Demo only: spread member join dates across the year.
const members = (await db.query("SELECT id FROM users WHERE email LIKE $1 AND role='member' ORDER BY email", [`%@${DOMAIN}`])).rows;
for (const [i, m] of members.entries()) await db.query("UPDATE users SET created_at=now() - make_interval(days => $2) WHERE id=$1", [m.id, Math.max(5, 30 * (11 - i * 2) + 5)]);
console.log(`Added ${made} past activities with attendance and reports across 11 months.`);
await db.end();
