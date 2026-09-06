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
