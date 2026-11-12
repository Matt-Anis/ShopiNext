import { test, expect } from "@playwright/test";
import { and, desc, eq, like } from "drizzle-orm";
import { verification } from "@repo/db/public/auth-schema";
import { testDb } from "../../utils/db";
import { getSeededUserId, seedUser } from "../../utils/seed-user";
import { clickUntilHydrated } from "../../utils/interaction";
import { signIn } from "../../utils/auth";
import {
  createCustomerSession,
  readCustomerSession,
  snapshotCustomerSession,
} from "../../utils/customer-session";
import { uniqueNameSuffix, uniqueSuffix } from "../../utils/unique";

async function getResetPasswordToken(userId: string) {
  let token = "";
  await expect
    .poll(async () => {
      const [row] = await testDb
        .select({ identifier: verification.identifier })
        .from(verification)
        .where(
          and(
            like(verification.identifier, "reset-password:%"),
            eq(verification.value, userId),
          ),
        )
        .orderBy(desc(verification.createdAt))
        .limit(1);
      token = row?.identifier.replace("reset-password:", "") ?? "";
      return token;
    })
    .not.toBe("");
  return token;
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
    await clickUntilHydrated(
      page.getByTestId("reset-password-submit-button"),
      () => expect(page.getByText("Passwords do not match")).toBeVisible(),
    );
  });

  test("rejects a password shorter than 8 characters", async ({ page }) => {
    await page.goto("/reset-password?token=not-a-real-token");

    await page.getByTestId("reset-password-password-input").fill("short1");
    await page
      .getByTestId("reset-password-confirm-password-input")
      .fill("short1");
    await clickUntilHydrated(
      page.getByTestId("reset-password-submit-button"),
      () =>
        expect(
          page.getByText("Password must be at least 8 characters"),
        ).toBeVisible(),
    );
  });

  test("rejects a password longer than 20 characters", async ({ page }) => {
    await page.goto("/reset-password?token=not-a-real-token");

    const longPassword = "a".repeat(21);
    await page.getByTestId("reset-password-password-input").fill(longPassword);
    await page
      .getByTestId("reset-password-confirm-password-input")
      .fill(longPassword);
    await clickUntilHydrated(
      page.getByTestId("reset-password-submit-button"),
      () =>
        expect(
          page.getByText("Password must be at most 20 characters"),
        ).toBeVisible(),
    );
  });

  test("rejects an invalid token", async ({ page }) => {
    await page.goto("/reset-password?token=not-a-real-token");

    await page.getByTestId("reset-password-password-input").fill("newpass123");
    await page
      .getByTestId("reset-password-confirm-password-input")
      .fill("newpass123");
    await clickUntilHydrated(
      page.getByTestId("reset-password-submit-button"),
      () =>
        expect(page.getByText("Reset failed")).toBeVisible({ timeout: 1000 }),
    );
  });

  test("revokes all original sessions after a reset and only accepts the new password", async ({
    page,
    request,
    baseURL,
  }) => {
    test.slow();

    const credentials = await seedUser(request, {
      name: `RP ${uniqueNameSuffix()}`,
      email: "reset-sessions@example.com",
    });
    const userId = await getSeededUserId(credentials.email);
    const newPassword = `N${uniqueSuffix()}`;
    await signIn(page, credentials);
    const current = await readCustomerSession(page.request);
    expect(current?.user.id).toBe(userId);

    const originalSession = await snapshotCustomerSession(page, baseURL!);
    const otherSession = await createCustomerSession(baseURL!, credentials);
    try {
      const other = await readCustomerSession(otherSession);
      expect(other?.user.id).toBe(userId);
      expect(other?.session.id).not.toBe(current?.session.id);

      await page.goto("/forgot-password");
      await page
        .getByTestId("forgot-password-email-input")
        .fill(credentials.email);
      await clickUntilHydrated(
        page.getByTestId("forgot-password-submit-button"),
        () =>
          expect(
            page.getByText("Reset link sent", { exact: true }),
          ).toBeVisible(),
      );

      const token = await getResetPasswordToken(userId);
      await page.goto(`/reset-password?token=${token}`);
      await page.getByTestId("reset-password-password-input").fill(newPassword);
      await page
        .getByTestId("reset-password-confirm-password-input")
        .fill(newPassword);
      await clickUntilHydrated(
        page.getByTestId("reset-password-submit-button"),
        () => expect(page).toHaveURL("/login"),
      );
      await expect(page.getByTestId("login-form")).toBeVisible();

      await expect.poll(() => readCustomerSession(originalSession)).toBeNull();
      await expect.poll(() => readCustomerSession(otherSession)).toBeNull();

      const oldPasswordResponse = await request.post(
        "/api/auth/sign-in/email",
        {
          headers: { origin: baseURL! },
          data: { email: credentials.email, password: credentials.password },
        },
      );
      expect(oldPasswordResponse.status()).toBe(401);
      expect(await oldPasswordResponse.json()).toMatchObject({
        code: "INVALID_EMAIL_OR_PASSWORD",
      });

      await page.getByTestId("login-email-input").fill(credentials.email);
      await page.getByTestId("login-password-input").fill(newPassword);
      await clickUntilHydrated(page.getByTestId("login-submit-button"), () =>
        expect(page).toHaveURL("/"),
      );
      await expect
        .poll(() => readCustomerSession(page.request))
        .toMatchObject({
          user: { id: userId, email: credentials.email },
        });
    } finally {
      await originalSession.dispose();
      await otherSession.dispose();
    }
  });

  test("rejects reusing a token that's already been consumed", async ({
    page,
    request,
  }) => {
    test.slow();

    const credentials = await seedUser(request, {
      name: `RT ${uniqueNameSuffix()}`,
    });
    const userId = await getSeededUserId(credentials.email);

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
    await clickUntilHydrated(
      page.getByTestId("reset-password-submit-button"),
      () =>
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
    await clickUntilHydrated(
      page.getByTestId("reset-password-submit-button"),
      () =>
        expect(page.getByText("Reset failed")).toBeVisible({ timeout: 1000 }),
    );
  });
});
