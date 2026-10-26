// Live updates over Server-Sent Events: open pages hear that data changed and receive new notifications without reloading.
// Connections are held in this process, so run one API instance (as deploy/compose.yml does) or add a shared bus before scaling out.
const clients = new Map(); // user id -> Set of open responses
const MAX_PER_USER = 5;

function write(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}
export function pushTo(userId, event, data) {
  for (const res of clients.get(userId) ?? []) write(res, event, data);
}
export function broadcast(event, data) {
  for (const set of clients.values()) for (const res of set) write(res, event, data);
}

const columns = "id,title,body,link,read_at,created_at";
/** Saves one notification per recipient and pushes it to any open page. `to` is a list of user ids or a role name. */
export async function notify(db, to, { title, body = "", link = null }, exceptId) {
  const rows = Array.isArray(to)
    ? (await db.query(`INSERT INTO notifications(user_id,title,body,link) SELECT u, $2, $3, $4 FROM unnest($1::uuid[]) AS u WHERE u IS DISTINCT FROM $5::uuid RETURNING user_id,${columns}`, [[...new Set(to.filter(Boolean))], title, body, link, exceptId ?? null])).rows
    : (await db.query(`INSERT INTO notifications(user_id,title,body,link) SELECT id, $2, $3, $4 FROM users WHERE role=$1 AND status='approved' AND id IS DISTINCT FROM $5::uuid RETURNING user_id,${columns}`, [to, title, body, link, exceptId ?? null])).rows;
  for (const { user_id, ...n } of rows) pushTo(user_id, "notification", n);
}

export async function liveRoute({ p, req, res, db, user, body, send }) {
  if (p === "/live" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-store", Connection: "keep-alive", "X-Accel-Buffering": "no" });
    res.write("retry: 3000\n\n");
    if (!clients.has(user.id)) clients.set(user.id, new Set());
    // A few tabs per person is plenty; the oldest connection closes so one account cannot exhaust the server.
    const mine = clients.get(user.id);
    if (mine.size >= MAX_PER_USER) { const oldest = mine.values().next().value; mine.delete(oldest); oldest.end(); }
    mine.add(res);
    const ping = setInterval(() => res.write(": ping\n\n"), 25000);
    req.on("close", () => { clearInterval(ping); clients.get(user.id)?.delete(res); if (!clients.get(user.id)?.size) clients.delete(user.id); });
    return true;
  }
  if (p === "/notifications" && req.method === "GET") {
    const [items, unread] = await Promise.all([
      db.query(`SELECT ${columns} FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`, [user.id]),
      db.query("SELECT count(*)::int AS n FROM notifications WHERE user_id=$1 AND read_at IS NULL", [user.id]),
    ]);
    send(200, { items: items.rows, unread: unread.rows[0].n });
    return true;
  }
  if (p === "/notifications/read" && req.method === "POST") {
    const input = await body();
    const ids = Array.isArray(input?.ids) ? input.ids.filter((x) => typeof x === "string" && /^[0-9a-f-]{36}$/.test(x)).slice(0, 200) : null;
    if (ids) await db.query("UPDATE notifications SET read_at=now() WHERE user_id=$1 AND id=ANY($2::uuid[]) AND read_at IS NULL", [user.id, ids]);
    else await db.query("UPDATE notifications SET read_at=now() WHERE user_id=$1 AND read_at IS NULL", [user.id]);
    pushTo(user.id, "notifications-read", { ids });
    send(200, { ok: true });
    return true;
  }
  return false;
}
