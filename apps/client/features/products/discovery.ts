import { z } from "zod"

export const PRODUCT_SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
] as const

export const productSortSchema = z.enum(["newest", "price_asc", "price_desc"])

export type ProductSortBy = z.infer<typeof productSortSchema>

export type ProductDiscovery = {
  query: string
  sortBy: ProductSortBy
}

type DiscoverySearchParams = Record<string, string | string[] | undefined>

export const MAX_PRODUCT_QUERY_LENGTH = 200

export function normalizeProductQuery(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, MAX_PRODUCT_QUERY_LENGTH)
}

export function parseProductDiscovery(params: DiscoverySearchParams): ProductDiscovery {
  return {
    query: typeof params.q === "string" ? normalizeProductQuery(params.q) : "",
    sortBy: productSortSchema.catch("newest").parse(params.sort),
  }
}

export function productDiscoveryHref(
  pathname: string,
  discovery: ProductDiscovery,
  currentSearch = "",
): string {
  const params = new URLSearchParams(currentSearch)
  const query = normalizeProductQuery(discovery.query)

  if (query) params.set("q", query)
  else params.delete("q")

  if (discovery.sortBy !== "newest") params.set("sort", discovery.sortBy)
  else params.delete("sort")

  const search = params.toString()
  return search ? `${pathname}?${search}` : pathname
}

export function productDiscoveryKey(
  discovery: ProductDiscovery,
  categoryId?: string,
): string {
  return JSON.stringify([categoryId ?? "", discovery.query, discovery.sortBy])
}
