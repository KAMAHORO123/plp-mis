import "./environment.mjs";
import pg from "pg";
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
