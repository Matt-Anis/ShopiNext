import { test, expect } from "@playwright/test";
import { resetAuthTables, resetCartTables } from "../../utils/db-reset";
import { seedUser, DEFAULT_TEST_USER } from "../../utils/seed-user";
import { seedProduct, seedProductWithVariants } from "../../utils/seed-product";
import { visible } from "../../utils/interaction";

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

  test("adding two different variants of the same product creates two distinct lines", async ({
    page,
  }) => {
    const product = await seedProductWithVariants({
      slug: "multi-variant-product",
      options: [{ name: "Size", values: ["S", "M"] }],
      variants: [
        { values: { Size: "S" }, price: 1000, stock: 5 },
        { values: { Size: "M" }, price: 1200, stock: 5 },
      ],
    });

    await page.goto(`/products/${product.slug}`);
    await visible(page, "variant-pill-Size-S").click();
    await visible(page, "cart-control-add").click();
    await expect(visible(page, "cart-control-quantity")).toHaveText(
      "1 in cart",
    );

    await visible(page, "variant-pill-Size-M").click();
    await visible(page, "cart-control-add").click();
    await expect(visible(page, "cart-control-quantity")).toHaveText(
      "1 in cart",
    );

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByTestId("cart-trigger").click();
    const drawer = page.getByTestId("cart-drawer-content");

    const sRow = drawer
      .locator('[data-slot="card"]')
      .filter({ has: page.getByText("S", { exact: true }) });
    const mRow = drawer
      .locator('[data-slot="card"]')
      .filter({ has: page.getByText("M", { exact: true }) });

    await expect(sRow.getByTestId("cart-item-price")).toHaveText("$10.00");
    await expect(mRow.getByTestId("cart-item-price")).toHaveText("$12.00");
  });

  test("removing one variant's line doesn't affect the other", async ({
    page,
  }) => {
    const product = await seedProductWithVariants({
      slug: "multi-variant-removal-product",
      options: [{ name: "Size", values: ["S", "M"] }],
      variants: [
        { values: { Size: "S" }, price: 1000, stock: 5 },
        { values: { Size: "M" }, price: 1200, stock: 5 },
      ],
    });

    await page.goto(`/products/${product.slug}`);
    await visible(page, "variant-pill-Size-S").click();
    await visible(page, "cart-control-add").click();
    await expect(visible(page, "cart-control-quantity")).toHaveText(
      "1 in cart",
    );

    await visible(page, "variant-pill-Size-M").click();
    await visible(page, "cart-control-add").click();
    await visible(page, "cart-control-increment").click();
    await expect(visible(page, "cart-control-quantity")).toHaveText(
      "2 in cart",
    );

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByTestId("cart-trigger").click();
    const drawer = page.getByTestId("cart-drawer-content");

    const sRow = drawer
      .locator('[data-slot="card"]')
      .filter({ has: page.getByText("S", { exact: true }) });
    const mRow = drawer
      .locator('[data-slot="card"]')
      .filter({ has: page.getByText("M", { exact: true }) });

    await sRow.getByTestId("cart-control-decrement").click();
    await page.getByTestId("cart-remove-confirm-button").click();

    await expect(sRow).toHaveCount(0);
    await expect(mRow.getByTestId("cart-control-quantity")).toHaveText(
      "2 in cart",
    );
  });
});
