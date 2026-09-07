"use server"

import { revalidatePath } from "next/cache"
import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import {
  products,
  productCategories,
  productOptions,
  productOptionValues,
  productVariants,
  variantOptionValues,
  orderItems,
} from "@repo/db/public/schema"
import { isUniqueViolation, uniqueViolationConstraint } from "@/lib/utils"
import { requireSession } from "@/lib/session"

export async function createProduct(
  name: string,
  slug: string,
  description: string
) {
  await requireSession()

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

export async function updateProductDetails(
  productId: string,
  name: string,
  slug: string,
  description: string
) {
  await requireSession()

  const trimmedName = name.trim()
  if (!trimmedName) throw new Error("Name is required")

  const trimmedSlug = slug.trim()
  if (!trimmedSlug) throw new Error("Slug is required")

  try {
    await db
      .update(products)
      .set({
        name: trimmedName,
        slug: trimmedSlug,
        description: description.trim() || null,
      })
      .where(eq(products.id, productId))
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error("A product with this slug already exists")
    }
    console.error("[products] updateProductDetails failed:", error)
    throw error
  }

  revalidatePath(`/products/${productId}/edit/step-1`)
  revalidatePath("/products")
}

export async function addProductCategory(
  productId: string,
  categoryId: string
) {
  await requireSession()

  try {
    await db
      .insert(productCategories)
      .values({ productId, categoryId })
      .onConflictDoNothing()
  } catch (error) {
    console.error("[products] addProductCategory failed:", error)
    throw error
  }

  revalidatePath(`/products/${productId}/edit/step-2`)
}

export async function removeProductCategory(
  productId: string,
  categoryId: string
) {
  await requireSession()

  try {
    await db
      .delete(productCategories)
      .where(
        and(
          eq(productCategories.productId, productId),
          eq(productCategories.categoryId, categoryId)
        )
      )
  } catch (error) {
    console.error("[products] removeProductCategory failed:", error)
    throw error
  }

  revalidatePath(`/products/${productId}/edit/step-2`)
}

export async function createProductOption(productId: string, name: string) {
  await requireSession()

  const trimmedName = name.trim()
  if (!trimmedName) throw new Error("Option name is required")

  try {
    const [option] = await db
      .insert(productOptions)
      .values({ productId, name: trimmedName })
      .returning({ id: productOptions.id, name: productOptions.name })

    revalidatePath(`/products/${productId}/edit/step-2`)
    return option
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error("An option with this name already exists")
    }
    console.error("[products] createProductOption failed:", error)
    throw error
  }
}

export async function deleteProductOption(productId: string, optionId: string) {
  await requireSession()

  const [activeVariant] = await db
    .select({ id: productVariants.id })
    .from(productVariants)
    .innerJoin(
      variantOptionValues,
      eq(variantOptionValues.variantId, productVariants.id)
    )
    .innerJoin(
      productOptionValues,
      eq(productOptionValues.id, variantOptionValues.optionValueId)
    )
    .where(
      and(
        eq(productOptionValues.optionId, optionId),
        eq(productVariants.isActive, true)
      )
    )
    .limit(1)

  if (activeVariant) {
    throw new Error(
      "Can't delete this option, it's used by an active variant"
    )
  }

  try {
    // Cascades to productOptionValues and their variantOptionValues, but
    // the in-use check above guarantees no active variant loses a tag.
    await db.delete(productOptions).where(eq(productOptions.id, optionId))
  } catch (error) {
    console.error("[products] deleteProductOption failed:", error)
    throw error
  }

  revalidatePath(`/products/${productId}/edit/step-2`)
  revalidatePath(`/products/${productId}/edit/step-3`)
}

export async function addProductOptionValue(
  productId: string,
  optionId: string,
  value: string
) {
  await requireSession()

  const trimmedValue = value.trim()
  if (!trimmedValue) throw new Error("Value is required")

  try {
    const [optionValue] = await db
      .insert(productOptionValues)
      .values({ optionId, value: trimmedValue })
      .returning({
        id: productOptionValues.id,
        value: productOptionValues.value,
      })

    revalidatePath(`/products/${productId}/edit/step-2`)
    return optionValue
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error("This option already has that value")
    }
    console.error("[products] addProductOptionValue failed:", error)
    throw error
  }
}

export async function deleteProductOptionValue(
  productId: string,
  valueId: string
) {
  await requireSession()

  try {
    // Cascades to variantOptionValues if a variant already used this value.
    await db
      .delete(productOptionValues)
      .where(eq(productOptionValues.id, valueId))
  } catch (error) {
    console.error("[products] deleteProductOptionValue failed:", error)
    throw error
  }

  revalidatePath(`/products/${productId}/edit/step-2`)
  revalidatePath(`/products/${productId}/edit/step-3`)
}

