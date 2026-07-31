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
    include: ["tests/e2e/**/*.spec.{ts,tsx}"],
    server: {
      deps: {
        inline: ["next-intl"],
      },
    },
  },
});
