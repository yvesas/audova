import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import * as schemaRelations from "./relations";

/**
 * Shared Postgres client. Lazily created so importing the package (e.g. for types) never opens
 * a connection. Pass a connection string or rely on DATABASE_URL.
 */
let pool: Pool | null = null;

export function getDb(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!pool) {
    pool = new Pool({ connectionString });
  }
  return drizzle(pool, { schema: { ...schema, ...schemaRelations } });
}

export type Database = ReturnType<typeof getDb>;

/** Close the shared pool (tests / graceful shutdown). */
export async function endDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
