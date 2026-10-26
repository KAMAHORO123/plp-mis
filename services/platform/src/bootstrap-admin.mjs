import { randomUUID } from "node:crypto";
import { connectDatabase } from "./db.mjs";
import { hashPassword } from "./auth.mjs";
const { ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD } = process.env;
if (
  !ADMIN_EMAIL ||
  !ADMIN_NAME ||
  !ADMIN_PASSWORD ||
  ADMIN_PASSWORD.length < 12
)
  throw Error(
    "Provide ADMIN_EMAIL, ADMIN_NAME, and ADMIN_PASSWORD (12+ characters) in the process environment",
  );
const db = connectDatabase();
try {
  await db.query(
    "INSERT INTO users(id,email,name,password_hash,role,status,email_verified_at) VALUES($1,$2,$3,$4,'admin','approved',now()) ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash, name=EXCLUDED.name, role='admin', status='approved', email_verified_at=now()",
    [
      randomUUID(),
      ADMIN_EMAIL.trim().toLowerCase(),
      ADMIN_NAME,
      await hashPassword(ADMIN_PASSWORD),
    ],
  );
  console.log("Administrator created/updated successfully:", ADMIN_EMAIL.trim().toLowerCase());
} finally {
  await db.end();
}
