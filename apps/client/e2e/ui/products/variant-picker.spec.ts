import { test, expect, type Page } from "@playwright/test";
import { resetCartTables } from "../../utils/db-reset";
import { seedProduct, seedProductWithVariants } from "../../utils/seed-product";

test.beforeEach(async () => {
  await resetCartTables();
});

const visible = (page: Page, testId: string) =>
  page.getByTestId(testId).and(page.locator(":visible"));

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
});
