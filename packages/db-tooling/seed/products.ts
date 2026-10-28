import { randomUUID } from "node:crypto"
import { seed } from "drizzle-seed"
import { eq } from "drizzle-orm"
import { db } from "../client"
import {
  products,
  productCategories,
  images,
  productOptions,
  productOptionValues,
  productVariants,
  variantOptionValues,
} from "@repo/db/public/schema"

export interface SeededVariant {
  id: string
  price: number
  name: string
}

const picsumUrls = Array.from(
  { length: 300 },
  (_, i) => `https://picsum.photos/id/${i + 1}/800/600`
)

const OPTION_POOLS = [
  { name: "Size", values: ["XS", "Small", "Medium", "Large", "XL", "2XL"] },
  { name: "Color", values: ["Black", "White", "Navy", "Olive", "Burgundy", "Heather Grey"] },
  { name: "Material", values: ["Organic Cotton", "Merino Wool", "Heavy Denim", "Linen Blend"] },
  { name: "Finish", values: ["Matte", "Gloss", "Brushed", "Textured"] },
] as const

function pickRandom<T>(arr: readonly T[], count: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, count)
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function cartesian<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((combo) => curr.map((item) => [...combo, item])),
    [[]]
  )
}

async function insertInChunks<T>(
  items: T[],
  chunkSize: number,
  insertFn: (chunk: T[]) => Promise<unknown>
): Promise<void> {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    if (chunk.length > 0) {
      await insertFn(chunk)
    }
  }
}

export async function seedProducts(
  categoryMap: Map<string, string>
): Promise<SeededVariant[]> {
  console.log("Seeding 50 products and images using drizzle-seed...")

  await seed(db, { products, images }).refine((f) => ({
    products: {
      count: 50,
      columns: {
        description: f.loremIpsum({ sentencesCount: 6 }),
        status: f.default({ defaultValue: "active" }),
      },
      with: {
        images: 3,
      },
    },
    images: {
      columns: {
        url: f.valuesFromArray({ values: picsumUrls }),
        altText: f.loremIpsum({ sentencesCount: 1 }),
      },
    },
  }))

  const seededProducts = await db
    .select({ id: products.id, name: products.name, slug: products.slug })
    .from(products)

  const categoryIds = Array.from(categoryMap.values())

  const productCategoryRows = seededProducts.flatMap((product) =>
    pickRandom(categoryIds, randomInt(1, 3)).map((categoryId) => ({
      id: randomUUID(),
      productId: product.id,
      categoryId,
    }))
  )
  if (productCategoryRows.length > 0) {
    await insertInChunks(productCategoryRows, 100, (chunk) =>
      db.insert(productCategories).values(chunk)
    )
  }

  console.log("Seeding product options and variant combinations...")

  const optionRows: (typeof productOptions.$inferInsert)[] = []
  const optionValueRows: (typeof productOptionValues.$inferInsert)[] = []
  const variantRows: (typeof productVariants.$inferInsert)[] = []
  const variantOptionValueRows: (typeof variantOptionValues.$inferInsert)[] = []
  const seededVariants: SeededVariant[] = []

  let variantCounter = 1

  for (const product of seededProducts) {
    const rand = Math.random()
    const optionCount = rand < 0.1 ? 0 : rand < 0.55 ? randomInt(1, 2) : randomInt(2, 3)
    const chosenPools = pickRandom(OPTION_POOLS, optionCount)
    const cleanProductSlug = product.slug.toUpperCase().replace(/[^A-Z0-9]/g, "-").slice(0, 14)

    if (chosenPools.length === 0) {
      const variantId = randomUUID()
      const price = randomInt(1499, 29999)
      const sku = `${cleanProductSlug}-STD-${String(variantCounter++).padStart(4, "0")}`

      variantRows.push({
        id: variantId,
        productId: product.id,
        sku,
        price,
        stock: randomInt(5, 50),
        maxPerOrder: 5,
        optionSignature: "",
        updatedAt: new Date(),
      })

      seededVariants.push({
        id: variantId,
        price,
        name: product.name,
      })
      continue
    }

    const valuesByOption: { id: string; value: string }[][] = []

    for (const pool of chosenPools) {
      const optionId = randomUUID()
      optionRows.push({ id: optionId, productId: product.id, name: pool.name })

      const chosenValues = pickRandom(pool.values, randomInt(2, 4))
      const values = chosenValues.map((value) => ({ id: randomUUID(), value }))
      for (const val of values) {
        optionValueRows.push({ id: val.id, optionId, value: val.value })
      }
      valuesByOption.push(values)
    }

    let combinations = cartesian(valuesByOption)

    if (combinations.length > 9) {
      const kept = combinations.filter(() => Math.random() > 0.25)
      combinations = kept.length >= 2 ? kept.slice(0, 9) : combinations.slice(0, 9)
    }

    const productSoldOut = Math.random() < 0.08

    for (const combo of combinations) {
      const variantId = randomUUID()
      const skuSuffix = combo.map((v) => v.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)).join("-")
      const sku = `${cleanProductSlug}-${skuSuffix}-${String(variantCounter++).padStart(4, "0")}`
      const price = randomInt(1499, 39999)

      variantRows.push({
        id: variantId,
        productId: product.id,
        sku,
        price,
        stock: productSoldOut || Math.random() < 0.12 ? 0 : randomInt(1, 60),
        maxPerOrder: randomInt(2, 6),
        optionSignature: combo.map(({ id }) => id).sort().join(","),
        updatedAt: new Date(),
      })

      for (const { id: optionValueId } of combo) {
        variantOptionValueRows.push({
          id: randomUUID(),
          variantId,
          optionValueId,
        })
      }

      seededVariants.push({
        id: variantId,
        price,
        name: `${product.name} (${combo.map((c) => c.value).join(", ")})`,
      })
    }
  }

  if (optionRows.length > 0) {
    await insertInChunks(optionRows, 100, (chunk) => db.insert(productOptions).values(chunk))
  }
  if (optionValueRows.length > 0) {
    await insertInChunks(optionValueRows, 100, (chunk) => db.insert(productOptionValues).values(chunk))
  }
  if (variantRows.length > 0) {
    await insertInChunks(variantRows, 50, (chunk) => db.insert(productVariants).values(chunk))
  }
  if (variantOptionValueRows.length > 0) {
    await insertInChunks(variantOptionValueRows, 100, (chunk) => db.insert(variantOptionValues).values(chunk))
  }

  for (const product of seededProducts) {
    const productVariantPrices = variantRows
      .filter((v) => v.productId === product.id && typeof v.price === "number")
      .map((v) => v.price as number)

    if (productVariantPrices.length > 0) {
      const minPrice = Math.min(...productVariantPrices)
      await db
        .update(products)
        .set({ minPrice })
        .where(eq(products.id, product.id))
    }
  }

  console.log(`Seeded ${seededProducts.length} products with ${variantRows.length} variant combinations.`)
  return seededVariants
}
