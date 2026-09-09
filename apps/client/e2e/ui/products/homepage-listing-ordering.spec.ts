import { test, expect } from "@playwright/test";
import { resetCartTables } from "../../utils/db-reset";
import { seedProduct } from "../../utils/seed-product";

test.beforeEach(async () => {
  await resetCartTables();
});

test.describe("Homepage product listing ordering", () => {
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
