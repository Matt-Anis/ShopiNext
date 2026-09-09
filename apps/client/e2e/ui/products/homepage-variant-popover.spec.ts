import { test, expect } from "@playwright/test";
import { seedProductWithVariants } from "../../utils/seed-product";
import { clickUntilHydrated } from "../../utils/interaction";

test.describe("Homepage variant popover", () => {
  test("clicking Add to Cart on a multi-variant product opens a popover instead of adding directly", async ({
    page,
  }) => {
    const product = await seedProductWithVariants({
      slug: "popover-product",
      options: [{ name: "Size", values: ["S", "M"] }],
      variants: [
        { values: { Size: "S" }, price: 1000, stock: 5 },
        { values: { Size: "M" }, price: 1200, stock: 5 },
      ],
    });
    await page.goto("/");

    await expect(page.getByTestId(`product-card-${product.id}`)).toBeVisible();
    await clickUntilHydrated(
      page.getByTestId(`product-card-add-to-cart-${product.id}`),
      () =>
        expect(
          page.getByTestId(`variant-pill-Size-S-${product.id}`),
        ).toBeVisible({ timeout: 1000 }),
    );

    await expect(page.getByTestId("cart-badge")).not.toBeVisible();
  });

  test("an incomplete selection keeps the popover's add action disabled", async ({
    page,
  }) => {
    const product = await seedProductWithVariants({
      slug: "popover-incomplete-product",
      options: [
        { name: "Color", values: ["Red", "Blue"] },
        { name: "Size", values: ["S", "M"] },
      ],
      variants: [
        { values: { Color: "Red", Size: "S" }, price: 1000, stock: 5 },
        { values: { Color: "Red", Size: "M" }, price: 1200, stock: 5 },
      ],
    });
    await page.goto("/");

    await clickUntilHydrated(
      page.getByTestId(`product-card-add-to-cart-${product.id}`),
      () =>
        expect(
          page.getByTestId(`variant-pill-Color-Red-${product.id}`),
        ).toBeVisible({ timeout: 1000 }),
    );
    await page.getByTestId(`variant-pill-Color-Red-${product.id}`).click();

    await expect(
      page.getByRole("button", { name: "Select options" }),
    ).toBeDisabled();
  });

  test("selecting a full combination in the popover adds that specific variant", async ({
    page,
  }) => {
    const product = await seedProductWithVariants({
      slug: "popover-select-product",
      options: [{ name: "Size", values: ["S", "M"] }],
      variants: [
        { values: { Size: "S" }, price: 1000, stock: 5 },
        { values: { Size: "M" }, price: 1200, stock: 5 },
      ],
    });
    await page.goto("/");

    await clickUntilHydrated(
      page.getByTestId(`product-card-add-to-cart-${product.id}`),
      () =>
        expect(
          page.getByTestId(`variant-pill-Size-M-${product.id}`),
        ).toBeVisible({ timeout: 1000 }),
    );
    await page.getByTestId(`variant-pill-Size-M-${product.id}`).click();
    await page.getByTestId(`cart-control-add-${product.id}`).click();

    await expect(
      page.getByTestId(`cart-control-quantity-${product.id}`),
    ).toHaveText("1 in cart");
    await expect(page.getByTestId("cart-badge")).toHaveText("1");

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByTestId("cart-trigger").click();
    const drawer = page.getByTestId("cart-drawer-content");

    await expect(drawer.getByTestId("cart-item-price")).toHaveText("$12.00");
    await expect(drawer.getByText("M", { exact: true })).toBeVisible();
  });

  test("a sold-out combination's pill in the popover is disabled with a tooltip", async ({
    page,
  }) => {
    const product = await seedProductWithVariants({
      slug: "popover-sold-out-product",
      options: [{ name: "Size", values: ["S", "M"] }],
      variants: [
        { values: { Size: "S" }, price: 1000, stock: 5 },
        { values: { Size: "M" }, price: 1200, stock: 0 },
      ],
    });
    await page.goto("/");

    const soldOutPill = page.getByTestId(`variant-pill-Size-M-${product.id}`);
    await clickUntilHydrated(
      page.getByTestId(`product-card-add-to-cart-${product.id}`),
      () => expect(soldOutPill).toBeVisible({ timeout: 1000 }),
    );

    await expect(soldOutPill).toHaveAttribute("aria-disabled", "true");

    await soldOutPill.hover();
    await expect(
      page.getByTestId(`variant-pill-Size-M-${product.id}-tooltip`),
    ).toHaveText("Sold out");
  });
});
