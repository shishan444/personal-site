import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? "postgresql://dev:dev@localhost:5432/atelier";

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: { url },
  verbose: true,
  strict: true,
  schemaFilter: ["public"],
});
