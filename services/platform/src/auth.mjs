import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
  createHmac,
} from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCallback);
export const digest = (value) =>
  createHash("sha256").update(value).digest("hex");
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64);
  return `${salt}:${key.toString("hex")}`;
}
export async function verifyPassword(password, hash) {
  const [salt, key] = hash.split(":");
  const actual = await scrypt(password, salt, 64);
  const expected = Buffer.from(key, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export const sessionToken = () => randomBytes(32).toString("base64url");
export function cookie(token, secure = true, days = 1) {
  return `plp_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${token ? 86400 * days : 0}${secure ? "; Secure" : ""}`;
}

// Session cookies carry a signed JWT (HS256) naming the user (sub) and the server-side session (sid).
// The signature, issuer, audience and expiry are checked first; the session must then still exist in the
// database, so signing out, suspension and password changes end access immediately (unlike a bare JWT).
const ISSUER = "plp-platform", AUDIENCE = "plp-hub", ALG = "HS256", MAX_TOKEN = 2048;
let developmentSecret;
/** Signing secrets: JWT_SECRET signs, JWT_SECRET_PREVIOUS still verifies during a rotation. */
export function jwtSecrets(env = process.env) {
  const current = env.JWT_SECRET?.trim(), previous = env.JWT_SECRET_PREVIOUS?.trim();
  if (current) {
    if (current.length < 32) throw Error("JWT_SECRET must be at least 32 random characters");
    return previous ? [current, previous] : [current];
  }
  if (env.NODE_ENV === "production") throw Error("JWT_SECRET is required in production (at least 32 random characters)");
  // Development and tests only: a random secret for this process (sessions end when it restarts).
  developmentSecret ??= randomBytes(32).toString("base64url");
  return [developmentSecret];
}
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const signature = (data, secret) => createHmac("sha256", secret).update(data).digest("base64url");
export function signJwt(claims, secret = jwtSecrets()[0]) {
  const data = `${encode({ alg: ALG, typ: "JWT" })}.${encode(claims)}`;
  return `${data}.${signature(data, secret)}`;
}
/** The verified claims, or null for anything missing, malformed, unsigned, tampered with, foreign or expired. */
export function verifyJwt(token, secrets = jwtSecrets(), now = Date.now() / 1000) {
  if (typeof token !== "string" || !token || token.length > MAX_TOKEN) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  let header, claims;
  try { header = JSON.parse(Buffer.from(parts[0], "base64url").toString()); claims = JSON.parse(Buffer.from(parts[1], "base64url").toString()); }
  catch { return null; }
  // Only our algorithm: refuses "none" and algorithm-confusion tokens.
  if (header?.alg !== ALG || header?.typ !== "JWT") return null;
  const given = Buffer.from(parts[2]);
  const valid = secrets.some((secret) => {
    const expected = Buffer.from(signature(`${parts[0]}.${parts[1]}`, secret));
    return expected.length === given.length && timingSafeEqual(expected, given);
  });
  if (!valid || !claims || typeof claims !== "object") return null;
  if (claims.iss !== ISSUER || claims.aud !== AUDIENCE) return null;
  if (typeof claims.exp !== "number" || claims.exp <= now) return null;
  if (typeof claims.nbf === "number" && claims.nbf > now + 60) return null;
  if (typeof claims.sub !== "string" || typeof claims.sid !== "string") return null;
  return claims;
}
/** A session JWT for the cookie; `sid` is the random session key whose hash is stored in the database. */
export function sessionJwt(userId, sid, days = 1) {
  const iat = Math.floor(Date.now() / 1000);
  return signJwt({ iss: ISSUER, aud: AUDIENCE, sub: userId, sid, iat, nbf: iat, exp: iat + 86400 * days, jti: randomBytes(9).toString("base64url") });
}
const rawCookie = (req) => (req.headers.cookie || "").split(";").map((s) => s.trim()).find((s) => s.startsWith("plp_session="))?.slice(12) || "";
/** The signed-in session named by a valid JWT cookie, or null. */
export function readSession(req) {
  const claims = verifyJwt(rawCookie(req));
  return claims ? { sid: claims.sid, userId: claims.sub } : null;
}
/** The session key from a valid JWT cookie, or "" (which matches no session). */
export const readToken = (req) => readSession(req)?.sid ?? "";
