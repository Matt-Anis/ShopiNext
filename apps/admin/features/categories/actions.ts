"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { categories } from "@repo/db/public/schema"
import { isUniqueViolation, slugify, uniqueViolationConstraint } from "@/lib/utils"
import { requireActionPermission } from "@/lib/auth/guards"

export async function createCategory(
  name: string,
  description: string,
  slug?: string
) {
  const session = await requireActionPermission("categories", "create")

  const trimmedName = name.trim()
  if (!trimmedName) throw new Error("Name is required")

  const resolvedSlug = slug?.trim() ? slugify(slug) : slugify(trimmedName)
  if (!resolvedSlug) throw new Error("A valid slug is required")

  try {
    const [category] = await db
      .insert(categories)
      .values({
        name: trimmedName,
        slug: resolvedSlug,
        description: description.trim() || null,
        updatedBy: session.user.id,
      })
      .returning({ id: categories.id, name: categories.name, slug: categories.slug })

    revalidatePath("/categories")
    return category
  } catch (error) {
    if (isUniqueViolation(error)) {
      const constraint = uniqueViolationConstraint(error)
      if (constraint === "categories_slug_active_unique") {
        throw new Error("A category with this slug already exists")
      }
      throw new Error("A category with this name already exists")
    }
    console.error("[categories] createCategory failed:", error)
    throw error
  }
}

export async function updateCategory(
  id: string,
  name: string,
  description: string,
  slug?: string
) {
  const session = await requireActionPermission("categories", "update")

  const trimmedName = name.trim()
  if (!trimmedName) throw new Error("Name is required")

  const values: {
    name: string
    description: string | null
    updatedBy: string
    slug?: string
  } = {
    name: trimmedName,
    description: description.trim() || null,
    updatedBy: session.user.id,
  }

  if (slug !== undefined) {
    const resolvedSlug = slugify(slug)
    if (!resolvedSlug) throw new Error("A valid slug is required")
    values.slug = resolvedSlug
  }

  try {
    await db
      .update(categories)
      .set(values)
      .where(eq(categories.id, id))
  } catch (error) {
    if (isUniqueViolation(error)) {
      const constraint = uniqueViolationConstraint(error)
      if (constraint === "categories_slug_active_unique") {
        throw new Error("A category with this slug already exists")
      }
      throw new Error("A category with this name already exists")
    }
    console.error("[categories] updateCategory failed:", error)
    throw error
  }

  revalidatePath("/categories")
}

export async function deleteCategory(id: string) {
  const session = await requireActionPermission("categories", "delete")

  try {
    await db
      .update(categories)
      .set({ isActive: false, updatedBy: session.user.id })
      .where(eq(categories.id, id))
  } catch (error) {
    console.error("[categories] deleteCategory failed:", error)
    throw error
  }

  revalidatePath("/categories")
}
