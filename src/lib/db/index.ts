import type { PgliteDatabase } from "./pglite";
import * as schema from "./schema";

export type Database = PgliteDatabase;

let _pgDb: Database | null = null;

export async function getDb(): Promise<Database> {
  const url = process.env.DATABASE_URL;
  if (url && !url.startsWith("pglite://")) {
    if (!_pgDb) {
      const { drizzle } = await import("drizzle-orm/postgres-js");
      const { default: postgres } = await import("postgres");
      const client = postgres(url, { max: 10, prepare: false });
      _pgDb = drizzle(client, { schema }) as unknown as Database;
    }
    return _pgDb;
  }
  const { getPgliteDb } = await import("./pglite");
  return getPgliteDb();
}

export * from "./schema";
export { schema };
