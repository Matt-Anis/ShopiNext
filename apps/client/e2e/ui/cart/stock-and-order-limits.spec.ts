import { test, expect } from "@playwright/test";
import { eq } from "drizzle-orm";
import { productVariants } from "@repo/db/public/schema";
import { testDb } from "../../utils/db";
import { resetCartTables } from "../../utils/db-reset";
import { seedProduct } from "../../utils/seed-product";
import { clickUntilHydrated, visible } from "../../utils/interaction";

test.beforeEach(async () => {
  await resetCartTables();
});

test.describe("Stock and per-order limits", () => {
  // A product's minPrice trigger only counts variants with stock > 0, so a
  // fully sold-out product is excluded from the homepage listing entirely
  // (isNotNull(minPrice)) - the "Sold out" state via 0 stock is only ever
  // reachable on the PDP, which shows a product regardless of stock.
  test("a sold-out product (0 stock) shows a disabled Sold out button on the PDP", async ({
    page,
  }) => {
    const product = await seedProduct({
      name: "Sold Out PDP Product",
      slug: "sold-out-pdp-product",
      stock: 0,
    });

    await page.goto(`/products/${product.slug}`);

    const addButton = visible(page, "cart-control-add");
    await expect(addButton).toHaveText("Sold out");
    await expect(addButton).toBeDisabled();
  });

  test("a product with maxPerOrder 0 is treated as sold out", async ({
    page,
  }) => {
    await seedProduct({
      name: "Zero Limit Product",
      slug: "zero-limit-product",
      stock: 10,
      maxPerOrder: 0,
    });

    await page.goto("/");

    const addButton = page.getByTestId("cart-control-add");
    await expect(addButton).toHaveText("Sold out");
    await expect(addButton).toBeDisabled();
  });

  test("the + stepper disables at maxPerOrder when it's the tighter limit and shows a tooltip", async ({
    page,
  }) => {
    await seedProduct({
      name: "Tight Order Limit Product",
      slug: "tight-order-limit-product",
      stock: 10,
      maxPerOrder: 2,
    });

    await page.goto("/");
    await clickUntilHydrated(page.getByTestId("cart-control-add"), () =>
      expect(page.getByTestId("cart-control-quantity")).toHaveText(
        "1 in cart",
        { timeout: 1000 },
      ),
    );

    await page.getByTestId("cart-control-increment").click();
    await expect(page.getByTestId("cart-control-quantity")).toHaveText(
      "2 in cart",
    );

    const limitReached = page.getByTestId("cart-control-increment");
    await expect(limitReached).toHaveAttribute("aria-disabled", "true");

    await limitReached.hover();
    await expect(
      page.getByText("You've reached the maximum quantity"),
    ).toBeVisible();
  });

  test("the + stepper disables at stock when it's the tighter limit", async ({
    page,
  }) => {
    await seedProduct({
      name: "Tight Stock Product",
      slug: "tight-stock-product",
      stock: 2,
      maxPerOrder: 10,
    });

    await page.goto("/");
    await clickUntilHydrated(page.getByTestId("cart-control-add"), () =>
      expect(page.getByTestId("cart-control-quantity")).toHaveText(
        "1 in cart",
        { timeout: 1000 },
      ),
    );

    await page.getByTestId("cart-control-increment").click();
    await expect(page.getByTestId("cart-control-quantity")).toHaveText(
      "2 in cart",
    );

    await expect(page.getByTestId("cart-control-increment")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  test("the server clamps quantity if stock drops below the client's cached cap", async ({
    page,
  }) => {
    const product = await seedProduct({
      name: "Race Condition Product",
      slug: "race-condition-product",
      stock: 5,
      maxPerOrder: 10,
    });

    await page.goto("/");
    await clickUntilHydrated(page.getByTestId("cart-control-add"), () =>
      expect(page.getByTestId("cart-control-quantity")).toHaveText(
        "1 in cart",
        { timeout: 1000 },
      ),
    );

    await testDb
      .update(productVariants)
      .set({ stock: 1 })
      .where(eq(productVariants.id, product.variant.id));

    await page.getByTestId("cart-control-increment").click();

    await expect(page.getByTestId("cart-control-quantity")).toHaveText(
      "1 in cart",
    );
  });
});
