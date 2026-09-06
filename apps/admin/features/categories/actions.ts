"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { categories } from "@repo/db/public/schema"
import { isUniqueViolation } from "@/lib/utils"
import { requireSession } from "@/lib/session"

export async function createCategory(name: string, description: string) {
  const session = await requireSession()

  const trimmedName = name.trim()
  if (!trimmedName) throw new Error("Name is required")

  try {
    const [category] = await db
      .insert(categories)
      .values({
        name: trimmedName,
        description: description.trim() || null,
        updatedBy: session.user.id,
      })
      .returning({ id: categories.id, name: categories.name })

    revalidatePath("/categories")
    return category
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error("A category with this name already exists")
    }
    console.error("[categories] createCategory failed:", error)
    throw error
  }
}

export async function updateCategory(
  id: string,
  name: string,
  description: string
) {
  const session = await requireSession()

  const trimmedName = name.trim()
  if (!trimmedName) throw new Error("Name is required")

  try {
    await db
      .update(categories)
      .set({
        name: trimmedName,
        description: description.trim() || null,
        updatedBy: session.user.id,
      })
      .where(eq(categories.id, id))
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error("A category with this name already exists")
    }
    console.error("[categories] updateCategory failed:", error)
    throw error
  }

  revalidatePath("/categories")
}

export async function deleteCategory(id: string) {
  const session = await requireSession()

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
