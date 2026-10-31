import { queueReminders } from "./reminders.mjs";
import { renderEmail } from "./email-template.mjs";
import { verifyPassword } from "./auth.mjs";
import { mailConfigured, createMailTransport } from "./mail-config.mjs";
import { fileURLToPath } from "node:url";
import { connectDatabase, transaction } from "./db.mjs";
import { digest } from "./auth.mjs";
export async function deliverRecovery(db, transporter, origin, from) {
  return transaction(db, async (tx) => {
    await tx.query("DELETE FROM recovery_mail WHERE expires_at<now()");
    const mail = (
      await tx.query(
        "SELECT * FROM recovery_mail WHERE next_attempt_at<=now() AND attempts<5 ORDER BY next_attempt_at FOR UPDATE SKIP LOCKED LIMIT 1",
      )
    ).rows[0];
    if (!mail) return false;
    let valid;
    if (mail.purpose === "verification") {
      const row = (
        await tx.query(
          "SELECT v.code_hash FROM email_verifications v JOIN users u ON u.id=v.user_id WHERE u.email=$1 AND v.expires_at>now() AND v.attempts<5",
          [mail.recipient],
        )
      ).rows[0];
      valid = row && (await verifyPassword(mail.token, row.code_hash));
    } else if (mail.purpose === "reset_code") {
      const row = (
        await tx.query(
          "SELECT c.code_hash FROM password_reset_codes c JOIN users u ON u.id=c.user_id WHERE u.email=$1 AND c.expires_at>now() AND c.attempts<5",
          [mail.recipient],
        )
      ).rows[0];
      valid = row && (await verifyPassword(mail.token, row.code_hash));
    } else {
      valid = (
        await tx.query(
          "SELECT 1 FROM password_resets WHERE token_hash=$1 AND expires_at>now()",
          [digest(mail.token)],
        )
      ).rowCount;
    }
    if (!valid) {
      await tx.query("DELETE FROM recovery_mail WHERE id=$1", [mail.id]);
      return true;
    }
    try {
      const message =
        mail.purpose === "verification"
          ? { subject: "Your PLP verification code", ...renderEmail({ origin, preheader: `Your code is ${mail.token}`, heading: "Verify your email", paragraphs: ["Enter this code on the PLP Hub verification page to finish setting up your account."], code: mail.token, footnote: "The code expires in 10 minutes and can be used once. If you did not create a PLP account, you can ignore this email." }) }
          : mail.purpose === "reset_code"
            ? { subject: "Your PLP password reset code", ...renderEmail({ origin, preheader: `Your reset code is ${mail.token}`, heading: "Reset your password", paragraphs: ["Enter this code on the password reset page, then choose a new password."], code: mail.token, footnote: "The code expires in 10 minutes and can be used once. If you did not ask to reset your password, ignore this email; your password will not change." }) }
            : { subject: "Reset your PLP password", ...renderEmail({ origin, heading: "Reset your password", paragraphs: ["You asked to reset the password for your PLP Hub account."], button: { label: "Choose a new password", url: `${new URL("/auth/reset", origin).href}#${mail.token}` }, footnote: "This link expires in 30 minutes and can be used once. If you did not ask for this, you can ignore this email." }) };
      await transporter.sendMail({ from, to: mail.recipient, subject: message.subject, text: message.text, html: message.html });
      await tx.query("DELETE FROM recovery_mail WHERE id=$1", [mail.id]);
    } catch {
      await tx.query(
        "UPDATE recovery_mail SET attempts=attempts+1,next_attempt_at=now()+interval '2 minutes' WHERE id=$1",
        [mail.id],
      );
      console.error(
        "Password recovery email delivery failed; queued for retry.",
      );
    }
    return true;
  });
}
export async function deliverNotification(db, transporter, from) {
  return transaction(db, async (tx) => {
    await tx.query("DELETE FROM notification_mail WHERE expires_at<now()");
    const mail = (
      await tx.query(
        "SELECT * FROM notification_mail WHERE next_attempt_at<=now() AND attempts<5 ORDER BY next_attempt_at FOR UPDATE SKIP LOCKED LIMIT 1",
      )
    ).rows[0];
    if (!mail) return false;
    if (mail.reminder_session_id && !(await tx.query("SELECT 1 FROM mentor_sessions WHERE id=$1 AND date=$2 AND status='Confirmed' AND date>now()", [mail.reminder_session_id, mail.reminder_session_date])).rowCount) {
      await tx.query('DELETE FROM notification_mail WHERE id=$1', [mail.id]);
      return true;
    }
    try {
      await transporter.sendMail({ from, to: mail.recipient, subject: mail.subject, text: mail.body, ...(mail.html ? { html: mail.html } : {}) });
      await tx.query("DELETE FROM notification_mail WHERE id=$1", [mail.id]);
    } catch {
      await tx.query(
        "UPDATE notification_mail SET attempts=attempts+1,next_attempt_at=now()+interval '2 minutes' WHERE id=$1",
        [mail.id],
      );
      console.error("Notification email delivery failed; queued for retry.");
    }
    return true;
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!process.env.APP_ORIGIN) throw Error('Configure APP_ORIGIN');
  const transport = mailConfigured() ? createMailTransport() : null;
  if (!transport) console.info('Email is not configured; in-app reminders remain enabled.');
  const db = connectDatabase();
  let stopped = false;
  process.on("SIGTERM", () => {
    stopped = true;
  });
  process.on("SIGINT", () => {
    stopped = true;
  });
  let nextReminders = 0;
  while (!stopped) {
    try {
      if (Date.now() >= nextReminders) {
        await queueReminders(db, process.env.APP_ORIGIN, { mailEnabled: !!transport });
        nextReminders = Date.now() + 60000;
      }
      if (transport) { await deliverRecovery(
        db,
        transport,
        process.env.APP_ORIGIN,
        process.env.MAIL_FROM,
      );
      await deliverNotification(db, transport, process.env.MAIL_FROM); }
    } catch {
      console.error("Recovery mail worker could not process queue.");
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  transport?.close();
  await db.end();
}
