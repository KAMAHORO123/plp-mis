// Dashboard and report figures, computed from the database so every screen shows the same, current numbers.
// Dates compare in Kigali time, which is when PLP activities happen.
// ISO dates compare correctly as text, and a malformed value can never break the whole report.
const TODAY = "to_char(now() AT TIME ZONE 'Africa/Kigali','YYYY-MM-DD')";
const int = (v) => Number(v) || 0;

// The last 12 calendar months in Kigali time, oldest first, as 'YYYY-MM'.
const MONTHS = `SELECT to_char(d,'YYYY-MM') AS month FROM generate_series(date_trunc('month', now() AT TIME ZONE 'Africa/Kigali') - interval '11 months', date_trunc('month', now() AT TIME ZONE 'Africa/Kigali'), interval '1 month') d`;
const monthOf = (column) => `to_char(${column} AT TIME ZONE 'Africa/Kigali','YYYY-MM')`;
// Attendance recorded for an event, counting accounts and register members.
const PRESENT = (event) => `((SELECT count(*) FROM attendance a WHERE a.event_id=${event}) + (SELECT count(*) FROM register_attendance ra WHERE ra.event_id=${event}))`;
/** Rows of {month, ...numbers}, with every month present even when empty. */
async function series(db, columns, values = []) {
  const sql = `WITH m AS (${MONTHS}) SELECT m.month, ${Object.entries(columns).map(([k, q]) => `(${q}) AS ${k}`).join(", ")} FROM m ORDER BY m.month`;
  return (await db.query(sql, values)).rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, k === "month" ? v : int(v)])));
}
/** This 30 days against the 30 before, for the change shown on stat tiles. */
const window30 = (column) => `count(*) FILTER (WHERE ${column} >= now() - interval '30 days') AS cur, count(*) FILTER (WHERE ${column} >= now() - interval '60 days' AND ${column} < now() - interval '30 days') AS prev`;
const pair = (r) => ({ current: int(r?.cur), previous: int(r?.prev) });

// Events a member attended directly, or through a register entry that carries their account email.
const ATTENDED = `SELECT e.id, e.data FROM records e WHERE e.kind='events' AND (
  EXISTS (SELECT 1 FROM attendance a WHERE a.event_id=e.id AND a.member_id=$1)
  OR EXISTS (SELECT 1 FROM register_attendance ra JOIN records r ON r.id=ra.school_member_id WHERE ra.event_id=e.id AND lower(r.data->>'email')=lower($2)))`;

