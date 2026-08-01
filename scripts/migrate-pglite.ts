import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { getPgliteDb } from "../src/lib/db/pglite";

async function runMigrationFiles(client: {
  exec: (sql: string) => Promise<unknown>;
  query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
}) {
  const migrationsDir = path.resolve(process.cwd(), "drizzle/migrations");
  let entries: string[] = [];
  try {
    entries = readdirSync(migrationsDir).sort();
  } catch {
    console.warn(`[migrate] no migrations dir at ${migrationsDir}`);
    return;
  }

  const sqlFiles = entries.filter((e) => e.endsWith(".sql"));
  if (sqlFiles.length === 0) {
    console.warn("[migrate] no .sql files in migrations dir");
    return;
  }

  await client.exec(`
    CREATE TABLE IF NOT EXISTS __migrations_applied (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const applied = (await client.query(`
    SELECT filename FROM __migrations_applied;
  `)) as { rows: { filename: string }[] };

  const appliedSet = new Set(applied.rows.map((r) => r.filename));

  for (const file of sqlFiles) {
    if (appliedSet.has(file)) continue;
    const filePath = path.join(migrationsDir, file);
    const sql = readFileSync(filePath, "utf8");
    console.log(`[migrate] applying ${file} (${sql.length} bytes)`);
    await client.exec(sql);
    await client.query(`INSERT INTO __migrations_applied (filename) VALUES ($1);`, [file]);
    console.log(`[migrate] ✓ ${file}`);
  }
}

async function main() {
  const db = await getPgliteDb();
  const client = db.$client as unknown as {
    exec: (sql: string) => Promise<unknown>;
    query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
  };
  await runMigrationFiles(client);
  console.log("[migrate] ✅ all migrations applied");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[migrate] ❌", err);
    process.exit(1);
  });
