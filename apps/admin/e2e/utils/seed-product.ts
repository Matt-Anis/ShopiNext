import {
  products,
  productOptions,
  productOptionValues,
  productVariants,
  variantOptionValues,
} from "@repo/db/public/schema";
import { testDb } from "./db";
import { uniqueSuffix } from "./unique";

export const DEFAULT_TEST_PRODUCT = {
  name: "Test Product",
  slug: "test-product",
  description: "A product used in e2e tests",
  status: "draft" as const,
  isActive: true,
};

export async function seedProduct(
  overrides: Partial<Omit<typeof DEFAULT_TEST_PRODUCT, "status">> & {
    status?: "draft" | "active";
  } = {},
) {
  const values = { ...DEFAULT_TEST_PRODUCT, ...overrides };
  values.slug = `${values.slug}-${uniqueSuffix()}`;

  const [product] = await testDb.insert(products).values(values).returning();

  if (!product) {
    throw new Error("Failed to seed product");
  }

  return product;
}

export async function seedProductOption(
  productId: string,
  name: string,
  values: string[] = [],
) {
  const [option] = await testDb
    .insert(productOptions)
    .values({ productId, name })
    .returning();

  if (!option) {
    throw new Error("Failed to seed product option");
  }

  const valueRows = values.length
    ? await testDb
        .insert(productOptionValues)
        .values(values.map((value) => ({ optionId: option.id, value })))
        .returning()
    : [];

  return { ...option, values: valueRows };
}

export async function seedProductVariant(
  productId: string,
  overrides: Partial<{
    sku: string;
    price: number;
    stock: number;
    maxPerOrder: number;
  }> = {},
  optionValueIds: string[] = [],
) {
  const sku = `${overrides.sku ?? "test-variant"}-${uniqueSuffix()}`;

  const [variant] = await testDb
    .insert(productVariants)
    .values({
      productId,
      sku,
      price: overrides.price ?? 1000,
      stock: overrides.stock ?? 10,
      maxPerOrder: overrides.maxPerOrder ?? 5,
      optionSignature: [...optionValueIds].sort().join(","),
    })
    .returning();

  if (!variant) {
    throw new Error("Failed to seed product variant");
  }

  if (optionValueIds.length) {
    await testDb.insert(variantOptionValues).values(
      optionValueIds.map((optionValueId) => ({
        variantId: variant.id,
        optionValueId,
      })),
    );
  }

  return variant;
}
