import { test, expect } from "@playwright/test";
import { resetCartTables } from "../../utils/db-reset";
import { seedProductWithVariants } from "../../utils/seed-product";

test.beforeEach(async () => {
  await resetCartTables();
});

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

    await expect(page.getByText(product.name, { exact: true })).toBeVisible();
    await page.getByTestId("product-card-add-to-cart").click();

    await expect(page.getByTestId("variant-pill-Size-S")).toBeVisible();
    await expect(page.getByTestId("cart-badge")).not.toBeVisible();
  });

  test("an incomplete selection keeps the popover's add action disabled", async ({
    page,
  }) => {
    await seedProductWithVariants({
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

    await page.getByTestId("product-card-add-to-cart").click();
    await page.getByTestId("variant-pill-Color-Red").click();

    await expect(
      page.getByRole("button", { name: "Select options" }),
    ).toBeDisabled();
  });

  test("selecting a full combination in the popover adds that specific variant", async ({
    page,
  }) => {
    await seedProductWithVariants({
      slug: "popover-select-product",
      options: [{ name: "Size", values: ["S", "M"] }],
      variants: [
        { values: { Size: "S" }, price: 1000, stock: 5 },
        { values: { Size: "M" }, price: 1200, stock: 5 },
      ],
    });
    await page.goto("/");

    await page.getByTestId("product-card-add-to-cart").click();
    await page.getByTestId("variant-pill-Size-M").click();
    await page.getByTestId("cart-control-add").click();

    await expect(page.getByTestId("cart-control-quantity")).toHaveText(
      "1 in cart",
    );
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
    await seedProductWithVariants({
      slug: "popover-sold-out-product",
      options: [{ name: "Size", values: ["S", "M"] }],
      variants: [
        { values: { Size: "S" }, price: 1000, stock: 5 },
        { values: { Size: "M" }, price: 1200, stock: 0 },
      ],
    });
    await page.goto("/");

    await page.getByTestId("product-card-add-to-cart").click();

    const soldOutPill = page.getByTestId("variant-pill-Size-M");
    await expect(soldOutPill).toHaveAttribute("aria-disabled", "true");

    await soldOutPill.hover();
    await expect(page.getByText("Sold out")).toBeVisible();
  });
});
