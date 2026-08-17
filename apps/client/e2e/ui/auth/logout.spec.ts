import { test, expect } from "@playwright/test";
import { resetAuthTables } from "../../utils/db-reset";
import { seedUser, DEFAULT_TEST_USER } from "../../utils/seed-user";

test.beforeEach(async ({ page, request }) => {
  await resetAuthTables();
  await seedUser(request);

  await page.goto("/login");
  await page.getByTestId("login-email-input").fill(DEFAULT_TEST_USER.email);
  await page
    .getByTestId("login-password-input")
    .fill(DEFAULT_TEST_USER.password);
  await page.getByTestId("login-submit-button").click();
  await page.waitForURL("/");
});

test.describe("Log out", () => {
  test("cancelling the confirmation keeps the user signed in", async ({
    page,
  }) => {
    await page.getByTestId("user-menu-trigger").click();
    await page.getByTestId("logout-menu-item").click();
    await expect(page.getByText("Log out?")).toBeVisible();

    await page.getByTestId("logout-cancel-button").click();

    await expect(page.getByText("Log out?")).not.toBeVisible();
    await expect(page.getByTestId("user-menu-trigger")).toBeVisible();
  });

  test("confirming logs the user out", async ({ page }) => {
    await page.getByTestId("user-menu-trigger").click();
    await page.getByTestId("logout-menu-item").click();
    await expect(page.getByText("Log out?")).toBeVisible();

    await page.getByTestId("logout-confirm-button").click();

    await expect(page.getByTestId("signin-nav-button")).toBeVisible();
  });
});
