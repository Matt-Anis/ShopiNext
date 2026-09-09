import { config } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

config({ path: ".env.local" });

// The session cookie cache's configured max age (see apps/admin/lib/auth.ts)
// while testing - cookie-cache.spec.ts checks the cookie's expiry against it.
export const TEST_COOKIE_CACHE_MAX_AGE_SECONDS = 4;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 3 : 2,
  reporter: "html",
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium-serial",
      testMatch: /empty-state\.spec\.ts/,
      fullyParallel: false,
      workers: 1,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      testIgnore: /empty-state\.spec\.ts/,
      dependencies: ["chromium-serial"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL_TEST!,
      SESSION_COOKIE_CACHE_MAX_AGE: String(TEST_COOKIE_CACHE_MAX_AGE_SECONDS),
    },
  },
});
