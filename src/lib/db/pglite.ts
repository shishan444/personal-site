import { mkdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema";

export type PgliteDatabase = ReturnType<typeof drizzle<typeof schema>>;

let _client: PGlite | null = null;
let _db: PgliteDatabase | null = null;

export async function getPgliteDb(dataDir?: string): Promise<PgliteDatabase> {
  if (_db) return _db;
  const dir = dataDir ?? process.env.PGLITE_DATA_DIR ?? ".pglite/atelier-dev";
  const absDir = path.resolve(process.cwd(), dir);
  mkdirSync(absDir, { recursive: true });
  _client = await PGlite.create({ dataDir: absDir });
  _db = drizzle(_client, { schema });
  return _db;
}

export async function closePgliteDb(): Promise<void> {
  if (_client) {
    await _client.close();
    _client = null;
    _db = null;
  }
}

export { schema };
