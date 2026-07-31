import { readdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll } from "vitest";
import { closePgliteDb, getPgliteDb } from "@/lib/db/pglite";

const TEST_DIR = path.resolve(process.cwd(), ".pglite/atelier-test");

beforeAll(async () => {
  rmSync(TEST_DIR, { recursive: true, force: true });
  process.env.PGLITE_DATA_DIR = TEST_DIR;

  const db = await getPgliteDb(TEST_DIR);

  const client = db.$client as unknown as {
    exec: (sql: string) => Promise<unknown>;
    query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
  };

  await client.exec(`
    CREATE TABLE IF NOT EXISTS __migrations_applied (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const migrationsDir = path.resolve(process.cwd(), "drizzle/migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const sql = readFileSync(path.join(migrationsDir, file), "utf8");
    await client.exec(sql);
    await client.query(`INSERT INTO __migrations_applied (filename) VALUES ($1);`, [file]);
  }
});

afterAll(async () => {
  await closePgliteDb();
  rmSync(TEST_DIR, { recursive: true, force: true });
});
