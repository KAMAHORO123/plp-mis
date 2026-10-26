import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { connectDatabase } from "../src/db.mjs";
import { hashPassword } from "../src/auth.mjs";
import {
  requestVerification,
  confirmVerification,
} from "../src/email-verification.mjs";
import { deliverRecovery } from "../src/mail-worker.mjs";
const database = process.env.TEST_DATABASE_URL;
if (database) {
  if (!new URL(database).pathname.endsWith("_test"))
    throw Error("Test DB required");
  process.env.DATABASE_URL = database;
}
test(
  "email code cooldown, delivery, wrong attempts, expiry and single use",
  { skip: !database },
  async () => {
    const db = connectDatabase(),
      id = randomUUID(),
      email = `verify-${id}@example.test`;
    try {
      await db.query(
        "INSERT INTO users(id,email,name,password_hash) VALUES($1,$2,'Verify member',$3)",
        [id, email, await hashPassword("Some-password-123")],
      );
      await requestVerification(db, email);
      const queued = (
        await db.query(
          "SELECT * FROM recovery_mail WHERE recipient=$1 AND purpose='verification'",
          [email],
        )
      ).rows[0];
      assert.match(queued.token, /^\d{6}$/);
      await requestVerification(db, email);
      assert.equal(
        (
          await db.query(
            "SELECT count(*)::int AS n FROM recovery_mail WHERE recipient=$1",
            [email],
          )
        ).rows[0].n,
        1,
      );
      await db.query(
        "UPDATE recovery_mail SET next_attempt_at=now()-interval '2 days' WHERE recipient=$1",
        [email],
      );
      let mail;
      await deliverRecovery(
        db,
        {
          async sendMail(m) {
            mail = m;
          },
        },
        "https://hub.example.test",
        "mail@example.test",
      );
      assert.ok(mail.text.includes(queued.token));
      assert.match(mail.subject, /verification/);
      const wrong = queued.token === "000000" ? "111111" : "000000";
      for (let i = 0; i < 5; i++)
        assert.equal(await confirmVerification(db, email, wrong), false);
      assert.equal(await confirmVerification(db, email, queued.token), false);
      await db.query(
        "UPDATE email_verifications SET sent_at=now()-interval '2 minutes' WHERE user_id=$1",
        [id],
      );
      await requestVerification(db, email);
      let code = (
        await db.query("SELECT token FROM recovery_mail WHERE recipient=$1", [
          email,
        ])
      ).rows[0].token;
      await db.query(
        "UPDATE email_verifications SET expires_at=now()-interval '1 minute' WHERE user_id=$1",
        [id],
      );
      assert.equal(await confirmVerification(db, email, code), false);
      await db.query(
        "UPDATE email_verifications SET sent_at=now()-interval '2 minutes' WHERE user_id=$1",
        [id],
      );
      await requestVerification(db, email);
      code = (
        await db.query("SELECT token FROM recovery_mail WHERE recipient=$1", [
          email,
        ])
      ).rows[0].token;
      assert.equal(await confirmVerification(db, email, code), true);
      assert.equal(await confirmVerification(db, email, code), false);
      const user = (
        await db.query(
          "SELECT status,email_verified_at FROM users WHERE id=$1",
          [id],
        )
      ).rows[0];
      assert.ok(user.email_verified_at);
      assert.equal(user.status, "approved");
    } finally {
      await db.end();
    }
  },
);
