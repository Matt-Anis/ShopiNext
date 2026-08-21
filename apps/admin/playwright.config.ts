import { config } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

config({ path: ".env.local" });

// Short enough for tests to wait out the staleness window, long enough to
// not be flaky about the reload/assert round-trip finishing in time.
export const TEST_COOKIE_CACHE_MAX_AGE_SECONDS = 4;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
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
      name: "chromium",
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
