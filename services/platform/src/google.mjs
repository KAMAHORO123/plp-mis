import { OAuth2Client } from "google-auth-library";
import { createHash } from "node:crypto";
import { digest, sessionToken, cookie, readToken, sessionJwt } from "./auth.mjs";
import { transaction } from "./db.mjs";
export function googleClient(origin) {
  return process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        new URL("/api/auth/google/callback", origin).href,
      )
    : null;
}
export async function googleRoute({
  req,
  res,
  url,
  p,
  db,
  origin,
  secure,
  client,
}) {
  if (
    !["/auth/google", "/auth/google/callback"].includes(p) ||
    req.method !== "GET"
  )
    return false;
  const stateCookie = (value) =>
    `plp_oauth=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${value ? 600 : 0}${secure ? "; Secure" : ""}`;
  const redirect = (location) => {
    res.writeHead(302, { Location: location });
    res.end();
    return true;
  };
  if (!client) return redirect("/auth/login?auth=unavailable");
  if (p === "/auth/google") {
    const state = sessionToken(),
      verifier = sessionToken(),
      nonce = sessionToken();
    const user = (
      await db.query(
        "SELECT u.id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.status='approved'",
        [digest(readToken(req))],
      )
    ).rows[0];
    await db.query(
      "INSERT INTO oauth_states(token_hash,verifier,nonce,user_id,expires_at) VALUES($1,$2,$3,$4,now()+interval '10 minutes')",
      [digest(state), verifier, nonce, user?.id || null],
    );
    res.setHeader("Set-Cookie", stateCookie(state));
    return redirect(
      client.generateAuthUrl({
        scope: ["openid", "email", "profile"],
        state,
        nonce,
        code_challenge: createHash("sha256")
          .update(verifier)
          .digest("base64url"),
        code_challenge_method: "S256",
        prompt: "select_account",
      }),
    );
  }
  res.setHeader("Set-Cookie", stateCookie(""));
  try {
    const state = url.searchParams.get("state");
    const browserState = (req.headers.cookie || "")
      .split(";")
      .map((v) => v.trim())
      .find((v) => v.startsWith("plp_oauth="))
      ?.slice(10);
    if (!state || state !== browserState)
      return redirect("/auth/login?auth=failed");
    const flow = (
      await db.query(
        "DELETE FROM oauth_states WHERE token_hash=$1 AND expires_at>now() RETURNING *",
        [digest(state)],
      )
    ).rows[0];
    if (!flow || url.searchParams.has("error") || !url.searchParams.get("code"))
      return redirect("/auth/login?auth=failed");
    if (flow.user_id) {
      const active = await db.query(
        "SELECT 1 FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.user_id=$2 AND s.expires_at>now() AND u.status='approved'",
        [digest(readToken(req)), flow.user_id],
      );
      if (!active.rowCount) return redirect("/auth/login?auth=failed");
    }
    const { tokens } = await client.getToken({
      code: url.searchParams.get("code"),
      codeVerifier: flow.verifier,
    });
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: client._clientId,
    });
    const profile = ticket.getPayload();
    if (
      !profile?.sub ||
      profile.nonce !== flow.nonce ||
      profile.email_verified !== true ||
      !profile.email ||
      profile.email.length > 254
    )
      return redirect("/auth/login?auth=failed");
    const email = profile.email.toLowerCase();
    const user = await transaction(db, async (tx) => {
      // Serialize identity creation/linking to avoid concurrent first-login races.
      await tx.query("SELECT pg_advisory_xact_lock(hashtext($1))", [email]);
      const existing = (
        await tx.query(
          "SELECT u.* FROM google_identities g JOIN users u ON u.id=g.user_id WHERE g.subject=$1",
          [profile.sub],
        )
      ).rows[0];
      if (existing) {
        if (flow.user_id && flow.user_id !== existing.id) throw Error("link");
        return existing;
      }
      let target = (
        await tx.query("SELECT * FROM users WHERE email=$1", [email])
      ).rows[0];
      // Never silently attach Google to an account with an existing password.
      if (target && target.id !== flow.user_id) throw Error("link");
      if (flow.user_id && (!target || target.id !== flow.user_id))
        throw Error("link");
      if (!target) throw Error("signup");
      await tx.query(
        "INSERT INTO google_identities(subject,user_id) VALUES($1,$2)",
        [profile.sub, target.id],
      );
      await tx.query(
        "INSERT INTO audit_log(actor_id,action,entity_id) VALUES($1,'google.connected',$2)",
        [target.id, target.id],
      );
      return target;
    });
    if (!user.email_verified_at) return redirect("/auth/verify-email");
    if (user.status !== "approved") return redirect("/auth/login?auth=pending");
    const token = sessionToken();
    await db.query(
      "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 day')",
      [digest(token), user.id],
    );
    res.setHeader("Set-Cookie", [stateCookie(""), cookie(sessionJwt(user.id, token), secure)]);
    return redirect("/");
  } catch (error) {
    return redirect(
      "/auth/login?auth=" +
        (["link", "signup"].includes(error.message) ? error.message : "failed"),
    );
  }
}
