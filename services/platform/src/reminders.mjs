import { randomUUID } from 'node:crypto';
import { transaction } from './db.mjs';
import { renderEmail } from './email-template.mjs';

// Receipt, in-app notification and outbox entry commit together. Multiple workers
// can run safely; a rescheduled session gets a new receipt for its new time.
async function enqueue(tx, { key, user, title, body, link, email, session }, origin, mailEnabled) {
  const claim = await tx.query('INSERT INTO reminder_receipts(reminder_key) VALUES($1) ON CONFLICT DO NOTHING RETURNING reminder_key', [key]);
  if (!claim.rowCount) return 0;
  await tx.query('INSERT INTO notifications(user_id,title,body,link) VALUES($1,$2,$3,$4)', [user.id, title, body, link]);
  if (email && mailEnabled && !/\.(test|invalid|example|localhost)$/i.test(user.email)) {
    const message = renderEmail({ origin, heading: title, paragraphs: [body], button: { label: 'View details', url: new URL(link, origin).href } });
    await tx.query('INSERT INTO notification_mail(id,sender_id,recipient,subject,body,html,expires_at,reminder_session_id,reminder_session_date) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)', [randomUUID(), user.id, user.email, title, message.text, message.html, email, session?.id ?? null, session?.date ?? null]);
  }
  return 1;
}
export async function queueReminders(db, origin, { now = new Date(), mailEnabled = true } = {}) {
  return transaction(db, async tx => {
    let count = 0;
    const sessions = (await tx.query(`SELECT s.*, m.email AS member_email, m.name AS member_name, t.email AS mentor_email, t.name AS mentor_name
      FROM mentor_sessions s JOIN users m ON m.id=s.member_id JOIN users t ON t.id=s.mentor_id
      WHERE s.status='Confirmed' AND s.date>$1 AND s.date<=$1::timestamptz+interval '24 hours'
      AND m.status='approved' AND t.status='approved' FOR SHARE OF s`, [now])).rows;
    for (const s of sessions) {
      const slot = new Date(s.date).getTime() - now.getTime() <= 3600000 ? 'hour' : 'day';
      const time = new Date(s.date).toLocaleString('en-GB', { timeZone: 'Africa/Kigali', dateStyle: 'medium', timeStyle: 'short' });
      for (const role of ['member', 'mentor']) {
        const other = role === 'member' ? s.mentor_name : s.member_name;
        count += await enqueue(tx, { key: `session:${s.id}:${new Date(s.date).toISOString()}:${slot}:${s[`${role}_id`]}`,
          user: { id: s[`${role}_id`], email: s[`${role}_email`] }, title: slot === 'hour' ? 'Your session starts within an hour' : 'Your session is within 24 hours',
          body: `${s.topic || 'Mentorship'} with ${other} · ${time} (Kigali time). ${s.session_type}${s.location ? ` · ${s.location}` : ''}${s.meeting_link ? ` · ${s.meeting_link}` : ''}`,
          link: role === 'mentor' ? '/mentor-sessions' : '/mentorship', email: s.date, session: s }, origin, mailEnabled);
      }
    }
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kigali' }).format(now);
    const tomorrow = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kigali' }).format(new Date(now.getTime() + 86400000));
    const activities = (await tx.query(`SELECT DISTINCT e.id,e.data,u.id AS user_id,u.email FROM records e
      JOIN records a ON a.kind='applications' AND a.data->>'category'='activity:'||e.id::text
      JOIN users u ON u.id=a.owner_id WHERE e.kind='events' AND e.data->>'date'=$1
      AND coalesce(a.data->>'status','pending') NOT IN ('rejected','cancelled') AND u.status='approved'`, [tomorrow])).rows;
    for (const a of activities) count += await enqueue(tx, { key: `activity:${a.id}:${tomorrow}:${a.user_id}`, user: { id: a.user_id, email: a.email }, title: 'Your activity is tomorrow', body: `${a.data.title} · ${tomorrow}. Check the activity details before you travel.`, link: `/clubs?activity=${a.id}`, email: new Date(`${tomorrow}T21:59:59Z`) }, origin, mailEnabled);
    // Closing-soon discovery stays in-app; email is reserved for commitments.
    const closing = (await tx.query(`SELECT id,data FROM records WHERE kind='opportunities' AND data->>'published'='true'
      AND data->>'deadline'>=$1 AND data->>'deadline'<=$2`, [today, new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kigali' }).format(new Date(now.getTime() + 7 * 86400000))])).rows;
    for (const o of closing) {
      const prefix = `deadline:${o.id}:${o.data.deadline}:`;
      const inserted = await tx.query(`WITH claimed AS (
        INSERT INTO reminder_receipts(reminder_key)
        SELECT $1||id::text FROM users WHERE role='member' AND status='approved'
        ON CONFLICT DO NOTHING RETURNING reminder_key
      ) INSERT INTO notifications(user_id,title,body,link)
        SELECT u.id,'Closing this week',$2,'/opportunities' FROM claimed c
        JOIN users u ON c.reminder_key=$1||u.id::text`, [prefix, `${o.data.title} · Apply by ${o.data.deadline}.`]);
      count += inserted.rowCount;
    }
    return count;
  });
}
