import "./environment.mjs";
import pg from "pg";
// Calendar dates (birth dates) stay as "YYYY-MM-DD" text, so they never shift with the server time zone.
pg.types.setTypeParser(1082, (value) => value);
export function connectDatabase() {
  if (!process.env.DATABASE_URL) throw Error("DATABASE_URL is required");
  return new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
}
export async function transaction(pool, fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const value = await fn(client);
    await client.query("COMMIT");
    return value;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
