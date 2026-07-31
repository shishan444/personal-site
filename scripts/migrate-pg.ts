import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url || url.startsWith("pglite://")) {
    throw new Error("[migrate-pg] 需要设置 DATABASE_URL 指向 PostgreSQL 实例");
  }

  const client = postgres(url, { max: 1 });
  try {
    await migrate(drizzle(client), { migrationsFolder: "./drizzle/migrations" });
    console.log("[migrate-pg] 迁移完成");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
