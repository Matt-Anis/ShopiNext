import { testDb } from "./db";
import { products, images } from "@/db/schema";

export const DEFAULT_TEST_PRODUCT = {
  name: "Test Product",
  slug: "test-product",
  description: "A product used for end-to-end tests.",
  price: 1000,
};

export async function seedProduct(
  overrides: Partial<typeof DEFAULT_TEST_PRODUCT> = {},
) {
  const values = { ...DEFAULT_TEST_PRODUCT, ...overrides };

  const [product] = await testDb.insert(products).values(values).returning();

  await testDb.insert(images).values({
    productId: product.id,
    url: "https://picsum.photos/id/1/800/600",
    altText: product.name,
    isPrimary: true,
  });

  return product;
}
