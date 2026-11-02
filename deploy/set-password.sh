#!/usr/bin/env bash
# Sets a new password for one account. Run on the server: ./set-password.sh
# The password is typed privately and never stored in shell history or logs.
set -euo pipefail
cd "$(dirname "$0")"
read -rp "Account email: " EMAIL
read -rsp "New password (at least 12 characters): " PW; echo
read -rsp "Repeat the password: " PW2; echo
[ "$PW" = "$PW2" ] || { echo "The passwords do not match. Nothing changed."; exit 1; }
docker compose --env-file "${ENV_FILE:-.env}" -f compose.yml exec -T -e EMAIL="$EMAIL" -e PW="$PW" platform node --input-type=module -e '
import { hashPassword } from "./src/auth.mjs"; import { connectDatabase } from "./src/db.mjs";
const email = (process.env.EMAIL || "").trim().toLowerCase(), pw = process.env.PW || "";
if (pw.length < 12) { console.log("Password must be at least 12 characters. Nothing changed."); process.exit(1); }
const db = connectDatabase();
// Also confirms the email and clears sign-in lockouts and old sessions for this account.
const r = await db.query("UPDATE users SET password_hash=$2, email_verified_at=coalesce(email_verified_at,now()) WHERE email=$1 RETURNING id, role, status", [email, await hashPassword(pw)]);
if (!r.rowCount) console.log("No account with that email. Nothing changed.");
else { await db.query("DELETE FROM sessions WHERE user_id=$1", [r.rows[0].id]); console.log(`Password updated (${r.rows[0].role}, ${r.rows[0].status}). Sign in with the new password.`); }
await db.end();'
