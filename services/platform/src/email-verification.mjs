import { randomInt, randomUUID } from "node:crypto";
import { hashPassword, verifyPassword } from "./auth.mjs";
import { transaction } from "./db.mjs";
export async function requestVerification(db, email) {
  await transaction(db, async (tx) => {
    const user = (
      await tx.query(
        "SELECT id FROM users WHERE email=$1 AND email_verified_at IS NULL AND status IN ('pending','approved') FOR UPDATE",
        [email],
      )
    ).rows[0];
    if (!user) return;
    if (
      (
        await tx.query(
          "SELECT 1 FROM email_verifications WHERE user_id=$1 AND sent_at>now()-interval '60 seconds'",
          [user.id],
        )
      ).rowCount
    )
      return;
    const code = String(randomInt(0, 1000000)).padStart(6, "0");
    await tx.query(
      "INSERT INTO email_verifications(user_id,code_hash,expires_at) VALUES($1,$2,now()+interval '10 minutes') ON CONFLICT(user_id) DO UPDATE SET code_hash=excluded.code_hash,attempts=0,sent_at=now(),expires_at=excluded.expires_at",
      [user.id, await hashPassword(code)],
    );
    await tx.query(
      "DELETE FROM recovery_mail WHERE recipient=$1 AND purpose='verification'",
      [email],
    );
    await tx.query(
      "INSERT INTO recovery_mail(id,recipient,token,purpose,expires_at) VALUES($1,$2,$3,'verification',now()+interval '10 minutes')",
      [randomUUID(), email, code],
    );
  });
}
export async function confirmVerification(db, email, code) {
  return transaction(db, async (tx) => {
    const row = (
      await tx.query(
        "SELECT v.* FROM email_verifications v JOIN users u ON u.id=v.user_id WHERE u.email=$1 AND u.status IN ('pending','approved') AND v.expires_at>now() FOR UPDATE OF v",
        [email],
      )
    ).rows[0];
    if (!row || row.attempts >= 5) return false;
    await tx.query(
      "UPDATE email_verifications SET attempts=attempts+1 WHERE user_id=$1",
      [row.user_id],
    );
    // A daily cap per account that a new code does not reset, so codes cannot be guessed across many requests.
    const daily = (await tx.query(
      "INSERT INTO auth_limits(key,count,expires_at) VALUES($1,1,now()+interval '24 hours') ON CONFLICT(key) DO UPDATE SET count=CASE WHEN auth_limits.expires_at<now() THEN 1 ELSE auth_limits.count+1 END,expires_at=CASE WHEN auth_limits.expires_at<now() THEN now()+interval '24 hours' ELSE auth_limits.expires_at END RETURNING count",
      [`code-guess:verify:${row.user_id}`],
    )).rows[0].count;
    if (daily > 15) return false;
    if (!(await verifyPassword(code, row.code_hash))) return false;
    await tx.query("UPDATE users SET email_verified_at=now(), status=CASE WHEN status='pending' AND role='member' THEN 'approved' ELSE status END WHERE id=$1", [
      row.user_id,
    ]);
    await tx.query("DELETE FROM email_verifications WHERE user_id=$1", [
      row.user_id,
    ]);
    await tx.query(
      "DELETE FROM recovery_mail WHERE recipient=$1 AND purpose='verification'",
      [email],
    );
    return true;
  });
}
