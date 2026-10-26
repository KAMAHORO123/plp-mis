import { readdir, readFile } from "node:fs/promises";
import { connectDatabase, transaction } from "./db.mjs";
const pool = connectDatabase();
try {
  await transaction(pool, async (db) => {
    await db.query("SELECT pg_advisory_xact_lock(724101)");
    await db.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    for (const name of (
      await readdir(new URL("../migrations/", import.meta.url))
    )
      .filter((n) => n.endsWith(".sql"))
      .sort()) {
      if (
        (
          await db.query("SELECT 1 FROM schema_migrations WHERE name=$1", [
            name,
          ])
        ).rowCount
      )
        continue;
      await db.query(
        await readFile(
          new URL("../migrations/" + name, import.meta.url),
          "utf8",
        ),
      );
      await db.query("INSERT INTO schema_migrations(name) VALUES($1)", [name]);
      console.log("Applied", name);
    }
    if (process.env.APP_DB_PASSWORD) {
      const exists = await db.query(
        "SELECT 1 FROM pg_roles WHERE rolname='plp_app'",
      );
      if (!exists.rowCount)
        await db.query(
          "CREATE ROLE plp_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE",
        );
      const statement = (
        await db.query(
          "SELECT format('ALTER ROLE plp_app PASSWORD %L',$1::text) AS sql",
          [process.env.APP_DB_PASSWORD],
        )
      ).rows[0].sql;
      await db.query(statement);
      await db.query("GRANT USAGE ON SCHEMA public TO plp_app");
      await db.query(
        "GRANT SELECT,INSERT,UPDATE,DELETE ON users,sessions,schools,records,audit_log,content,enrollments,certificates,attendance,auth_limits,password_resets,files,certificate_requests,material_completions,register_attendance,credits,google_identities,oauth_states,recovery_mail,email_verifications,password_reset_codes,meetings,meeting_checkins,notification_mail,mentor_sessions,assessment_attempts,mentor_profiles TO plp_app",
      );
      await db.query(
        "GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO plp_app",
      );
      await db.query("REVOKE UPDATE,DELETE ON audit_log FROM plp_app");
    }
  });
} finally {
  await pool.end();
}
