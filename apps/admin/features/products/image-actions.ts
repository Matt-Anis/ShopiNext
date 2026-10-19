"use server"

import { revalidatePath } from "next/cache"
import { and, eq, sql } from "drizzle-orm"

import { db } from "@/db"
import { images, products } from "@repo/db/public/schema"
import { requireSession } from "@/lib/session"
import {
  createPresignedUploadUrl,
  deleteStorageObject,
  extractStorageKeyFromUrl,
} from "@/lib/storage"

export async function getPresignedProductImageUploadUrl(
  productId: string,
  filename: string,
  contentType: string
) {
  await requireSession()

  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1)

  if (!product) {
    throw new Error("Product not found")
  }

  return createPresignedUploadUrl({
    productId,
    filename,
    contentType,
  })
}

export async function createProductImage(
  productId: string,
  url: string,
  altText?: string | null
) {
  await requireSession()

  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1)

  if (!product) {
    throw new Error("Product not found")
  }

  const [maxOrderResult] = await db
    .select({
      maxOrder: sql<number>`coalesce(max(${images.order}), -1)`,
    })
    .from(images)
    .where(eq(images.productId, productId))

  const nextOrder = Number(maxOrderResult?.maxOrder ?? -1) + 1

  const [newImage] = await db
    .insert(images)
    .values({
      productId,
      url,
      altText: altText?.trim() || null,
      order: nextOrder,
    })
    .returning()

  revalidatePath("/products")
  revalidatePath(`/products/${productId}`)
  revalidatePath(`/products/${productId}/edit/media`)

  return newImage
}

export async function reorderProductImages(
  productId: string,
  orderedImageIds: string[]
) {
  await requireSession()

  if (!orderedImageIds.length) {
    return
  }

  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedImageIds.length; i++) {
      await tx
        .update(images)
        .set({ order: i })
        .where(
          and(
            eq(images.id, orderedImageIds[i]),
            eq(images.productId, productId)
          )
        )
    }
  })

  revalidatePath("/products")
  revalidatePath(`/products/${productId}`)
  revalidatePath(`/products/${productId}/edit/media`)
}

export async function deleteProductImage(productId: string, imageId: string) {
  await requireSession()

  const [image] = await db
    .select()
    .from(images)
    .where(and(eq(images.id, imageId), eq(images.productId, productId)))
    .limit(1)

  if (!image) {
    throw new Error("Image not found")
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(images)
      .where(and(eq(images.id, imageId), eq(images.productId, productId)))

    const remainingImages = await tx
      .select({ id: images.id })
      .from(images)
      .where(eq(images.productId, productId))
      .orderBy(images.order)

    for (let i = 0; i < remainingImages.length; i++) {
      await tx
        .update(images)
        .set({ order: i })
        .where(eq(images.id, remainingImages[i].id))
    }
  })

  const storageKey = extractStorageKeyFromUrl(image.url)
  if (storageKey) {
    try {
      await deleteStorageObject(storageKey)
    } catch (storageError) {
      console.error(
        "[products] deleteProductImage storage cleanup failed:",
        storageError
      )
    }
  }

  revalidatePath("/products")
  revalidatePath(`/products/${productId}`)
  revalidatePath(`/products/${productId}/edit/media`)
}

export async function updateProductImageAltText(
  productId: string,
  imageId: string,
  altText: string
) {
  await requireSession()

  await db
    .update(images)
    .set({ altText: altText.trim() || null })
    .where(and(eq(images.id, imageId), eq(images.productId, productId)))

  revalidatePath(`/products/${productId}`)
  revalidatePath(`/products/${productId}/edit/media`)
}
