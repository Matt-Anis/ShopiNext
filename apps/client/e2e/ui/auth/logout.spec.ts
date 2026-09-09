import { test, expect } from "@playwright/test";
import { seedUser } from "../../utils/seed-user";
import { signIn } from "../../utils/auth";

test.beforeEach(async ({ page, request }) => {
  const credentials = await seedUser(request);
  await signIn(page, credentials);
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
