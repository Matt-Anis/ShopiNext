import { test, expect } from "@playwright/test";
import { resetAuthTables, resetCartTables } from "../../utils/db-reset";
import { seedUser, DEFAULT_TEST_USER } from "../../utils/seed-user";
import { seedProduct } from "../../utils/seed-product";

test.beforeEach(async ({ page, request }) => {
  await resetAuthTables();
  await resetCartTables();
  await seedUser(request);
  await seedProduct();

  await page.goto("/login");
  await page.getByTestId("login-email-input").fill(DEFAULT_TEST_USER.email);
  await page
    .getByTestId("login-password-input")
    .fill(DEFAULT_TEST_USER.password);
  await page.getByTestId("login-submit-button").click();
  await page.waitForURL("/");
});

test.describe("Authenticated cart", () => {
  test("adding a product updates the badge", async ({ page }) => {
    await page.getByTestId("cart-control-add").click();

    await expect(page.getByTestId("cart-control-quantity")).toHaveText(
      "1 in cart",
    );
    await expect(page.getByTestId("cart-badge")).toHaveText("1");
  });

  test("cart is persisted server-side across a reload", async ({ page }) => {
    await page.getByTestId("cart-control-add").click();
    await expect(page.getByTestId("cart-control-quantity")).toHaveText(
      "1 in cart",
    );

    await page.getByTestId("cart-control-increment").click();
    await expect(page.getByTestId("cart-control-quantity")).toHaveText(
      "2 in cart",
    );

    await page.reload();

    await expect(page.getByTestId("cart-control-quantity")).toHaveText(
      "2 in cart",
    );
    await expect(page.getByTestId("cart-badge")).toHaveText("2");
  });
});
