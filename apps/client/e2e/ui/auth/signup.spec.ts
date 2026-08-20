import { test, expect } from "@playwright/test";
import { resetAuthTables } from "../../utils/db-reset";

test.beforeEach(async () => {
  await resetAuthTables();
});

test.describe("Sign up", () => {
  test("creates an account and asks the user to verify their email", async ({
    page,
  }) => {
    await page.goto("/signup");

    await page.getByTestId("signup-name-input").fill("Jane Doe");
    await page.getByTestId("signup-email-input").fill("jane.doe@example.com");
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

  test("rejects a name with digits or symbols", async ({ page }) => {
    await page.goto("/signup");

    await page.getByTestId("signup-name-input").fill("Jane123");
    await page.getByTestId("signup-email-input").fill("jane.doe@example.com");
    await page.getByTestId("signup-password-input").fill("password123");
    await page
      .getByTestId("signup-confirm-password-input")
      .fill("password123");
    await page.getByTestId("signup-submit-button").click();

    await expect(
      page.getByText("Name can only contain letters"),
    ).toBeVisible();
  });

  test("rejects a name longer than 20 characters", async ({ page }) => {
    await page.goto("/signup");

    await page.getByTestId("signup-name-input").fill("A".repeat(21));
    await page.getByTestId("signup-email-input").fill("jane.doe@example.com");
    await page.getByTestId("signup-password-input").fill("password123");
    await page
      .getByTestId("signup-confirm-password-input")
      .fill("password123");
    await page.getByTestId("signup-submit-button").click();

    await expect(
      page.getByText("Name must be at most 20 characters"),
    ).toBeVisible();
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

  test("rejects an email longer than 50 characters", async ({ page }) => {
    await page.goto("/signup");

    const longEmail = `${"a".repeat(45)}@a.com`;
    await page.getByTestId("signup-name-input").fill("Jane Doe");
    await page.getByTestId("signup-email-input").fill(longEmail);
    await page.getByTestId("signup-password-input").fill("password123");
    await page
      .getByTestId("signup-confirm-password-input")
      .fill("password123");
    await page.getByTestId("signup-submit-button").click();

    await expect(
      page.getByText("Email must be at most 50 characters"),
    ).toBeVisible();
  });

  test("rejects a password shorter than 8 characters", async ({ page }) => {
    await page.goto("/signup");

    await page.getByTestId("signup-name-input").fill("Jane Doe");
    await page.getByTestId("signup-email-input").fill("jane.doe@example.com");
    await page.getByTestId("signup-password-input").fill("short1");
    await page.getByTestId("signup-confirm-password-input").fill("short1");
    await page.getByTestId("signup-submit-button").click();

    await expect(
      page.getByText("Password must be at least 8 characters"),
    ).toBeVisible();
  });

  test("rejects a password longer than 20 characters", async ({ page }) => {
    await page.goto("/signup");

    const longPassword = "a".repeat(21);
    await page.getByTestId("signup-name-input").fill("Jane Doe");
    await page.getByTestId("signup-email-input").fill("jane.doe@example.com");
    await page.getByTestId("signup-password-input").fill(longPassword);
    await page
      .getByTestId("signup-confirm-password-input")
      .fill(longPassword);
    await page.getByTestId("signup-submit-button").click();

    await expect(
      page.getByText("Password must be at most 20 characters"),
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
});
