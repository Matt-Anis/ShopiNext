import { test, expect } from "@playwright/test";
import { resetCartTables } from "../../utils/db-reset";
import { seedProduct, seedProductWithVariants } from "../../utils/seed-product";
import { clickUntilHydrated, visible } from "../../utils/interaction";

test.beforeEach(async () => {
  await resetCartTables();
});

test.describe("Checkout redirects", () => {
  test("buy now redirects to the Stripe hosted checkout page", async ({
    page,
  }) => {
    const product = await seedProduct();
    await page.goto(`/products/${product.slug}`);

    await clickUntilHydrated(visible(page, "buy-now-button"), () =>
      expect(visible(page, "stripe-checkout-confirm")).toBeVisible({
        timeout: 1_000,
      }),
    );
    await page.getByTestId("stripe-checkout-confirm").click();
    await page.waitForURL(/checkout\.stripe\.com/, {
      timeout: 15_000,
      waitUntil: "domcontentloaded",
    });

    expect(page.url()).toContain("checkout.stripe.com");
  });

  test("cart checkout redirects to the Stripe hosted checkout page", async ({
    page,
  }) => {
    const product = await seedProduct();
    await page.goto(`/products/${product.slug}`);
    await clickUntilHydrated(visible(page, "cart-control-add"), () =>
      expect(visible(page, "cart-control-quantity")).toHaveText(
        "1 in cart",
        { timeout: 1000 },
      ),
    );

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByTestId("cart-trigger").click();
    await page.getByTestId("cart-checkout").click();
    await page.getByTestId("stripe-checkout-confirm").click();
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 15_000 });

    expect(page.url()).toContain("checkout.stripe.com");
  });
});

test.describe("Buy now does not touch the cart", () => {
  test("buying a second product does not clear or change what is already in the cart", async ({
    page,
  }) => {
    const productA = await seedProduct({
      slug: "product-a",
      name: "Product A",
    });
    const productB = await seedProduct({
      slug: "product-b",
      name: "Product B",
    });

    await page.goto(`/products/${productA.slug}`);
    await clickUntilHydrated(visible(page, "cart-control-add"), () =>
      expect(page.getByTestId("cart-badge")).toHaveText("1", { timeout: 1000 }),
    );

    await page.goto(`/products/${productB.slug}`);
    await clickUntilHydrated(visible(page, "buy-now-button"), () =>
      expect(visible(page, "stripe-checkout-confirm")).toBeVisible({
        timeout: 1_000,
      }),
    );
    await page.getByTestId("stripe-checkout-confirm").click();
    await page.waitForURL(/checkout\.stripe\.com/, {
      timeout: 15_000,
      waitUntil: "domcontentloaded",
    });

    await page.goto("/");
    await expect(page.getByTestId("cart-badge")).toHaveText("1");
  });
});

test.describe("Buy now quantity picker", () => {
  test("defaults to 1 and increments/decrements with a floor of 1 and a cap at maxPerOrder", async ({
    page,
  }) => {
    const product = await seedProduct({ maxPerOrder: 3 });
    await page.goto(`/products/${product.slug}`);

    await clickUntilHydrated(visible(page, "buy-now-button"), () =>
      expect(page.getByTestId("stripe-checkout-quantity")).toBeVisible({
        timeout: 1_000,
      }),
    );
    await expect(page.getByTestId("stripe-checkout-quantity")).toHaveText(
      "1",
    );
    await expect(
      page.getByTestId("stripe-checkout-quantity-decrement"),
    ).toBeDisabled();

    await page.getByTestId("stripe-checkout-quantity-increment").click();
    await page.getByTestId("stripe-checkout-quantity-increment").click();
    await expect(page.getByTestId("stripe-checkout-quantity")).toHaveText(
      "3",
    );
    await expect(
      page.getByTestId("stripe-checkout-quantity-increment"),
    ).toBeDisabled();

    await page.getByTestId("stripe-checkout-quantity-decrement").click();
    await expect(page.getByTestId("stripe-checkout-quantity")).toHaveText(
      "2",
    );
    await expect(
      page.getByTestId("stripe-checkout-quantity-increment"),
    ).toBeEnabled();
  });

  test("closing and reopening resets the quantity back to 1", async ({
    page,
  }) => {
    const product = await seedProduct({ maxPerOrder: 5 });
    await page.goto(`/products/${product.slug}`);

    await clickUntilHydrated(visible(page, "buy-now-button"), () =>
      expect(page.getByTestId("stripe-checkout-quantity")).toBeVisible({
        timeout: 1_000,
      }),
    );
    await page.getByTestId("stripe-checkout-quantity-increment").click();
    await expect(page.getByTestId("stripe-checkout-quantity")).toHaveText(
      "2",
    );

    await page.getByTestId("stripe-checkout-cancel").click();
    await expect(page.getByTestId("stripe-checkout-quantity")).not.toBeVisible();

    await visible(page, "buy-now-button").click();
    await expect(page.getByTestId("stripe-checkout-quantity")).toHaveText(
      "1",
    );
  });

  test("the buy-now button only appears once a full variant selection is made", async ({
    page,
  }) => {
    const product = await seedProductWithVariants({
      slug: "buy-now-selection-product",
      options: [{ name: "Size", values: ["S", "M"] }],
      variants: [
        { values: { Size: "S" }, price: 1000, stock: 5 },
        { values: { Size: "M" }, price: 1200, stock: 5 },
      ],
    });
    await page.goto(`/products/${product.slug}`);

    await expect(page.getByTestId("buy-now-button")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Select options" }).and(
        page.locator(":visible"),
      ),
    ).toHaveCount(2);

    await visible(page, "variant-pill-Size-S").click();
    await expect(visible(page, "buy-now-button")).toBeVisible();
  });
});
