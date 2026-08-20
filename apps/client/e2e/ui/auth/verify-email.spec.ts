import { test, expect } from "@playwright/test";
import { resetAuthTables } from "../../utils/db-reset";
import { seedUser, DEFAULT_TEST_USER } from "../../utils/seed-user";
import { clickUntilHydrated } from "../../utils/interaction";

test.beforeEach(async () => {
  await resetAuthTables();
});

test.describe("Email verification", () => {
  test("rejects sign in for an unverified account", async ({
    page,
    request,
  }) => {
    await seedUser(request, {}, { verified: false });

    await page.goto("/login");
    await page.getByTestId("login-email-input").fill(DEFAULT_TEST_USER.email);
    await page
      .getByTestId("login-password-input")
      .fill(DEFAULT_TEST_USER.password);
    await clickUntilHydrated(page.getByTestId("login-submit-button"), () =>
      expect(page.getByText("Email not verified")).toBeVisible({
        timeout: 1000,
      }),
    );
    await expect(page).toHaveURL(/\/login/);
  });

  test("rejects an invalid verification token", async ({ request }) => {
    const response = await request.get(
      "/api/auth/verify-email?token=not-a-real-token",
    );

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.message).toBe("Invalid token");
  });
});