interface VariantFields {
  sku: string
  price: number
  stock: number
  maxPerOrder: number
}

function validateVariantFields(fields: VariantFields) {
  const sku = fields.sku.trim()
  if (!sku) throw new Error("SKU is required")

  const price = Math.trunc(fields.price)
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Price can't be negative")
  }

  const stock = Math.trunc(fields.stock)
  if (!Number.isFinite(stock) || stock < 0) {
    throw new Error("Stock can't be negative")
  }

  const maxPerOrder = Math.trunc(fields.maxPerOrder)
  if (!Number.isFinite(maxPerOrder) || maxPerOrder < 1) {
    throw new Error("Max per order must be at least 1")
  }

  return { sku, price, stock, maxPerOrder }
}

export async function createProductVariant(
  productId: string,
  fields: VariantFields,
  optionValueIds: string[]
) {
  await requireSession()

  const { sku, price, stock, maxPerOrder } = validateVariantFields(fields)

  if (optionValueIds.length === 0) {
    const [option] = await db
      .select({ id: productOptions.id })
      .from(productOptions)
      .where(eq(productOptions.productId, productId))
      .limit(1)

    if (option) {
      throw new Error(
        "This product has options, so every variant needs at least one option value"
      )
    }
  }

  const optionSignature = [...optionValueIds].sort().join(",")

  try {
    const variant = await db.transaction(async (tx) => {
      const [insertedVariant] = await tx
        .insert(productVariants)
        .values({ productId, sku, price, stock, maxPerOrder, optionSignature })
        .returning()

      if (optionValueIds.length) {
        await tx.insert(variantOptionValues).values(
          optionValueIds.map((optionValueId) => ({
            variantId: insertedVariant.id,
            optionValueId,
          }))
        )
      }

      return insertedVariant
    })

    revalidatePath(`/products/${productId}/edit/step-3`)
    return variant
  } catch (error) {
    if (isUniqueViolation(error)) {
      if (
        uniqueViolationConstraint(error) ===
        "product_variants_productId_optionSignature_active_unique"
      ) {
        throw new Error(
          "A variant with this exact option combination already exists"
        )
      }
      throw new Error("This SKU is already in use")
    }
    console.error("[products] createProductVariant failed:", error)
    throw error
  }
}

export async function updateProductVariant(
  productId: string,
  variantId: string,
  fields: VariantFields
) {
  await requireSession()

  const { sku, price, stock, maxPerOrder } = validateVariantFields(fields)

  try {
    await db
      .update(productVariants)
      .set({ sku, price, stock, maxPerOrder })
      .where(eq(productVariants.id, variantId))
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error("This SKU is already in use")
    }
    console.error("[products] updateProductVariant failed:", error)
    throw error
  }

  revalidatePath(`/products/${productId}/edit/step-3`)
}

export async function deleteProductVariant(
  productId: string,
  variantId: string
) {
  await requireSession()

  const [orderItem] = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .where(eq(orderItems.variantId, variantId))
    .limit(1)

  if (orderItem) {
    throw new Error("Can't delete this variant, it has existing orders")
  }

  try {
    await db.delete(productVariants).where(eq(productVariants.id, variantId))
  } catch (error) {
    console.error("[products] deleteProductVariant failed:", error)
    throw error
  }

  revalidatePath(`/products/${productId}/edit/step-3`)
}

export async function setProductStatus(
  productId: string,
  status: "draft" | "active"
) {
  await requireSession()

  if (status === "active") {
    const [variant] = await db
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(eq(productVariants.productId, productId))
      .limit(1)

    if (!variant) {
      throw new Error("Add at least one variant before publishing")
    }
  }

  try {
    await db.update(products).set({ status }).where(eq(products.id, productId))
  } catch (error) {
    console.error("[products] setProductStatus failed:", error)
    throw error
  }

  revalidatePath("/products")
  revalidatePath(`/products/${productId}/edit/step-3`)
}

export async function deactivateProduct(productId: string) {
  await requireSession()

  try {
    await db
      .update(products)
      .set({ isActive: false })
      .where(eq(products.id, productId))
  } catch (error) {
    console.error("[products] deactivateProduct failed:", error)
    throw error
  }

  revalidatePath("/products")
}

export async function activateProduct(productId: string) {
  await requireSession()

  try {
    await db
      .update(products)
      .set({ isActive: true })
      .where(eq(products.id, productId))
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error("Another active product already uses this slug")
    }
    console.error("[products] activateProduct failed:", error)
    throw error
  }

  revalidatePath("/products")
}
