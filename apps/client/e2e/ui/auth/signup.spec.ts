import { test, expect } from "@playwright/test";
import { seedUser } from "../../utils/seed-user";
import { signIn } from "../../utils/auth";
import { uniqueSuffix } from "../../utils/unique";

test.describe("Sign up", () => {
  test("creates an account and asks the user to verify their email", async ({
    page,
  }) => {
    await page.goto("/signup");

    await page.getByTestId("signup-name-input").fill("Jane Doe");
    await page
      .getByTestId("signup-email-input")
      .fill(`jane.doe+${uniqueSuffix()}@example.com`);
    await page.getByTestId("signup-password-input").fill("password123");
    await page
      .getByTestId("signup-confirm-password-input")
      .fill("password123");
    await page.getByTestId("signup-submit-button").click();

    await expect(page.getByText("Please verify your email")).toBeVisible();
    await page.waitForURL("/");
  });

  test("rejects an empty name", async ({ page }) => {
    await page.goto("/signup");

    await page.getByTestId("signup-email-input").fill("jane.doe@example.com");
    await page.getByTestId("signup-password-input").fill("password123");
    await page
      .getByTestId("signup-confirm-password-input")
      .fill("password123");
    await page.getByTestId("signup-submit-button").click();

    await expect(page.getByText("Name is required")).toBeVisible();
    await expect(page).toHaveURL(/\/signup/);
  });

  test("rejects a malformed email", async ({ page }) => {
    await page.goto("/signup");

    await page.getByTestId("signup-name-input").fill("Jane Doe");
    await page.getByTestId("signup-email-input").fill("not-an-email");
    await page.getByTestId("signup-password-input").fill("password123");
    await page
      .getByTestId("signup-confirm-password-input")
      .fill("password123");
    await page.getByTestId("signup-submit-button").click();

    await expect(
      page.getByText("Enter a valid email address"),
    ).toBeVisible();
  });

  test("rejects mismatched passwords", async ({ page }) => {
    await page.goto("/signup");

    await page.getByTestId("signup-name-input").fill("Jane Doe");
    await page.getByTestId("signup-email-input").fill("jane.doe@example.com");
    await page.getByTestId("signup-password-input").fill("password123");
    await page
      .getByTestId("signup-confirm-password-input")
      .fill("password124");
    await page.getByTestId("signup-submit-button").click();

    await expect(page.getByText("Passwords do not match")).toBeVisible();
  });

  test("redirects an already signed-in user away from /signup", async ({
    page,
    request,
  }) => {
    const credentials = await seedUser(request);
    await signIn(page, credentials);

    await page.goto("/signup");

    await page.waitForURL("/");
  });
});
