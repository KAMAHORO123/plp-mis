import { randomInt, randomUUID } from "node:crypto";
import { digest, hashPassword, sessionToken, verifyPassword } from "./auth.mjs";
import { transaction } from "./db.mjs";
// Six-digit codes are emailed; a correct code is exchanged for a short-lived reset token.
export async function requestResetCode(db, email) {
  await transaction(db, async (tx) => {
    const user = (
      await tx.query(
        "SELECT id FROM users WHERE email=$1 AND status='approved' FOR UPDATE",
        [email],
      )
    ).rows[0];
    if (!user) return;
    if (
      (
        await tx.query(
          "SELECT 1 FROM password_reset_codes WHERE user_id=$1 AND sent_at>now()-interval '60 seconds'",
          [user.id],
        )
      ).rowCount
    )
      return;
    const code = String(randomInt(0, 1000000)).padStart(6, "0");
    await tx.query(
      "INSERT INTO password_reset_codes(user_id,code_hash,expires_at) VALUES($1,$2,now()+interval '10 minutes') ON CONFLICT(user_id) DO UPDATE SET code_hash=excluded.code_hash,attempts=0,sent_at=now(),expires_at=excluded.expires_at",
      [user.id, await hashPassword(code)],
    );
    await tx.query(
      "DELETE FROM recovery_mail WHERE recipient=$1 AND purpose='reset_code'",
      [email],
    );
    await tx.query(
      "INSERT INTO recovery_mail(id,recipient,token,purpose,expires_at) VALUES($1,$2,$3,'reset_code',now()+interval '10 minutes')",
      [randomUUID(), email, code],
    );
  });
}
export async function confirmResetCode(db, email, code) {
  return transaction(db, async (tx) => {
    const row = (
      await tx.query(
        "SELECT c.* FROM password_reset_codes c JOIN users u ON u.id=c.user_id WHERE u.email=$1 AND u.status='approved' AND c.expires_at>now() FOR UPDATE OF c",
        [email],
      )
    ).rows[0];
    if (!row || row.attempts >= 5) return null;
    await tx.query(
      "UPDATE password_reset_codes SET attempts=attempts+1 WHERE user_id=$1",
      [row.user_id],
    );
    if (!(await verifyPassword(code, row.code_hash))) return null;
    const token = sessionToken();
    await tx.query("DELETE FROM password_reset_codes WHERE user_id=$1", [
      row.user_id,
    ]);
    await tx.query("DELETE FROM password_resets WHERE user_id=$1", [
      row.user_id,
    ]);
    await tx.query(
      "INSERT INTO password_resets(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '15 minutes')",
      [digest(token), row.user_id],
    );
    await tx.query(
      "DELETE FROM recovery_mail WHERE recipient=$1 AND purpose='reset_code'",
      [email],
    );
    return token;
  });
}
