import { test, expect } from "@playwright/test";
import { testDb } from "../../utils/db";
import { seedProduct } from "../../utils/seed-product";
import { uniqueSuffix } from "../../utils/unique";
import { products } from "@repo/db/public/schema";

test.describe("Homepage product listing", () => {
  test("a product with no variants is never listed", async ({ page }) => {
    const noVariantsName = `No Variants Product ${uniqueSuffix()}`;

    await seedProduct({
      name: "Has Stock Product",
      slug: "has-stock-product",
      price: 1500,
    });
    await testDb.insert(products).values({
      name: noVariantsName,
      slug: `no-variants-product-${uniqueSuffix()}`,
      description: "A product with no variants at all.",
    });

    await page.goto("/");

    await expect(
      page.getByText("Has Stock Product", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(noVariantsName, { exact: true }),
    ).toHaveCount(0);
  });
});
