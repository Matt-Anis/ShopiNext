import { test, expect } from "@playwright/test";
import { testDb } from "../../utils/db";
import { seedProduct } from "../../utils/seed-product";
import { uniqueSuffix } from "../../utils/unique";
import { products } from "@repo/db/public/schema";

test.describe("Homepage product listing", () => {
  test("a product with no variants is never listed", async ({ page }) => {
    const listedProduct = await seedProduct({
      name: `Has Stock Product ${uniqueSuffix()}`,
      slug: "has-stock-product",
      price: 1500,
    });
    const [productWithoutVariants] = await testDb
      .insert(products)
      .values({
        name: `No Variants Product ${uniqueSuffix()}`,
        slug: `no-variants-product-${uniqueSuffix()}`,
        description: "A product with no variants at all.",
      })
      .returning({ id: products.id });

    await page.goto("/");

    await expect(
      page.getByTestId(`product-card-${listedProduct.id}`),
    ).toBeVisible();
    await expect(
      page.getByTestId(`product-card-${productWithoutVariants.id}`),
    ).toBeHidden();
  });
});
