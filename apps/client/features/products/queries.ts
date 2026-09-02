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
import { images, products } from "@repo/db/public/schema"

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

  const rows = await db.query.products.findMany({
    where: and(isNotNull(products.minPrice), cursorWhere),
    orderBy,
    limit,
    with: {
      images: {
        where: eq(images.isPrimary, true),
        limit: 1,
      },
    },
  })

  const last = rows.at(-1)
  const nextCursor: ProductCursor | null =
    rows.length === limit && last
      ? {
          id: last.id,
          value: sortBy === "newest" ? last.createdAt : (last.minPrice as number),
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
    },
  })

  return product ?? null
}

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
