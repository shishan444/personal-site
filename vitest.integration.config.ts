import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/integration/_setup.ts"],
    include: ["tests/integration/**/*.test.{ts,tsx}"],
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/lib/db/**/*.{ts,tsx}"],
      exclude: ["src/lib/db/pglite.ts", "src/lib/db/client.ts"],
    },
  },
});
