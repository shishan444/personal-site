import { readdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll } from "vitest";

const TEST_ROOT = path.resolve(process.cwd(), ".pglite");
const CURRENT_DIR = path.join(TEST_ROOT, "atelier-test");

beforeAll(async () => {
  const { getPgliteDb } = await import("@/lib/db/pglite");

  rmSync(CURRENT_DIR, { recursive: true, force: true });

  const db = await getPgliteDb(CURRENT_DIR);

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
  const { closePgliteDb } = await import("@/lib/db/pglite");
  await closePgliteDb();
  await new Promise((resolve) => setTimeout(resolve, 200));
  try {
    rmSync(CURRENT_DIR, { recursive: true, force: true });
  } catch {
    // 测试结束后 .pglite 会被 git 忽略，残留不阻塞
  }
});
