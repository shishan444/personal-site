import { mkdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema";

export type PgliteDatabase = ReturnType<typeof drizzle<typeof schema>>;

// Next dev 的 HMR 与多模块图（RSC / Server Action）会重复加载本模块，
// 单例必须挂在 globalThis 上，否则同一 dataDir 会被多次 PGlite.create 导致 WASM abort。
const globalStore = globalThis as unknown as {
  __atelierPgliteClient?: PGlite | null;
  __atelierPgliteDb?: PgliteDatabase | null;
};

export async function getPgliteDb(dataDir?: string): Promise<PgliteDatabase> {
  if (globalStore.__atelierPgliteDb) return globalStore.__atelierPgliteDb;
  const dir = dataDir ?? process.env.PGLITE_DATA_DIR ?? ".pglite/atelier-dev";
  const absDir = path.resolve(process.cwd(), dir);
  mkdirSync(absDir, { recursive: true });
  globalStore.__atelierPgliteClient = await PGlite.create({ dataDir: absDir });
  globalStore.__atelierPgliteDb = drizzle(globalStore.__atelierPgliteClient, { schema });
  return globalStore.__atelierPgliteDb;
}

export async function closePgliteDb(): Promise<void> {
  if (globalStore.__atelierPgliteClient) {
    await globalStore.__atelierPgliteClient.close();
    globalStore.__atelierPgliteClient = null;
    globalStore.__atelierPgliteDb = null;
  }
}

export { schema };
