import { test, expect } from "@playwright/test";
import { resetAuthTables } from "../../utils/db-reset";
import { seedUser, DEFAULT_TEST_USER } from "../../utils/seed-user";
import { clickUntilHydrated } from "../../utils/interaction";

test.beforeEach(async () => {
  await resetAuthTables();
});

test.describe("Forgot password", () => {
  test("shows a generic success message for an existing user", async ({
    page,
    request,
  }) => {
    await seedUser(request);

    await page.goto("/forgot-password");
    await page
      .getByTestId("forgot-password-email-input")
      .fill(DEFAULT_TEST_USER.email);
    await clickUntilHydrated(
      page.getByTestId("forgot-password-submit-button"),
      () =>
        expect(page.getByText("Reset link sent")).toBeVisible({
          timeout: 1000,
        }),
    );
  });

  test("shows the same generic success message for a non-existent email", async ({
    page,
  }) => {
    await page.goto("/forgot-password");
    await page
      .getByTestId("forgot-password-email-input")
      .fill("nobody@example.com");
    await clickUntilHydrated(
      page.getByTestId("forgot-password-submit-button"),
      () =>
        expect(page.getByText("Reset link sent")).toBeVisible({
          timeout: 1000,
        }),
    );
  });

  test("rejects a malformed email", async ({ page }) => {
    await page.goto("/forgot-password");
    await page
      .getByTestId("forgot-password-email-input")
      .fill("not-an-email");
    await page.getByTestId("forgot-password-submit-button").click();

    await expect(page.getByText("Enter a valid email address")).toBeVisible();
  });

  test("rejects an email longer than 50 characters", async ({ page }) => {
    await page.goto("/forgot-password");

    const longEmail = `${"a".repeat(45)}@a.com`;
    await page.getByTestId("forgot-password-email-input").fill(longEmail);
    await page.getByTestId("forgot-password-submit-button").click();

    await expect(
      page.getByText("Email must be at most 50 characters"),
    ).toBeVisible();
  });
});
