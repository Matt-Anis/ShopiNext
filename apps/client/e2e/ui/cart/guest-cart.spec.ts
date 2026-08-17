import { test, expect } from "@playwright/test";
import { resetCartTables } from "../../utils/db-reset";
import { seedProduct, DEFAULT_TEST_PRODUCT } from "../../utils/seed-product";

test.beforeEach(async () => {
  await resetCartTables();
  await seedProduct();
});

test.describe("Guest cart", () => {
  test("adding a product shows the stepper and updates the badge", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByTestId("cart-badge")).not.toBeVisible();
    await page.getByTestId("cart-control-add").click();

    await expect(page.getByTestId("cart-control-quantity")).toHaveText(
      "1 in cart",
    );
    await expect(page.getByTestId("cart-badge")).toHaveText("1");
  });

  test("incrementing and decrementing updates the quantity", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByTestId("cart-control-add").click();
    await expect(page.getByTestId("cart-control-quantity")).toHaveText(
      "1 in cart",
    );

    await page.getByTestId("cart-control-increment").click();
    await expect(page.getByTestId("cart-control-quantity")).toHaveText(
      "2 in cart",
    );
    await expect(page.getByTestId("cart-badge")).toHaveText("2");

    await page.getByTestId("cart-control-decrement").click();
    await expect(page.getByTestId("cart-control-quantity")).toHaveText(
      "1 in cart",
    );
    await expect(page.getByTestId("cart-badge")).toHaveText("1");
  });

  test("decrementing from 1 asks for confirmation before removing", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByTestId("cart-control-add").click();
    await expect(page.getByTestId("cart-control-quantity")).toHaveText(
      "1 in cart",
    );

    await page.getByTestId("cart-control-decrement").click();
    await expect(page.getByText("Remove item?")).toBeVisible();

    await page.getByTestId("cart-remove-cancel-button").click();
    await expect(page.getByText("Remove item?")).not.toBeVisible();
    await expect(page.getByTestId("cart-control-quantity")).toHaveText(
      "1 in cart",
    );

    await page.getByTestId("cart-control-decrement").click();
    await expect(page.getByText("Remove item?")).toBeVisible();
    await page.getByTestId("cart-remove-confirm-button").click();

    await expect(page.getByTestId("cart-control-add")).toBeVisible();
    await expect(page.getByTestId("cart-badge")).not.toBeVisible();
  });

  test("drawer shows the empty state with no items", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("cart-trigger").click();

    await expect(page.getByTestId("cart-empty-state")).toBeVisible();
    await expect(page.getByText("Your cart is empty")).toBeVisible();
  });

  test("drawer lists the item, price, and subtotal", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("cart-control-add").click();
    await expect(page.getByTestId("cart-control-quantity")).toHaveText(
      "1 in cart",
    );
    await page.getByTestId("cart-control-increment").click();
    await expect(page.getByTestId("cart-control-quantity")).toHaveText(
      "2 in cart",
    );

    // The navbar auto-hides on scroll-down, and adding/incrementing from
    // the product grid (below the fold) can leave the page scrolled — bring
    // it back to the top so the fixed cart trigger is reachable.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByTestId("cart-trigger").click();
    const drawer = page.getByTestId("cart-drawer-content");

    await expect(drawer.getByTestId("cart-item-name")).toHaveText(
      DEFAULT_TEST_PRODUCT.name,
    );
    await expect(drawer.getByTestId("cart-item-price")).toHaveText("$20.00");
    await expect(drawer.getByTestId("cart-subtotal")).toHaveText("$20.00");
  });

  test("cart persists across a page reload", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("cart-control-add").click();
    await expect(page.getByTestId("cart-control-quantity")).toHaveText(
      "1 in cart",
    );

    await page.reload();

    await expect(page.getByTestId("cart-control-quantity")).toHaveText(
      "1 in cart",
    );
    await expect(page.getByTestId("cart-badge")).toHaveText("1");
  });
});
