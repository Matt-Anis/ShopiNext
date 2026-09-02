import { test, expect } from "@playwright/test";
import { testDb } from "../../utils/db";
import { resetCartTables } from "../../utils/db-reset";
import { seedProduct } from "../../utils/seed-product";
import { products } from "@repo/db/public/schema";

test.beforeEach(async () => {
  await resetCartTables();
});

test.describe("Homepage product listing", () => {
  test("a product with no variants is never listed", async ({ page }) => {
    await seedProduct({
      name: "Has Stock Product",
      slug: "has-stock-product",
      price: 1500,
    });
    await testDb.insert(products).values({
      name: "No Variants Product",
      slug: "no-variants-product",
      description: "A product with no variants at all.",
    });

    await page.goto("/");

    await expect(
      page.getByText("Has Stock Product", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("No Variants Product", { exact: true }),
    ).toHaveCount(0);
  });

  test("infinite scroll loads products past the first page", async ({
    page,
  }) => {
    for (let i = 1; i <= 25; i++) {
      await seedProduct({
        name: `Homepage Product ${i}`,
        slug: `homepage-product-${i}`,
        price: 1000,
      });
    }

    await page.goto("/");

    const oldest = page.getByText("Homepage Product 1", { exact: true });
    const newest = page.getByText("Homepage Product 25", { exact: true });

    await expect(newest).toBeVisible();
    await expect(oldest).toHaveCount(0);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    await expect(oldest).toBeVisible({ timeout: 15_000 });
  });
});
