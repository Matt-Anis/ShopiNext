import { test, expect, type Page } from "@playwright/test";
import { resetCartTables } from "../../utils/db-reset";
import { seedProduct } from "../../utils/seed-product";
import { clickUntilHydrated } from "../../utils/interaction";

test.beforeEach(async () => {
  await resetCartTables();
});

// The product detail page renders CartControl and the buy-now button
// twice, once for the mobile sticky footer and once for the desktop
// sidebar, each CSS-hidden at the other breakpoint rather than unmounted.
// Both instances share the same data-testid, so scope to whichever one is
// actually visible at the current viewport.
const visible = (page: Page, testId: string) =>
  page.getByTestId(testId).and(page.locator(":visible"));

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
