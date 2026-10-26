import { connectDatabase } from "./db.mjs";
const db = connectDatabase();
try {
  for (const table of [
    "sessions",
    "password_resets",
    "auth_limits",
    "oauth_states",
    "email_verifications",
    "password_reset_codes",
    "recovery_mail",
    "notification_mail",
  ]) {
    const r = await db.query(`DELETE FROM ${table} WHERE expires_at<now()`);
    console.log(table + ": removed " + r.rowCount + " expired rows");
  }
} finally {
  await db.end();
}
