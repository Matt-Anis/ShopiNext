"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { db } from "@/db"
import { categories } from "@repo/db/public/schema"
import { isUniqueViolation } from "@/lib/utils"

export async function createCategory(name: string, description: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("Unauthorized")

  const trimmedName = name.trim()
  if (!trimmedName) throw new Error("Name is required")

  try {
    await db.insert(categories).values({
      name: trimmedName,
      description: description.trim() || null,
      updatedBy: session.user.id,
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error("A category with this name already exists")
    }
    console.error("[categories] createCategory failed:", error)
    throw error
  }

  revalidatePath("/categories")
}

export async function updateCategory(
  id: string,
  name: string,
  description: string
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("Unauthorized")

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
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("Unauthorized")

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
