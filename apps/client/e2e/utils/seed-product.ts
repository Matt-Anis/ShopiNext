import { testDb } from "./db";
import {
  products,
  images,
  productOptions,
  productOptionValues,
  productVariants,
  variantOptionValues,
} from "@repo/db/public/schema";

export const DEFAULT_TEST_PRODUCT = {
  name: "Test Product",
  slug: "test-product",
  description: "A product used for end-to-end tests.",
};

export async function seedProduct(
  overrides: Partial<typeof DEFAULT_TEST_PRODUCT> & {
    price?: number;
    stock?: number;
    maxPerOrder?: number;
  } = {},
) {
  const {
    price = 1000,
    stock = 10,
    maxPerOrder = 10,
    ...productOverrides
  } = overrides;
  const values = { ...DEFAULT_TEST_PRODUCT, ...productOverrides };

  const [product] = await testDb.insert(products).values(values).returning();

  await testDb.insert(images).values({
    productId: product.id,
    url: "https://picsum.photos/id/1/800/600",
    altText: product.name,
    isPrimary: true,
  });

  const [variant] = await testDb
    .insert(productVariants)
    .values({
      productId: product.id,
      sku: `${product.slug}-default`,
      price,
      stock,
      maxPerOrder,
    })
    .returning();

  return { ...product, variant };
}

type VariantSpec = {
  values: Record<string, string>;
  price: number;
  stock: number;
  maxPerOrder?: number;
};

export async function seedProductWithVariants(
  params: Partial<typeof DEFAULT_TEST_PRODUCT> & {
    options: { name: string; values: string[] }[];
    variants: VariantSpec[];
  },
) {
  const { options, variants, ...productOverrides } = params;
  const values = { ...DEFAULT_TEST_PRODUCT, ...productOverrides };

  const [product] = await testDb.insert(products).values(values).returning();

  await testDb.insert(images).values({
    productId: product.id,
    url: "https://picsum.photos/id/1/800/600",
    altText: product.name,
    isPrimary: true,
  });

  const valueIdByOptionAndValue = new Map<string, string>();

  for (const option of options) {
    const [optionRow] = await testDb
      .insert(productOptions)
      .values({ productId: product.id, name: option.name })
      .returning();

    const valueRows = await testDb
      .insert(productOptionValues)
      .values(option.values.map((value) => ({ optionId: optionRow.id, value })))
      .returning();

    valueRows.forEach((row) => {
      valueIdByOptionAndValue.set(`${option.name}:${row.value}`, row.id);
    });
  }

  for (const [index, variant] of variants.entries()) {
    const [variantRow] = await testDb
      .insert(productVariants)
      .values({
        productId: product.id,
        sku: `${product.slug}-${index}`,
        price: variant.price,
        stock: variant.stock,
        maxPerOrder: variant.maxPerOrder ?? 10,
      })
      .returning();

    const optionValueIds = Object.entries(variant.values).map(
      ([optionName, value]) => {
        const id = valueIdByOptionAndValue.get(`${optionName}:${value}`);
        if (!id) {
          throw new Error(
            `seedProductWithVariants: "${value}" is not a declared value of option "${optionName}"`,
          );
        }
        return id;
      },
    );

    if (optionValueIds.length > 0) {
      await testDb
        .insert(variantOptionValues)
        .values(
          optionValueIds.map((optionValueId) => ({
            variantId: variantRow.id,
            optionValueId,
          })),
        );
    }
  }

  return product;
}
