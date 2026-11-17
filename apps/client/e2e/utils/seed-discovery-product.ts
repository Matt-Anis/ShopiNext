import { eq } from "drizzle-orm"
import { products } from "@repo/db/public/schema"
import { testDb } from "./db"
import { linkProductToCategory } from "./seed-category"
import { seedProduct } from "./seed-product"
import { uniqueSuffix } from "./unique"

type DiscoveryProductOptions = {
  label?: string
  price?: number
  categoryId?: string
  createdAt?: Date
  status?: "active" | "draft"
  isActive?: boolean
}

export async function seedDiscoveryProduct(
  prefix: string,
  {
    label = "Product", price = 1000, categoryId,
    createdAt = new Date("2025-01-01T00:00:00.000Z"),
    status = "active", isActive = true,
  }: DiscoveryProductOptions = {},
) {
  const product = await seedProduct({
    name: `${prefix} ${label} ${uniqueSuffix()}`,
    description: `Discovery fixture ${uniqueSuffix()}`,
    price,
  })
  await testDb.update(products).set({ createdAt, status, isActive }).where(eq(products.id, product.id))
  if (categoryId) await linkProductToCategory(product.id, categoryId)
  return { ...product, createdAt, price, status, isActive }
}
