import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __dbClient: ReturnType<typeof createDb> | undefined;
  // eslint-disable-next-line no-var
  var __pglite: unknown;
}

function createDb() {
  const url = process.env.DATABASE_URL;
  const usePglite = !url || url.startsWith("pglite://") || process.env.NODE_ENV === "test";

  if (usePglite) {
    if (process.env.NODE_ENV !== "production") {
      void import("@electric-sql/pglite").then(async ({ PGlite }) => {
        if (!globalThis.__pglite) {
          globalThis.__pglite = await PGlite.create({
            dataDir: process.env.PGLITE_DATA_DIR ?? ".pglite/atelier",
          });
        }
      });
    }
    throw new Error(
      "[db] pglite client must be initialized via createPgliteDb() in dev/test. " +
        "Production should set DATABASE_URL to a real PostgreSQL connection.",
    );
  }

  const client = postgres(url!, { max: 10, prepare: false });
  return drizzlePostgres(client, { schema });
}

export type Database = ReturnType<typeof drizzlePostgres<typeof schema>>;

export const db: Database = globalThis.__dbClient ?? createDb();
if (process.env.NODE_ENV !== "production") {
  globalThis.__dbClient = db;
}

export { schema };
