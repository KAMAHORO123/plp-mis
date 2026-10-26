import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { connectDatabase } from "../src/db.mjs";
import { createServer } from "../src/server.mjs";
import {sessionToken,digest,hashPassword,sessionJwt} from "../src/auth.mjs";
import { deliverRecovery } from "../src/mail-worker.mjs";
const database = process.env.TEST_DATABASE_URL;
if (database) {
  if (!new URL(database).pathname.endsWith("_test"))
    throw Error("Dedicated test database required");
  process.env.DATABASE_URL = database;
}
test(
  "Google state, linking, approvals and email recovery lifecycle",
  { skip: !database },
  async () => {
    const db = connectDatabase(),
      origin = "http://localhost:5175",
      tag = randomUUID(),
      email = `google-${tag}@example.test`;
    let flow,
      profile,
      exchangeCount = 0;
    const google = {
      _clientId: "test-client",
      generateAuthUrl(args) {
        flow = args;
        return "https://accounts.google.com/test";
      },
      async getToken(args) {
        exchangeCount++;
        assert.ok(args.codeVerifier);
        return { tokens: { id_token: "verified-by-mock" } };
      },
      async verifyIdToken(args) {
        assert.equal(args.audience, "test-client");
        return {
          getPayload: () => ({
            ...profile,
            nonce: profile.nonce ?? flow.nonce,
          }),
        };
      },
    };
    const server = createServer({
      db,
      origin,
      secure: false,
      google,
      recoveryEnabled: true,
      trustProxy: true,
    });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    const base = `http://127.0.0.1:${server.address().port}`;
    const call = (path, options = {}) =>
      fetch(base + path, {
        ...options,
        redirect: "manual",
        headers: {
          Origin: origin,
          "X-Real-IP": tag,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
    const begin = async (cookie = "") => {
      const r = await call("/auth/google", { headers: { Cookie: cookie } });
      assert.equal(r.status, 302);
      assert.equal(flow.code_challenge_method, "S256");
      return r.headers.getSetCookie()[0].split(";")[0];
    };
    const finish = (cookie, state = flow.state) =>
      call(`/auth/google/callback?state=${state}&code=test`, {
        headers: { Cookie: cookie },
      });
    try {
      profile = {
        sub: tag,
        email,
        email_verified: true,
        name: "Google Member",
      };
      let browser = await begin();
      let r = await finish("");
      assert.match(r.headers.get("location"), /failed/);
      assert.equal(exchangeCount, 0);
      r = await finish(browser);
      assert.match(r.headers.get("location"), /signup/);
      r = await finish(browser);
      assert.match(r.headers.get("location"), /failed/);
      assert.equal(
        (await db.query("SELECT 1 FROM users WHERE email=$1", [email]))
          .rowCount,
        0,
      );
      const user = (
        await db.query(
          "INSERT INTO users(id,email,name,password_hash) VALUES($1,$2,'Registered member',$3) RETURNING *",
          [randomUUID(), email, await hashPassword("Registered-password-123")],
        )
      ).rows[0];
      await db.query(
        "INSERT INTO google_identities(subject,user_id) VALUES($1,$2)",
        [tag, user.id],
      );
      assert.equal(user.role, "member");
      assert.equal(user.status, "pending");
      await db.query("UPDATE users SET status='approved',email_verified_at=now() WHERE id=$1", [
        user.id,
      ]);
      browser = await begin();
      r = await finish(browser);
      assert.equal(r.headers.get("location"), "/");
      const loginCookie = r.headers
        .getSetCookie()
        .find((v) => v.startsWith("plp_session="))
        .split(";")[0];
      assert.equal(
        (await call("/me", { headers: { Cookie: loginCookie } })).status,
        200,
      );
      browser = await begin();
      profile.nonce = "wrong";
      r = await finish(browser);
      assert.match(r.headers.get("location"), /failed/);
      delete profile.nonce;
      browser = await begin();
      profile.email_verified = false;
      r = await finish(browser);
      assert.match(r.headers.get("location"), /failed/);
      profile.email_verified = true;
      browser = await begin();
      await db.query(
        "UPDATE oauth_states SET expires_at=now()-interval '1 minute' WHERE token_hash=$1",
        [digest(flow.state)],
      );
      r = await finish(browser);
      assert.match(r.headers.get("location"), /failed/);
      await db.query("UPDATE users SET status='suspended' WHERE id=$1", [
        user.id,
      ]);
      browser = await begin();
      r = await finish(browser);
      assert.match(r.headers.get("location"), /pending/);
      await db.query("UPDATE users SET status='approved',email_verified_at=now() WHERE id=$1", [
        user.id,
      ]);
      const localId = randomUUID(),
        localEmail = `local-${tag}@example.test`,
        password = "A-real-test-password-123";
      await db.query(
        "INSERT INTO users(id,email,name,password_hash,status,email_verified_at) VALUES($1,$2,'Local member',$3,'approved',now())",
        [localId, localEmail, await hashPassword(password)],
      );
      profile = {
        sub: `local-${tag}`,
        email: localEmail,
        email_verified: true,
      };
      browser = await begin();
      r = await finish(browser);
      assert.match(r.headers.get("location"), /link/);
      const localToken = sessionToken();
      await db.query(
        "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 day')",
        [digest(localToken), localId],
      );
      browser = await begin("plp_session=" + sessionJwt(localId, localToken));
      r = await finish(browser + "; plp_session=" + sessionJwt(localId, localToken));
      assert.equal(r.headers.get("location"), "/");
      const forgot = (address) =>
        call("/auth/forgot", {
          method: "POST",
          body: JSON.stringify({ email: address }),
        });
      const known = await forgot(email),
        unknown = await forgot(`unknown-${tag}@example.test`);
      assert.equal(known.status, 202);
      assert.deepEqual(await known.json(), await unknown.json());
      await forgot(email);
      const queued = (
        await db.query("SELECT * FROM recovery_mail WHERE recipient=$1", [
          email,
        ])
      ).rows;
      assert.equal(queued.length, 1);
      assert.equal(queued[0].purpose, "reset_code");
      const code = queued[0].token;
      assert.match(code, /^\d{6}$/);
      let message;
      // Prioritize this fixture when the dedicated test DB contains older runs.
      await db.query(
        "UPDATE recovery_mail SET next_attempt_at=now()-interval '1 day' WHERE recipient=$1",
        [email],
      );
      await deliverRecovery(
        db,
        {
          async sendMail(m) {
            message = m;
          },
        },
        origin,
        "PLP <mail@example.test>",
      );
      assert.equal(message.to, email);
      assert.equal(message.subject, "Your PLP password reset code");
      assert.ok(message.text.includes(code));
      assert.equal(
        (
          await db.query("SELECT 1 FROM recovery_mail WHERE recipient=$1", [
            email,
          ])
        ).rowCount,
        0,
      );
      const verify = (value) =>
        call("/auth/forgot/verify", {
          method: "POST",
          body: JSON.stringify({ email, code: value }),
        });
      const wrong = (value) => (value === "000000" ? "111111" : "000000");
      assert.equal((await verify(wrong(code))).status, 400);
      const verified = await verify(code);
      assert.equal(verified.status, 200);
      const { token } = await verified.json();
      assert.equal((await verify(code)).status, 400);
      const reset = () =>
        call("/auth/reset", {
          method: "POST",
          body: JSON.stringify({ token, password }),
        });
      assert.equal((await reset()).status, 200);
      assert.equal((await reset()).status, 400);
      assert.equal(
        (await call("/me", { headers: { Cookie: loginCookie } })).status,
        401,
      );
      assert.equal(
        (
          await call("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
          })
        ).status,
        200,
      );
      await forgot(email);
      // Prioritize this fixture when the dedicated test DB contains older runs.
      await db.query(
        "UPDATE recovery_mail SET next_attempt_at=now()-interval '1 day' WHERE recipient=$1",
        [email],
      );
      await deliverRecovery(
        db,
        {
          async sendMail() {
            throw Error("SMTP offline");
          },
        },
        origin,
        "mail@example.test",
      );
      const retry = (
        await db.query(
          "SELECT attempts,token FROM recovery_mail WHERE recipient=$1",
          [email],
        )
      ).rows[0];
      assert.equal(retry.attempts, 1);
      for (let i = 0; i < 5; i++) await verify(wrong(retry.token));
      assert.equal((await verify(retry.token)).status, 400);
      await db.query(
        "UPDATE password_reset_codes SET sent_at=now()-interval '2 minutes' WHERE user_id=$1",
        [user.id],
      );
      await forgot(email);
      const fresh = (
        await db.query("SELECT token FROM recovery_mail WHERE recipient=$1", [
          email,
        ])
      ).rows[0].token;
      await db.query(
        "UPDATE password_reset_codes SET expires_at=now()-interval '1 minute' WHERE user_id=$1",
        [user.id],
      );
      assert.equal((await verify(fresh)).status, 400);
      await db.query("DELETE FROM recovery_mail WHERE recipient=$1", [email]);
      const csrf = await call("/auth/forgot", {
        method: "POST",
        headers: { Origin: "https://attacker.test" },
        body: JSON.stringify({ email }),
      });
      assert.equal(csrf.status, 403);
    } finally {
      await new Promise((r) => server.close(r));
      await db.end();
    }
  },
);
