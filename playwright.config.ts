import { defineConfig, devices } from "@playwright/test";

export const E2E_BASE_URL = "http://localhost:3100";
export const E2E_DATA_DIR = ".pglite/atelier-e2e";
export const E2E_OWNER = {
  email: "owner@atelier.com",
  seedPassword: "ChangeMe-On-First-Login",
  password: "E2e-Test-Password-2026",
};

export default defineConfig({
  testDir: "./tests/e2e-pw",
  outputDir: "./test-results",
  globalSetup: "./tests/e2e-pw/global-setup.ts",
  globalTeardown: "./tests/e2e-pw/global-teardown.ts",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: E2E_BASE_URL,
    trace: "retain-on-failure",
    video: { mode: "on", size: { width: 1280, height: 720 } },
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth-setup\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      dependencies: ["setup"],
      testMatch: /^(?!auth-setup).*\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
