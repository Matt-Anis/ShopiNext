import { z } from "zod"
import {
  MAX_PRODUCT_QUERY_LENGTH,
  normalizeProductQuery,
  productSortSchema,
} from "./discovery"

export const productPageRequestSchema = z.object({
  categoryId: z.uuid().optional(),
  query: z.string().max(MAX_PRODUCT_QUERY_LENGTH).transform(normalizeProductQuery).default(""),
  sortBy: productSortSchema.default("newest"),
  cursor: z.object({
    id: z.uuid(),
    value: z.union([z.date(), z.number().int().nonnegative()]),
  }),
}).superRefine(({ cursor, sortBy }, context) => {
  const validValue = sortBy === "newest"
    ? cursor.value instanceof Date
    : typeof cursor.value === "number"

  if (!validValue) {
    context.addIssue({
      code: "custom",
      path: ["cursor", "value"],
      message: "The cursor must match the product sort order.",
    })
  }
})
