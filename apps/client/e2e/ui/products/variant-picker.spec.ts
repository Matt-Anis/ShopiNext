import { test, expect } from "@playwright/test";
import { resetCartTables } from "../../utils/db-reset";
import { seedProduct, seedProductWithVariants } from "../../utils/seed-product";
import { visible } from "../../utils/interaction";

test.beforeEach(async () => {
  await resetCartTables();
});

test.describe("Product detail variant picker", () => {
  test("a product with no options shows its price with no pills", async ({
    page,
  }) => {
    const product = await seedProduct({ price: 1500, stock: 5 });
    await page.goto(`/products/${product.slug}`);

    await expect(visible(page, "variant-price")).toHaveText("$15.00");
    await expect(page.locator('[data-testid^="variant-pill-"]')).toHaveCount(0);
  });

  test("selecting a full combination shows that variant's price", async ({
    page,
  }) => {
    const product = await seedProductWithVariants({
      slug: "combo-product",
      options: [
        { name: "Color", values: ["Red", "Blue"] },
        { name: "Size", values: ["S", "M"] },
      ],
      variants: [
        { values: { Color: "Red", Size: "S" }, price: 1000, stock: 5 },
        { values: { Color: "Red", Size: "M" }, price: 1200, stock: 5 },
        { values: { Color: "Blue", Size: "S" }, price: 1100, stock: 5 },
        { values: { Color: "Blue", Size: "M" }, price: 1300, stock: 5 },
      ],
    });
    await page.goto(`/products/${product.slug}`);

    await expect(visible(page, "variant-price")).toHaveText("From $10.00");

    await visible(page, "variant-pill-Color-Blue").click();
    await visible(page, "variant-pill-Size-M").click();

    await expect(visible(page, "variant-price")).toHaveText("$13.00");
    await expect(visible(page, "variant-pill-Color-Blue")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(visible(page, "variant-pill-Size-M")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("a sold-out combination is disabled with a 'Sold out' tooltip", async ({
    page,
  }) => {
    const product = await seedProductWithVariants({
      slug: "sold-out-combo-product",
      options: [
        { name: "Color", values: ["Red", "Blue"] },
        { name: "Size", values: ["S", "M"] },
      ],
      variants: [
        { values: { Color: "Red", Size: "S" }, price: 1000, stock: 5 },
        { values: { Color: "Red", Size: "M" }, price: 1200, stock: 0 },
        { values: { Color: "Blue", Size: "S" }, price: 1100, stock: 5 },
      ],
    });
    await page.goto(`/products/${product.slug}`);

    await visible(page, "variant-pill-Color-Red").click();

    const soldOutSize = visible(page, "variant-pill-Size-M");
    await expect(soldOutSize).toHaveAttribute("aria-disabled", "true");

    await soldOutSize.hover();
    await expect(page.getByText("Sold out")).toBeVisible();
  });

  test("a combination that was never created is disabled with a 'Not available' tooltip", async ({
    page,
  }) => {
    const product = await seedProductWithVariants({
      slug: "missing-combo-product",
      options: [
        { name: "Color", values: ["Red", "Blue"] },
        { name: "Size", values: ["S", "M"] },
      ],
      variants: [
        { values: { Color: "Red", Size: "S" }, price: 1000, stock: 5 },
        { values: { Color: "Red", Size: "M" }, price: 1200, stock: 5 },
        { values: { Color: "Blue", Size: "S" }, price: 1100, stock: 5 },
      ],
    });
    await page.goto(`/products/${product.slug}`);

    await visible(page, "variant-pill-Color-Blue").click();

    const missingSize = visible(page, "variant-pill-Size-M");
    await expect(missingSize).toHaveAttribute("aria-disabled", "true");

    await missingSize.hover();
    await expect(page.getByText("Not available")).toBeVisible();
  });

  test("no selection shows a disabled Select options for both add-to-cart and buy-now", async ({
    page,
  }) => {
    const product = await seedProductWithVariants({
      slug: "no-selection-combo-product",
      options: [{ name: "Size", values: ["S", "M"] }],
      variants: [
        { values: { Size: "S" }, price: 1000, stock: 5 },
        { values: { Size: "M" }, price: 1200, stock: 5 },
      ],
    });
    await page.goto(`/products/${product.slug}`);

    const selectOptionsButtons = page
      .getByRole("button", { name: "Select options" })
      .and(page.locator(":visible"));
    await expect(selectOptionsButtons).toHaveCount(2);

    for (const button of await selectOptionsButtons.all()) {
      await expect(button).toBeDisabled();
    }
  });

  test("a full multi-option selection adds the exact variant with a combined option label", async ({
    page,
  }) => {
    const product = await seedProductWithVariants({
      slug: "combo-label-product",
      options: [
        { name: "Color", values: ["Red", "Blue"] },
        { name: "Size", values: ["S", "M"] },
      ],
      variants: [
        { values: { Color: "Red", Size: "S" }, price: 1000, stock: 5 },
        { values: { Color: "Blue", Size: "M" }, price: 1300, stock: 5 },
      ],
    });
    await page.goto(`/products/${product.slug}`);

    await visible(page, "variant-pill-Color-Blue").click();
    await visible(page, "variant-pill-Size-M").click();
    await visible(page, "cart-control-add").click();
    await expect(visible(page, "cart-control-quantity")).toHaveText(
      "1 in cart",
    );

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByTestId("cart-trigger").click();
    const drawer = page.getByTestId("cart-drawer-content");

    await expect(drawer.getByText("Blue / M", { exact: true })).toBeVisible();
    await expect(drawer.getByTestId("cart-item-price")).toHaveText("$13.00");
  });

  test("switching the selection shows Add to Cart for the newly selected variant, not the previous one's quantity", async ({
    page,
  }) => {
    const product = await seedProductWithVariants({
      slug: "switch-selection-product",
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
    await expect(visible(page, "cart-control-add")).toBeVisible();

    await visible(page, "variant-pill-Size-S").click();
    await expect(visible(page, "cart-control-quantity")).toHaveText(
      "1 in cart",
    );
  });
});
