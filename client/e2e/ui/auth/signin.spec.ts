import { test, expect } from "@playwright/test";
import { resetAuthTables } from "../../utils/db-reset";
import { seedUser, DEFAULT_TEST_USER } from "../../utils/seed-user";

test.beforeEach(async ({ request }) => {
  await resetAuthTables();
  await seedUser(request);
});

test.describe("Sign in", () => {
  test("logs in with correct credentials and redirects home", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByTestId("login-email-input").fill(DEFAULT_TEST_USER.email);
    await page
      .getByTestId("login-password-input")
      .fill(DEFAULT_TEST_USER.password);
    await page.getByTestId("login-submit-button").click();

    await expect(page.getByText("Signed in successfully")).toBeVisible();
    await page.waitForURL("/");
  });

  test("rejects an incorrect password", async ({ page }) => {
    await page.goto("/login");

    await page.getByTestId("login-email-input").fill(DEFAULT_TEST_USER.email);
    await page.getByTestId("login-password-input").fill("wrong-password");
    await page.getByTestId("login-submit-button").click();

    await expect(page.getByText("Login failed")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("rejects a non-existent email", async ({ page }) => {
    await page.goto("/login");

    await page.getByTestId("login-email-input").fill("nobody@example.com");
    await page.getByTestId("login-password-input").fill("password123");
    await page.getByTestId("login-submit-button").click();

    await expect(page.getByText("Login failed")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
