import { test, expect } from "@playwright/test";
import { seedCategory, linkProductToCategory } from "../../utils/seed-category";
import { seedProduct } from "../../utils/seed-product";
import { uniqueSuffix } from "../../utils/unique";

test.describe("Categories listing and product pages", () => {
  test("renders active categories on /categories and links to category page", async ({
    page,
  }) => {
    const category = await seedCategory({
      description: "A wonderful collection for testing",
    });

    await page.goto("/categories");

    const categoryCard = page.getByTestId(`category-card-${category.slug}`);
    await expect(categoryCard).toBeVisible();
    await expect(categoryCard).toContainText(category.name);
    await expect(categoryCard).toContainText(category.description!);

    await categoryCard.click();
    await expect(page).toHaveURL(`/categories/${category.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      category.name
    );
  });

  test("renders only products belonging to the category on /categories/[slug]", async ({
    page,
  }) => {
    const category = await seedCategory();
    const productInCategory = await seedProduct({ name: "In Category Product" });
    const unrelatedProduct = await seedProduct({ name: "Unrelated Product" });

    await linkProductToCategory(productInCategory.id, category.id);

    await page.goto(`/categories/${category.slug}`);

    // Verify category header
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      category.name
    );

    // Verify product in category is shown
    const productCard = page.getByTestId(
      `product-card-${productInCategory.id}`
    );
    await expect(productCard).toBeVisible();
    await expect(productCard).toContainText(productInCategory.name);

    // Verify unrelated product is not shown
    const unrelatedCard = page.getByTestId(
      `product-card-${unrelatedProduct.id}`
    );
    await expect(unrelatedCard).toBeHidden();
  });

  test("renders empty state when a category has no products", async ({
    page,
  }) => {
    const emptyCategory = await seedCategory();

    await page.goto(`/categories/${emptyCategory.slug}`);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      emptyCategory.name
    );
    await expect(page.getByText("No products found")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Browse other categories" })
    ).toBeVisible();
  });

  test("returns 404 for non-existent and inactive categories", async ({
    page,
  }) => {
    const invalidSlug = `non-existent-${uniqueSuffix()}`;
    const resInvalid = await page.goto(`/categories/${invalidSlug}`);
    expect(resInvalid?.status()).toBe(404);

    const inactiveCategory = await seedCategory({ isActive: false });
    const resInactive = await page.goto(`/categories/${inactiveCategory.slug}`);
    expect(resInactive?.status()).toBe(404);
  });
});
