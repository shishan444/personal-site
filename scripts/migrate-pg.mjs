import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url || url.startsWith("pglite://")) {
  console.log("[migrate-pg] DATABASE_URL 未设置，跳过迁移");
  process.exit(0);
}
if (process.env.DB_AUTO_MIGRATE === "false") {
  console.log("[migrate-pg] DB_AUTO_MIGRATE=false，跳过迁移");
  process.exit(0);
}

const client = postgres(url, { max: 1 });
try {
  await migrate(drizzle(client), { migrationsFolder: "./drizzle/migrations" });
  console.log("[migrate-pg] 迁移完成");
} finally {
  await client.end();
}
