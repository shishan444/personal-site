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
        // 2026-08-15 校准（用户裁决 #15A）：门槛=当前真实水位，exit 0 让质量门可信；
        // 提升目标走 backlog（admin 组件 0%/auth 8% 优先），不再虚挂 85 长期红。
        lines: 33,
        functions: 26,
        branches: 33,
        statements: 32,
        perFile: false,
      },
    },
  },
});
