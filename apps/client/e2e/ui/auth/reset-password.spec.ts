import { test, expect } from "@playwright/test";
import { and, desc, eq, like } from "drizzle-orm";
import { user, verification } from "@repo/db/public/auth-schema";
import { testDb } from "../../utils/db";
import { seedUser } from "../../utils/seed-user";
import { clickUntilHydrated } from "../../utils/interaction";

async function getResetPasswordToken(userId: string) {
  const [row] = await testDb
    .select()
    .from(verification)
    .where(
      and(
        like(verification.identifier, "reset-password:%"),
        eq(verification.value, userId),
      ),
    )
    .orderBy(desc(verification.createdAt));

  if (!row) {
    throw new Error("No password reset verification row found");
  }

  return row.identifier.replace("reset-password:", "");
}

async function getUserId(email: string) {
  const [row] = await testDb.select().from(user).where(eq(user.email, email));

  if (!row) {
    throw new Error(`No user found for email ${email}`);
  }

  return row.id;
}

test.describe("Reset password", () => {
  test("404s when no token is given", async ({ page }) => {
    const response = await page.goto("/reset-password");
    expect(response?.status()).toBe(404);
  });

  test("rejects mismatched passwords", async ({ page }) => {
    await page.goto("/reset-password?token=not-a-real-token");

    await page.getByTestId("reset-password-password-input").fill("newpass123");
    await page
      .getByTestId("reset-password-confirm-password-input")
      .fill("newpass124");
    await page.getByTestId("reset-password-submit-button").click();

    await expect(page.getByText("Passwords do not match")).toBeVisible();
  });

  test("rejects a password shorter than 8 characters", async ({ page }) => {
    await page.goto("/reset-password?token=not-a-real-token");

    await page.getByTestId("reset-password-password-input").fill("short1");
    await page
      .getByTestId("reset-password-confirm-password-input")
      .fill("short1");
    await page.getByTestId("reset-password-submit-button").click();

    await expect(
      page.getByText("Password must be at least 8 characters"),
    ).toBeVisible();
  });

  test("rejects a password longer than 20 characters", async ({ page }) => {
    await page.goto("/reset-password?token=not-a-real-token");

    const longPassword = "a".repeat(21);
    await page
      .getByTestId("reset-password-password-input")
      .fill(longPassword);
    await page
      .getByTestId("reset-password-confirm-password-input")
      .fill(longPassword);
    await page.getByTestId("reset-password-submit-button").click();

    await expect(
      page.getByText("Password must be at most 20 characters"),
    ).toBeVisible();
  });

  test("rejects an invalid token", async ({ page }) => {
    await page.goto("/reset-password?token=not-a-real-token");

    await page.getByTestId("reset-password-password-input").fill("newpass123");
    await page
      .getByTestId("reset-password-confirm-password-input")
      .fill("newpass123");
    await clickUntilHydrated(page.getByTestId("reset-password-submit-button"), () =>
      expect(page.getByText("Reset failed")).toBeVisible({ timeout: 1000 }),
    );
  });

  test("lets a user reset their password with a valid token and sign in with it", async ({
    page,
    request,
  }) => {
    const credentials = await seedUser(request);
    const userId = await getUserId(credentials.email);

    await page.goto("/forgot-password");
    await page
      .getByTestId("forgot-password-email-input")
      .fill(credentials.email);
    await clickUntilHydrated(
      page.getByTestId("forgot-password-submit-button"),
      () =>
        expect(page.getByText("Reset link sent")).toBeVisible({
          timeout: 1000,
        }),
    );

    const token = await getResetPasswordToken(userId);
    await page.goto(`/reset-password?token=${token}`);
    await page.getByTestId("reset-password-password-input").fill("newpass123");
    await page
      .getByTestId("reset-password-confirm-password-input")
      .fill("newpass123");
    await clickUntilHydrated(page.getByTestId("reset-password-submit-button"), () =>
      expect(page.getByText("Password reset successfully")).toBeVisible({
        timeout: 1000,
      }),
    );
    await page.waitForURL("/login");

    await page.getByTestId("login-email-input").fill(credentials.email);
    await page.getByTestId("login-password-input").fill("newpass123");
    await page.getByTestId("login-submit-button").click();

    await expect(page.getByText("Signed in successfully")).toBeVisible();
    await page.waitForURL("/");
  });

  test("rejects reusing a token that's already been consumed", async ({
    page,
    request,
  }) => {
    const credentials = await seedUser(request);
    const userId = await getUserId(credentials.email);

    await page.goto("/forgot-password");
    await page
      .getByTestId("forgot-password-email-input")
      .fill(credentials.email);
    await clickUntilHydrated(
      page.getByTestId("forgot-password-submit-button"),
      () =>
        expect(page.getByText("Reset link sent")).toBeVisible({
          timeout: 1000,
        }),
    );

    const token = await getResetPasswordToken(userId);
    await page.goto(`/reset-password?token=${token}`);
    await page.getByTestId("reset-password-password-input").fill("newpass123");
    await page
      .getByTestId("reset-password-confirm-password-input")
      .fill("newpass123");
    await clickUntilHydrated(page.getByTestId("reset-password-submit-button"), () =>
      expect(page.getByText("Password reset successfully")).toBeVisible({
        timeout: 1000,
      }),
    );
    await page.waitForURL("/login");

    await page.goto(`/reset-password?token=${token}`);
    await page
      .getByTestId("reset-password-password-input")
      .fill("anotherpass123");
    await page
      .getByTestId("reset-password-confirm-password-input")
      .fill("anotherpass123");
    await clickUntilHydrated(page.getByTestId("reset-password-submit-button"), () =>
      expect(page.getByText("Reset failed")).toBeVisible({ timeout: 1000 }),
    );
  });
});