async function admin(db) {
  const one = async (sql, values = []) => (await db.query(sql, values)).rows[0];
  const people = await one(`SELECT
      count(*) FILTER (WHERE role='member' AND status='approved') AS members,
      count(*) FILTER (WHERE role<>'member' AND status='approved') AS staff,
      count(*) FILTER (WHERE status='pending') AS pending
    FROM users WHERE email_verified_at IS NOT NULL`);
  const events = await one(`SELECT count(*) AS total,
      count(*) FILTER (WHERE data->>'date' >= ${TODAY}) AS upcoming,
      count(*) FILTER (WHERE coalesce(data->>'report','')<>'') AS reported
    FROM records WHERE kind='events'`);
  const attendance = await one("SELECT (SELECT count(*) FROM attendance) + (SELECT count(*) FROM register_attendance) AS n");
  const learning = await one(`SELECT
      (SELECT count(*) FROM records WHERE kind='courses' AND (data->>'published')::boolean) AS published,
      (SELECT count(*) FROM enrollments en JOIN records c ON c.id=en.course_id WHERE en.completed_at IS NOT NULL) AS completed,
      (SELECT count(*) FROM enrollments en JOIN records c ON c.id=en.course_id WHERE en.completed_at IS NULL) AS in_progress`);
  const other = await one(`SELECT
      (SELECT count(*) FROM schools) AS schools,
      (SELECT count(*) FROM records WHERE kind='opportunities' AND (data->>'published')::boolean AND (data->>'deadline' IS NULL OR data->>'deadline' >= ${TODAY})) AS open_opportunities,
      (SELECT count(*) FROM certificates WHERE revoked_at IS NULL) AS certificates,
      (SELECT coalesce(sum(amount),0) FROM credits) AS credits`);
  const pathways = (await db.query(`SELECT coalesce(nullif(c.data->>'category',''),'Other') AS name, count(*) AS value
    FROM enrollments en JOIN records c ON c.id=en.course_id WHERE en.completed_at IS NOT NULL GROUP BY 1 ORDER BY 2 DESC, 1`)).rows.map((r) => ({ name: r.name, value: int(r.value) }));
  const tasks = (await db.query(`
      SELECT id, data->>'title' AS title, 'Course by ' || (SELECT name FROM users WHERE id=owner_id) AS detail, 'Awaiting publication' AS status, coalesce(jsonb_array_length(data->'lessons'),0) || ' modules' AS value, '/studio' AS link, updated_at AS at
        FROM records WHERE kind='courses' AND data->>'review_state'='submitted' AND NOT coalesce((data->>'published')::boolean,false)
      UNION ALL SELECT r.id, s.name, 'School certificate request', CASE WHEN r.status='corrected' THEN 'Corrected' ELSE 'Awaiting review' END, jsonb_array_length(r.members) || ' recipients', '/certificate-centre', r.requested_at
        FROM certificate_requests r JOIN schools s ON s.id=r.school_id WHERE r.status IN ('submitted','corrected')
      UNION ALL SELECT id, name, 'Staff access request: ' || coalesce(requested_role,'staff'), 'Verify assignment', email, '/memberships', created_at
        FROM users WHERE status='pending' AND email_verified_at IS NOT NULL
      ORDER BY at DESC LIMIT 100`)).rows.map(({ at, ...t }) => t);
  const trend = await series(db, {
    activities: `SELECT count(*) FROM records e WHERE e.kind='events' AND left(e.data->>'date',7)=m.month`,
    attendance: `SELECT coalesce(sum(${PRESENT("e.id")}),0) FROM records e WHERE e.kind='events' AND left(e.data->>'date',7)=m.month`,
    credits: `SELECT coalesce(sum(amount),0) FROM credits c WHERE ${monthOf("c.awarded_at")}=m.month`,
    members: `SELECT count(*) FROM users u WHERE u.role='member' AND u.status='approved' AND ${monthOf("u.created_at")}=m.month`,
    completions: `SELECT count(*) FROM enrollments en JOIN records c ON c.id=en.course_id WHERE en.completed_at IS NOT NULL AND ${monthOf("en.completed_at")}=m.month`,
  });
  const change = {
    members: pair(await one(`SELECT ${window30("created_at")} FROM users WHERE role='member' AND status='approved'`)),
    credits: pair(await one(`SELECT coalesce(sum(amount) FILTER (WHERE awarded_at >= now() - interval '30 days'),0) AS cur, coalesce(sum(amount) FILTER (WHERE awarded_at >= now() - interval '60 days' AND awarded_at < now() - interval '30 days'),0) AS prev FROM credits`)),
    completions: pair(await one(`SELECT ${window30("completed_at")} FROM enrollments WHERE completed_at IS NOT NULL`)),
  };
  const activityTypes = (await db.query(`SELECT coalesce(nullif(data->>'activity_type',''),'Meeting') AS name, count(*) AS value FROM records WHERE kind='events' GROUP BY 1 ORDER BY 2 DESC, 1`)).rows.map((r) => ({ name: r.name, value: int(r.value) }));
  const topSchools = (await db.query(`SELECT s.name, count(e.id) AS activities, coalesce(sum(${PRESENT("e.id")}),0) AS attendance
    FROM schools s JOIN records e ON e.kind='events' AND e.school_id=s.id GROUP BY s.id, s.name ORDER BY 3 DESC, 2 DESC, 1 LIMIT 8`)).rows.map((r) => ({ name: r.name, activities: int(r.activities), attendance: int(r.attendance) }));
  const mentoring = (await db.query("SELECT status AS name, count(*) AS value FROM mentor_sessions GROUP BY 1")).rows.map((r) => ({ name: r.name, value: int(r.value) }));
  return {
    trend, change, activityTypes, topSchools, mentoring,
    members: int(people.members), staff: int(people.staff), pendingAccounts: int(people.pending), schools: int(other.schools),
    activities: int(events.total), upcomingActivities: int(events.upcoming), reportsSubmitted: int(events.reported),
    attendance: int(attendance.n), creditsAwarded: int(other.credits), coursesPublished: int(learning.published), coursesCompleted: int(learning.completed),
    coursesInProgress: int(learning.in_progress), openOpportunities: int(other.open_opportunities), certificatesIssued: int(other.certificates), pathways, tasks,
  };
}

async function member(db, user) {
  const learning = (await db.query(`SELECT count(*) FILTER (WHERE en.completed_at IS NULL) AS in_progress, count(*) FILTER (WHERE en.completed_at IS NOT NULL) AS completed
    FROM enrollments en JOIN records c ON c.id=en.course_id WHERE en.member_id=$1`, [user.id])).rows[0];
  const pathways = (await db.query(`SELECT coalesce(nullif(c.data->>'category',''),'Other') AS name, count(*) AS value
    FROM enrollments en JOIN records c ON c.id=en.course_id WHERE en.member_id=$1 AND en.completed_at IS NOT NULL GROUP BY 1 ORDER BY 2 DESC, 1`, [user.id])).rows.map((r) => ({ name: r.name, value: int(r.value) }));
  const attended = (await db.query(ATTENDED, [user.id, user.email])).rows;
  const hours = (type) => attended.filter((e) => !type || e.data.activity_type === type).reduce((n, e) => n + (Number(e.data.hours) || 0), 0);
  const other = (await db.query(`SELECT
      (SELECT coalesce(sum(amount),0) FROM credits WHERE member_id=$1) AS credits,
      (SELECT count(*) FROM certificates WHERE member_id=$1 AND revoked_at IS NULL) AS certificates,
      (SELECT count(*) FROM records a JOIN records e ON e.id::text=substring(a.data->>'category' from 10)
        WHERE a.kind='applications' AND a.owner_id=$1 AND a.data->>'category' LIKE 'activity:%' AND coalesce(a.data->>'status','')<>'rejected'
          AND e.kind='events' AND e.data->>'date' >= ${TODAY}) AS going`, [user.id])).rows[0];
  return {
    coursesInProgress: int(learning.in_progress), coursesCompleted: int(learning.completed), credits: int(other.credits), certificates: int(other.certificates),
    activitiesAttended: attended.length, activityHours: hours(), volunteerHours: hours("Volunteering"), upcomingActivities: int(other.going), pathways,
  };
}

export async function reportsRoute({ p, req, db, user, send }) {
  if (p !== "/reports/overview" || req.method !== "GET") return false;
  if (user.role === "admin") send(200, { role: "admin", ...(await admin(db)) });
  else send(200, { role: user.role, ...(await member(db, user)) });
  return true;
}
