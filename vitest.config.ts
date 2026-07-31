import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/lib/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/_*.{ts,tsx}",
        "src/app/**",
        "src/**/*.{test,spec}.{ts,tsx}",
      ],
      thresholds: {
        lines: 85,
        functions: 90,
        branches: 80,
        statements: 85,
        perFile: false,
      },
    },
  },
});
