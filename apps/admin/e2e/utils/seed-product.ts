import { products } from "@repo/db/public/schema";
import { testDb } from "./db";

export const DEFAULT_TEST_PRODUCT = {
  name: "Test Product",
  slug: "test-product",
  description: "A product used in e2e tests",
  status: "draft" as const,
  isActive: true,
};

export async function seedProduct(
  overrides: Partial<typeof DEFAULT_TEST_PRODUCT> = {},
) {
  const [product] = await testDb
    .insert(products)
    .values({ ...DEFAULT_TEST_PRODUCT, ...overrides })
    .returning();

  if (!product) {
    throw new Error("Failed to seed product");
  }

  return product;
}
