import { eq } from "drizzle-orm"

import { db } from "@/db"
import { products, categories } from "@repo/db/public/schema"

export async function getProductForWizard(id: string) {
  return db.query.products.findFirst({
    where: eq(products.id, id),
  })
}

export async function getCategoriesList() {
  return db.query.categories.findMany({
    where: eq(categories.isActive, true),
    orderBy: (category, { asc }) => [asc(category.name)],
  })
}

export async function getProductStep2Data(productId: string) {
  return db.query.products.findFirst({
    where: eq(products.id, productId),
    with: {
      productCategories: { columns: { categoryId: true } },
      options: { with: { values: true } },
    },
  })
}

export async function getProductStep3Data(productId: string) {
  return db.query.products.findFirst({
    where: eq(products.id, productId),
    with: {
      options: { with: { values: true } },
      variants: {
        where: (variant, { eq }) => eq(variant.isActive, true),
        with: { variantOptionValues: { columns: { optionValueId: true } } },
      },
    },
  })
}

export async function getProductsList() {
  const rows = await db.query.products.findMany({
    orderBy: (product, { desc }) => [desc(product.createdAt)],
    with: {
      variants: {
        columns: { id: true },
        where: (variant, { eq }) => eq(variant.isActive, true),
      },
      options: { columns: { id: true } },
      productCategories: {
        columns: {},
        with: { category: { columns: { name: true } } },
      },
      images: {
        columns: { url: true },
        where: (image, { eq }) => eq(image.isPrimary, true),
        limit: 1,
      },
    },
  })

  return rows.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    status: product.status,
    isActive: product.isActive,
    createdAt: product.createdAt,
    thumbnailUrl: product.images[0]?.url ?? null,
    variantCount: product.variants.length,
    optionCount: product.options.length,
    categoryNames: product.productCategories.map((pc) => pc.category.name),
  }))
}

export async function getProductDetail(productId: string) {
  return db.query.products.findFirst({
    where: eq(products.id, productId),
    with: {
      images: true,
      productCategories: { with: { category: true } },
      options: { with: { values: true } },
      variants: {
        where: (variant, { eq }) => eq(variant.isActive, true),
        with: {
          variantOptionValues: { with: { optionValue: true } },
        },
      },
    },
  })
}
