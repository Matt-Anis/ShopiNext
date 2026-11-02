import { categories, productCategories } from "@repo/db/public/schema";
import { testDb } from "./db";
import { uniqueSuffix } from "./unique";

export const DEFAULT_TEST_CATEGORY = {
  name: "Test Category",
  slug: "test-category",
  description: "A category used for end-to-end tests.",
  isActive: true,
};

export async function seedCategory(
  overrides: Partial<typeof DEFAULT_TEST_CATEGORY> = {}
) {
  const suffix = uniqueSuffix();
  const values = {
    ...DEFAULT_TEST_CATEGORY,
    ...overrides,
    name: overrides.name
      ? `${overrides.name} ${suffix}`
      : `${DEFAULT_TEST_CATEGORY.name} ${suffix}`,
    slug: overrides.slug
      ? `${overrides.slug}-${suffix}`
      : `${DEFAULT_TEST_CATEGORY.slug}-${suffix}`,
  };

  const [category] = await testDb.insert(categories).values(values).returning();

  if (!category) {
    throw new Error("Failed to seed category");
  }

  return category;
}

export async function linkProductToCategory(
  productId: string,
  categoryId: string
) {
  const [record] = await testDb
    .insert(productCategories)
    .values({
      productId,
      categoryId,
    })
    .returning();

  return record;
}
