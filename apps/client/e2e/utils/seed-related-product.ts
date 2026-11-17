import { eq } from "drizzle-orm"
import { products, productVariants } from "@repo/db/public/schema"
import { testDb } from "./db"
import { linkProductToCategory } from "./seed-category"
import { seedProduct, seedProductWithVariants } from "./seed-product"
import { uniqueSuffix } from "./unique"

type RelatedProductOptions = {
  categoryIds?: string[]
  createdAt?: Date
  status?: "active" | "draft"
  isActive?: boolean
  stock?: number
  maxPerOrder?: number
  variantIsActive?: boolean
  minPrice?: number | null
}

export async function seedRelatedProduct({
  categoryIds = [],
  createdAt = new Date("2025-01-01T00:00:00.000Z"),
  status = "active",
  isActive = true,
  stock,
  maxPerOrder,
  variantIsActive = true,
  minPrice,
}: RelatedProductOptions = {}) {
  const product = await seedProduct({
    name: `Related product ${uniqueSuffix()}`,
    description: `Related product fixture ${uniqueSuffix()}`,
    stock,
    maxPerOrder,
  })

  if (!variantIsActive) {
    await testDb
      .update(productVariants)
      .set({ isActive: false })
      .where(eq(productVariants.id, product.variant.id))
  }

  await testDb
    .update(products)
    .set({
      createdAt,
      status,
      isActive,
      ...(minPrice !== undefined ? { minPrice } : {}),
    })
    .where(eq(products.id, product.id))

  await Promise.all(
    categoryIds.map((categoryId) =>
      linkProductToCategory(product.id, categoryId)
    )
  )

  return { ...product, createdAt }
}

type RelatedVariantOptions = Pick<
  Parameters<typeof seedProductWithVariants>[0],
  "options" | "variants"
> & { categoryId: string }

export async function seedRelatedProductWithVariants({
  categoryId,
  ...variantOptions
}: RelatedVariantOptions) {
  const product = await seedProductWithVariants({
    ...variantOptions,
    name: `Related variants ${uniqueSuffix()}`,
    description: `Related variants fixture ${uniqueSuffix()}`,
  })
  await linkProductToCategory(product.id, categoryId)
  return product
}
