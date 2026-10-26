// Operator-assisted recovery until a transactional email provider is configured.
import { connectDatabase, transaction } from "./db.mjs";
import { sessionToken, digest } from "./auth.mjs";
const email = process.env.RESET_EMAIL?.trim().toLowerCase(),
  origin = process.env.APP_ORIGIN;
if (!email || !origin) throw Error("RESET_EMAIL and APP_ORIGIN are required");
const db = connectDatabase();
try {
  const token = sessionToken();
  await transaction(db, async (tx) => {
    const user = (
      await tx.query(
        "SELECT id FROM users WHERE email=$1 AND status='approved'",
        [email],
      )
    ).rows[0];
    if (!user) throw Error("Approved account not found");
    await tx.query(
      "DELETE FROM password_resets WHERE user_id=$1 OR expires_at<now()",
      [user.id],
    );
    await tx.query(
      "INSERT INTO password_resets(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '30 minutes')",
      [digest(token), user.id],
    );
    await tx.query(
      "INSERT INTO audit_log(action,entity_id) VALUES('password.recovery.request',$1)",
      [user.id],
    );
  });
  console.log("Private recovery link (expires in 30 minutes):");
  console.log(new URL("/auth/reset", origin).href + "#" + token);
} finally {
  await db.end();
}
