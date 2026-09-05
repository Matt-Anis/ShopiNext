"use server"

import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { db } from "@/db"
import { products } from "@repo/db/public/schema"
import { isUniqueViolation } from "@/lib/utils"

export async function createProduct(
  name: string,
  slug: string,
  description: string
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("Unauthorized")

  const trimmedName = name.trim()
  if (!trimmedName) throw new Error("Name is required")

  const trimmedSlug = slug.trim()
  if (!trimmedSlug) throw new Error("Slug is required")

  try {
    const [product] = await db
      .insert(products)
      .values({
        name: trimmedName,
        slug: trimmedSlug,
        description: description.trim() || null,
        status: "draft",
        isActive: true,
      })
      .returning({ id: products.id })

    return { id: product.id }
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error("A product with this slug already exists")
    }
    console.error("[products] createProduct failed:", error)
    throw error
  }
}
