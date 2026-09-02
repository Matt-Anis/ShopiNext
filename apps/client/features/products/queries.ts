import {
  and,
  asc,
  desc,
  eq,
  gt,
  inArray,
  isNotNull,
  lt,
  or,
  type Column,
  type GetColumnData,
} from "drizzle-orm"
import { db } from "@/db"
import { images, productVariants, products } from "@repo/db/public/schema"

const shapeVariant = <
  T extends {
    stock: number
    maxPerOrder: number
    variantOptionValues: { optionValueId: string }[]
  },
>(
  variant: T
) => {
  const { variantOptionValues, stock, maxPerOrder, ...rest } = variant
  return {
    ...rest,
    maxPerOrder: Math.min(stock, maxPerOrder),
    optionValueIds: variantOptionValues.map((v) => v.optionValueId),
  }
}

export type ProductSortBy = "newest" | "price_asc" | "price_desc"

export type Product = Awaited<
  ReturnType<typeof getAllProducts>
>["products"][number]

export type ProductCursor = {
  id: string
  value: Date | number
}

type GetAllProductsParams = {
  cursor?: ProductCursor | null
  limit?: number
  sortBy?: ProductSortBy
}

const DEFAULT_LIMIT = 24

const cursorCompare = <TColumn extends Column>(
  column: TColumn,
  cursor: { id: string; value: GetColumnData<TColumn, "raw"> },
  direction: "asc" | "desc"
) => {
  const compare = direction === "asc" ? gt : lt
  return or(
    compare(column, cursor.value),
    and(eq(column, cursor.value), compare(products.id, cursor.id))
  )
}

export const getAllProducts = async ({
  cursor,
  limit = DEFAULT_LIMIT,
  sortBy = "newest",
}: GetAllProductsParams = {}) => {
  let cursorWhere
  let orderBy

  switch (sortBy) {
    case "price_asc":
      cursorWhere = cursor
        ? cursorCompare(
            products.minPrice,
            { id: cursor.id, value: cursor.value as number },
            "asc"
          )
        : undefined
      orderBy = [asc(products.minPrice), asc(products.id)]
      break
    case "price_desc":
      cursorWhere = cursor
        ? cursorCompare(
            products.minPrice,
            { id: cursor.id, value: cursor.value as number },
            "desc"
          )
        : undefined
      orderBy = [desc(products.minPrice), desc(products.id)]
      break
    case "newest":
    default:
      cursorWhere = cursor
        ? cursorCompare(
            products.createdAt,
            { id: cursor.id, value: cursor.value as Date },
            "desc"
          )
        : undefined
      orderBy = [desc(products.createdAt), desc(products.id)]
      break
  }

  const rawRows = await db.query.products.findMany({
    where: and(isNotNull(products.minPrice), cursorWhere),
    orderBy,
    limit,
    with: {
      images: {
        where: eq(images.isPrimary, true),
        limit: 1,
      },
      options: {
        with: {
          values: true,
        },
      },
      variants: {
        with: {
          variantOptionValues: true,
        },
      },
    },
  })

  const rows = rawRows.map((row) => ({
    ...row,
    minPrice: row.minPrice as number,
    variants: row.variants.map(shapeVariant),
  }))

  const last = rows.at(-1)
  const nextCursor: ProductCursor | null =
    rows.length === limit && last
      ? {
          id: last.id,
          value: sortBy === "newest" ? last.createdAt : last.minPrice,
        }
      : null

  return { products: rows, nextCursor }
}

export const getProductBySlug = async (slug: string) => {
  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: {
      images: {
        orderBy: desc(images.isPrimary),
      },
      options: {
        with: {
          values: true,
        },
      },
      variants: {
        with: {
          variantOptionValues: true,
        },
      },
    },
  })

  if (!product) return null

  return {
    ...product,
    variants: product.variants.map(shapeVariant),
  }
}

export type ProductDetail = NonNullable<
  Awaited<ReturnType<typeof getProductBySlug>>
>

export const getProductsByIds = async (ids: string[]) => {
  if (ids.length === 0) return []

  return db.query.products.findMany({
    where: inArray(products.id, ids),
    with: {
      images: {
        where: eq(images.isPrimary, true),
        limit: 1,
      },
    },
  })
}

export const getVariantsByIds = async (ids: string[]) => {
  if (ids.length === 0) return []

  return db.query.productVariants.findMany({
    where: inArray(productVariants.id, ids),
    with: {
      product: {
        with: {
          images: {
            where: eq(images.isPrimary, true),
            limit: 1,
          },
        },
      },
      variantOptionValues: {
        with: {
          optionValue: true,
        },
      },
    },
  })
}
