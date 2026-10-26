// Shared helpers for the local demo scripts. They talk to a running platform API as real accounts would.
import { randomUUID } from "node:crypto";
import { connectDatabase } from "../src/db.mjs";
import { digest, hashPassword, sessionToken, sessionJwt } from "../src/auth.mjs";

// Demo accounts share a known password, so refuse anything that is not a database on this machine.
const dbHost = (() => { try { return new URL(process.env.DATABASE_URL).hostname; } catch { return ""; } })();
if (process.env.NODE_ENV === "production" || !["127.0.0.1", "localhost", "::1"].includes(dbHost))
  throw Error("Demo scripts only run against a local development database.");

export const API = process.env.DEMO_API ?? `http://127.0.0.1:${process.env.PORT || 8082}/api`;
export const ORIGIN = process.env.APP_ORIGIN;
export const PASSWORD = "DemoPass2026!";
export const DOMAIN = "plp-demo.test";
export const db = connectDatabase();
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const day = (offset) => new Date(Date.now() + offset * 864e5).toISOString().slice(0, 10);

/** Signs a demo account in by creating a session directly, then returns an API client acting as that person. */
export async function as(email) {
  const user = (await db.query("SELECT id,name,email,role FROM users WHERE email=$1", [email])).rows[0];
  if (!user) throw Error(`Demo account ${email} is missing. Run the seed first.`);
  const token = sessionToken();
  await db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '2 hours')", [digest(token), user.id]);
  const call = async (method, path, body, headers = {}) => {
    const r = await fetch(API + path, {
      method,
      headers: { Origin: ORIGIN, Cookie: `plp_session=${sessionJwt(user.id, token)}`, ...(body && !(body instanceof Uint8Array) ? { "Content-Type": "application/json" } : {}), ...headers },
      body: body instanceof Uint8Array ? body : body ? JSON.stringify(body) : undefined,
    });
    const data = await r.json().catch(() => null);
    if (!r.ok) throw Error(`${user.name}: ${method} ${path} → ${r.status} ${data?.error ?? ""}`);
    return data;
  };
  return {
    ...user,
    get: (p) => call("GET", p),
    post: (p, b) => call("POST", p, b ?? {}),
    put: (p, b) => call("PUT", p, b),
    patch: (p, b) => call("PATCH", p, b),
    upload: (name, bytes, type) => call("POST", "/files", bytes, { "Content-Type": type, "x-file-name": name }).then((r) => r.id),
    /** Updates a record by reading its current version first, as the Hub does. */
    update: async (kind, id, change) => { const r = await call("GET", `/records/${kind}/${id}`); return call("PUT", `/records/${kind}/${id}`, { version: r.version, data: { ...r.data, ...change } }); },
  };
}

export async function createAccount(name, email, role, schoolId = null) {
  await db.query(
    "INSERT INTO users(id,email,name,password_hash,role,status,school_id,email_verified_at) VALUES($1,$2,$3,$4,$5,'approved',$6,now()) ON CONFLICT(email) DO NOTHING",
    [randomUUID(), email, name, await hashPassword(PASSWORD), role, schoolId],
  );
}

/** A small valid one-page PDF, used as a stand-in certificate or handout. */
export function pdf(text) {
  const stream = `BT /F1 18 Tf 72 720 Td (${text.replace(/[()\\]/g, "")}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets = objects.map((o, i) => { const at = out.length; out += `${i + 1} 0 obj\n${o}\nendobj\n`; return at; });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}
