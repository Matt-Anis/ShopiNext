import { test, expect } from "@playwright/test";
import { seedUser } from "../../utils/seed-user";
import { clickUntilHydrated } from "../../utils/interaction";

test.describe("Email verification", () => {
  test("rejects sign in for an unverified account", async ({
    page,
    request,
  }) => {
    const credentials = await seedUser(request, {}, { verified: false });

    await page.goto("/login");
    await page.getByTestId("login-email-input").fill(credentials.email);
    await page
      .getByTestId("login-password-input")
      .fill(credentials.password);
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
