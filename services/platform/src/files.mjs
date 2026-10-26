import { randomUUID } from "node:crypto";
import { mkdir, unlink, readFile, open, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { transaction } from "./db.mjs";
import { canRead } from "./policy.mjs";
const VIDEO = new Set(["video/mp4", "video/webm"]);
const MAX_DOCUMENT = 10485760, MAX_VIDEO = 524288000, MEMBER_QUOTA = 52428800, STAFF_QUOTA = 5368709120;
function detectMime(head) {
  if (head.subarray(0, 5).toString() === "%PDF-") return "application/pdf";
  if (head.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (head[0] === 255 && head[1] === 216 && head[2] === 255) return "image/jpeg";
  if (head.subarray(4, 8).toString() === "ftyp") return "video/mp4";
  if (head.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return "video/webm";
  return "";
}
const fail = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
export async function filesRoute({ req, res, pathname, db, user, directory }) {
  if (pathname === "/files" && req.method === "POST") {
    if (!directory) fail(503, "File storage is not configured");
    const filename = String(req.headers["x-file-name"] || "document")
      .replace(/[^a-zA-Z0-9._ -]/g, "_")
      .slice(0, 120);
    const staff = ["trainer", "admin"].includes(user.role);
    const id = randomUUID();
    await mkdir(directory, { recursive: true });
    const destination = path.join(directory, id);
    // Stream to disk so large course videos never sit in memory; the type is decided from the first bytes.
    const out = await open(destination, "wx", 0o600);
    let bytes = 0, mime = "", head = Buffer.alloc(0);
    try {
      for await (const chunk of req) {
        if (!mime) {
          head = Buffer.concat([head, chunk]);
          if (head.length < 16) continue;
          mime = detectMime(head);
          if (!mime) fail(400, "Choose a PDF, PNG, JPEG, MP4 or WebM file");
          if (VIDEO.has(mime) && !staff) fail(403, "Only trainers can upload videos");
          bytes += head.length;
          await out.write(head);
          continue;
        }
        bytes += chunk.length;
        if (bytes > (VIDEO.has(mime) ? MAX_VIDEO : MAX_DOCUMENT)) fail(413, VIDEO.has(mime) ? "Videos must be 500 MB or smaller" : "Files must be 10 MB or smaller");
        await out.write(chunk);
      }
      if (!mime) { mime = detectMime(head); if (!mime) fail(400, "Choose a PDF, PNG, JPEG, MP4 or WebM file"); bytes = head.length; await out.write(head); }
      if (bytes > (VIDEO.has(mime) ? MAX_VIDEO : MAX_DOCUMENT)) fail(413, "File is too large");
      await out.close();
      await transaction(db, async (tx) => {
        await tx.query("SELECT pg_advisory_xact_lock(hashtext($1))", [user.id]);
        const total = Number(
          (
            await tx.query(
              "SELECT COALESCE(sum(bytes),0) AS bytes FROM files WHERE owner_id=$1",
              [user.id],
            )
          ).rows[0].bytes,
        );
        const allowance = staff ? STAFF_QUOTA : MEMBER_QUOTA;
        if (total + bytes > allowance)
          fail(413, `Your ${staff ? "5 GB" : "50 MB"} file allowance is full`);
        await tx.query(
          "INSERT INTO files(id,owner_id,filename,mime,bytes) VALUES($1,$2,$3,$4,$5)",
          [id, user.id, filename, mime, bytes],
        );
        await tx.query(
          "INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,'file.upload',$2)",
          [user.id, id],
        );
      });
    } catch (error) {
      await out.close().catch(() => {});
      await unlink(destination).catch(() => {});
      throw error;
    }
    res.writeHead(201);
    res.end(JSON.stringify({ id, filename, mime, bytes }));
    return true;
  }
  if (pathname === "/files" && req.method === "GET") {
    const files = (
      await db.query(
        "SELECT id,filename,mime,bytes,created_at FROM files WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 500",
        [user.id],
      )
    ).rows;
    res.end(JSON.stringify(files));
    return true;
  }
  const match = pathname.match(/^\/files\/([a-f0-9]{8}-[a-f0-9-]{27})$/);
  if (!match) return false;
  if (!directory) fail(503, "File storage is not configured");
  const id = match[1],
    file = (await db.query("SELECT * FROM files WHERE id=$1", [id])).rows[0];
  if (!file) fail(404, "File not found");
  const records = (
    await db.query(
      "SELECT * FROM records WHERE data->'attachments' @> $1::jsonb",
      [JSON.stringify([id])],
    )
  ).rows;
  const owner = user.role === "admin" || file.owner_id === user.id;
  if (req.method === "GET") {
    if (!owner && !records.some((r) => canRead(user, r)))
      fail(404, "File not found");
    const location = path.join(directory, id);
    res.setHeader("Content-Type", file.mime);
    res.setHeader("Content-Disposition", `${VIDEO.has(file.mime) || file.mime.startsWith("image/") ? "inline" : "attachment"}; filename="${file.filename}"`);
    if (VIDEO.has(file.mime)) {
      if (!(await stat(location).catch(() => null))) fail(404, "File not found");
      // Byte ranges let the browser seek within a lesson video without downloading all of it.
      const size = Number(file.bytes);
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Cache-Control", "private, max-age=3600");
      if (range && (range[1] || range[2])) {
        const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
        const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
        if (start >= size || start > end) { res.writeHead(416, { "Content-Range": `bytes */${size}` }); res.end(); return true; }
        res.writeHead(206, { "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": end - start + 1 });
        createReadStream(location, { start, end }).pipe(res);
        return true;
      }
      res.writeHead(200, { "Content-Length": size });
      createReadStream(location).pipe(res);
      return true;
    }
    res.end(await readFile(location).catch((e) => { if (e.code === "ENOENT") fail(404, "File not found"); throw e; }));
    return true;
  }
  if (req.method === "DELETE") {
    if (!owner) fail(404, "File not found");
    await transaction(db, async (tx) => {
      await tx.query("SELECT id FROM files WHERE id=$1 FOR UPDATE", [id]);
      const refs = await tx.query(
        "SELECT 1 FROM records WHERE data->'attachments' @> $1::jsonb LIMIT 1",
        [JSON.stringify([id])],
      );
      if (refs.rowCount)
        fail(409, "Remove this file from its records before deleting it");
      await tx.query("DELETE FROM files WHERE id=$1", [id]);
      await tx.query(
        "INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,'file.delete',$2)",
        [user.id, id],
      );
    });
    await unlink(path.join(directory, id));
    res.end(JSON.stringify({ ok: true }));
    return true;
  }
  return false;
}
export async function validateAttachments(db, user, data) {
  for (const id of data.attachments || []) {
    const f = (
      await db.query("SELECT owner_id FROM files WHERE id=$1 FOR SHARE", [id])
    ).rows[0];
    if (!f || (f.owner_id !== user.id && user.role !== "admin"))
      fail(400, "Attachment does not belong to you");
  }
}

const AVATAR_BYTES = 2097152;
/** Profile pictures: members set their own; any signed-in member can view them. */
export async function avatarRoute({ req, res, pathname, db, user, directory }) {
  if (pathname === "/me/avatar" && req.method === "PUT") {
    let input = "";
    for await (const chunk of req) { input += chunk; if (input.length > 1000) fail(413, "Request too large"); }
    let fileId;
    try { fileId = JSON.parse(input || "{}").file_id ?? null; } catch { fail(400, "Invalid JSON"); }
    if (fileId !== null && !/^[a-f0-9]{8}-[a-f0-9-]{27}$/.test(String(fileId))) fail(400, "Invalid file");
    const previous = await transaction(db, async (tx) => {
      if (fileId) {
        const file = (await tx.query("SELECT owner_id,mime,bytes FROM files WHERE id=$1 FOR SHARE", [fileId])).rows[0];
        if (!file || file.owner_id !== user.id) fail(400, "Upload the photo from your own account");
        if (!["image/png", "image/jpeg"].includes(file.mime)) fail(400, "Profile pictures must be PNG or JPEG images");
        if (Number(file.bytes) > AVATAR_BYTES) fail(413, "Profile pictures must be 2 MB or smaller");
      }
      const old = (await tx.query("SELECT avatar_file_id FROM users WHERE id=$1 FOR UPDATE", [user.id])).rows[0]?.avatar_file_id;
      await tx.query("UPDATE users SET avatar_file_id=$1 WHERE id=$2", [fileId, user.id]);
      await tx.query("INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,'profile.avatar',$2)", [user.id, user.id]);
      // The replaced picture is no longer used anywhere, so it does not count against the member's storage.
      if (old && old !== fileId) await tx.query("DELETE FROM files WHERE id=$1 AND owner_id=$2", [old, user.id]);
      return old && old !== fileId ? old : null;
    });
    if (previous && directory) await unlink(path.join(directory, previous)).catch(() => {});
    res.end(JSON.stringify({ avatar_file_id: fileId }));
    return true;
  }
  const match = pathname.match(/^\/avatars\/([a-f0-9]{8}-[a-f0-9-]{27})$/);
  if (!match || req.method !== "GET") return false;
  if (!directory) fail(503, "File storage is not configured");
  const row = (await db.query("SELECT f.id,f.mime FROM users u JOIN files f ON f.id=u.avatar_file_id WHERE u.id=$1 AND u.status='approved'", [match[1]])).rows[0];
  if (!row) fail(404, "No profile picture");
  const data = await readFile(path.join(directory, row.id)).catch((e) => { if (e.code === "ENOENT") fail(404, "No profile picture"); throw e; });
  res.setHeader("Content-Type", row.mime);
  res.setHeader("Content-Disposition", "inline");
  res.setHeader("Cache-Control", "private, max-age=300");
  res.end(data);
  return true;
}
