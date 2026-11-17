import { and, asc, desc, eq, exists, gt, inArray, isNotNull, ne } from "drizzle-orm"
import { db } from "@/db"
import {
  categories,
  images,
  productCategories,
  productVariants,
} from "@repo/db/public/schema"
import type { Product } from "./queries"
import { shapeVariant } from "./shape-variant"

type RelatedProductsParams = {
  productId: string
  categoryIds: string[]
}

export async function getRelatedProducts({
  productId,
  categoryIds,
}: RelatedProductsParams): Promise<Product[]> {
  if (categoryIds.length === 0) return []

  const rows = await db.query.products.findMany({
    where: (product) => and(
      ne(product.id, productId),
      eq(product.isActive, true),
      eq(product.status, "active"),
      isNotNull(product.minPrice),
      exists(
        db.select({ id: productCategories.id })
          .from(productCategories)
          .innerJoin(categories, eq(categories.id, productCategories.categoryId))
          .where(and(
            eq(productCategories.productId, product.id),
            inArray(productCategories.categoryId, categoryIds),
            eq(categories.isActive, true),
          )),
      ),
      exists(
        db.select({ id: productVariants.id })
          .from(productVariants)
          .where(and(
            eq(productVariants.productId, product.id),
            eq(productVariants.isActive, true),
            gt(productVariants.stock, 0),
            gt(productVariants.maxPerOrder, 0),
          )),
      ),
    ),
    orderBy: (product) => [desc(product.createdAt), desc(product.id)],
    limit: 4,
    with: {
      images: {
        orderBy: [asc(images.order)],
        limit: 1,
      },
      options: {
        with: { values: true },
      },
      variants: {
        where: eq(productVariants.isActive, true),
        with: { variantOptionValues: true },
      },
    },
  })

  return rows.map((row) => ({
    ...row,
    minPrice: row.minPrice as number,
    variants: row.variants.map(shapeVariant),
  }))
}
