import { and, asc, eq, inArray } from "drizzle-orm"
import { db } from "@/db"
import { cart, cartItems, images, productVariants } from "@repo/db/public/schema"
import { optionLabelFor } from "@/features/products/queries"
import type { CartItem } from "@/features/cart/actions"

type RawCartVariant = {
  id: string
  price: number
  stock: number
  maxPerOrder: number
  product: {
    id: string
    name: string
    slug: string
    images: { url: string; altText: string | null }[]
  }
  variantOptionValues: { optionValue: { value: string } }[]
}

export const toCartItem = (item: {
  quantity: number
  variant: RawCartVariant
}): CartItem => ({
  quantity: item.quantity,
  variant: {
    id: item.variant.id,
    price: item.variant.price,
    maxPerOrder: Math.min(item.variant.stock, item.variant.maxPerOrder),
    optionLabel: optionLabelFor(item.variant.variantOptionValues),
    product: {
      id: item.variant.product.id,
      name: item.variant.product.name,
      slug: item.variant.product.slug,
      image: item.variant.product.images[0] ?? null,
    },
  },
})

export type Cart = Awaited<ReturnType<typeof getCartFromDb>>

export const getCartFromDb = async (userId: string) => {
  const result = await db.query.cart.findFirst({
    where: eq(cart.userId, userId),
    with: {
      items: {
        with: {
          variant: {
            with: {
              product: {
                with: {
                  images: {
                    orderBy: [asc(images.order)],
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
          },
        },
      },
    },
  })

  if (!result) return null

  return {
    ...result,
    items: result.items.filter((item) => item.variant.isActive),
  }
}

// Scalar subquery resolving a user's cart id inline, so callers don't
// need a separate round trip before reading/writing cart_items.
const cartIdForUser = (userId: string) =>
  db.select({ id: cart.id }).from(cart).where(eq(cart.userId, userId))

export const createCartItem = async (
  userId: string,
  variantId: string,
  quantity = 1
) => {
  await db.transaction(async (tx) => {
    const [cartRow] = await tx
      .insert(cart)
      .values({ userId })
      .onConflictDoUpdate({ target: cart.userId, set: { userId } })
      .returning({ id: cart.id })
    const cartId = cartRow.id

    const [variant] = await tx
      .select({ stock: productVariants.stock, maxPerOrder: productVariants.maxPerOrder })
      .from(productVariants)
      .where(
        and(eq(productVariants.id, variantId), eq(productVariants.isActive, true))
      )

    if (!variant) return

    const [existing] = await tx
      .select({ quantity: cartItems.quantity })
      .from(cartItems)
      .where(
        and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, variantId))
      )

    const nextQuantity = Math.min(
      (existing?.quantity ?? 0) + quantity,
      variant.stock,
      variant.maxPerOrder
    )

    if (nextQuantity <= 0) {
      if (existing) {
        await tx
          .delete(cartItems)
          .where(
            and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, variantId))
          )
      }
      return
    }

    await tx
      .insert(cartItems)
      .values({ cartId, variantId, quantity: nextQuantity })
      .onConflictDoUpdate({
        target: [cartItems.cartId, cartItems.variantId],
        set: { quantity: nextQuantity },
      })
  })
}

export const updateCartItemQuantity = async (
  userId: string,
  variantId: string,
  quantity: number
) => {
  if (quantity <= 0) {
    await deleteCartItem(userId, variantId)
    return
  }

  await db.transaction(async (tx) => {
    const [variant] = await tx
      .select({ stock: productVariants.stock, maxPerOrder: productVariants.maxPerOrder })
      .from(productVariants)
      .where(
        and(eq(productVariants.id, variantId), eq(productVariants.isActive, true))
      )

    if (!variant) return

    const nextQuantity = Math.min(quantity, variant.stock, variant.maxPerOrder)

    if (nextQuantity <= 0) {
      await tx
        .delete(cartItems)
        .where(
          and(
            inArray(cartItems.cartId, cartIdForUser(userId)),
            eq(cartItems.variantId, variantId)
          )
        )
      return
    }

    await tx
      .update(cartItems)
      .set({ quantity: nextQuantity })
      .where(
        and(
          inArray(cartItems.cartId, cartIdForUser(userId)),
          eq(cartItems.variantId, variantId)
        )
      )
  })
}

export const deleteCartItem = async (userId: string, variantId: string) => {
  await db
    .delete(cartItems)
    .where(
      and(
        inArray(cartItems.cartId, cartIdForUser(userId)),
        eq(cartItems.variantId, variantId)
      )
    )
}

export const clearCart = async (userId: string) => {
  await db
    .delete(cartItems)
    .where(inArray(cartItems.cartId, cartIdForUser(userId)))
}

export const mergeGuestCartIntoDb = async (
  userId: string,
  items: { variantId: string; quantity: number }[]
) => {
  if (items.length === 0) return

  const consolidated = new Map<string, number>()
  for (const item of items) {
    if (item.quantity > 0) {
      consolidated.set(
        item.variantId,
        (consolidated.get(item.variantId) ?? 0) + item.quantity
      )
    }
  }
  if (consolidated.size === 0) return

  await db.transaction(async (tx) => {
    const [cartRow] = await tx
      .insert(cart)
      .values({ userId })
      .onConflictDoUpdate({ target: cart.userId, set: { userId } })
      .returning({ id: cart.id })
    const cartId = cartRow.id

    const variantIds = Array.from(consolidated.keys())
    const variants = await tx
      .select({
        id: productVariants.id,
        stock: productVariants.stock,
        maxPerOrder: productVariants.maxPerOrder,
      })
      .from(productVariants)
      .where(
        and(
          inArray(productVariants.id, variantIds),
          eq(productVariants.isActive, true)
        )
      )

    const variantMap = new Map(variants.map((v) => [v.id, v]))

    const existingItems = await tx
      .select({
        variantId: cartItems.variantId,
        quantity: cartItems.quantity,
      })
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cartId),
          inArray(cartItems.variantId, variantIds)
        )
      )

    const existingMap = new Map(
      existingItems.map((e) => [e.variantId, e.quantity])
    )

    for (const [variantId, quantity] of consolidated.entries()) {
      const variant = variantMap.get(variantId)
      if (!variant) continue

      const currentQty = existingMap.get(variantId) ?? 0
      const nextQuantity = Math.min(
        currentQty + quantity,
        variant.stock,
        variant.maxPerOrder
      )

      if (nextQuantity <= 0) continue

      await tx
        .insert(cartItems)
        .values({ cartId, variantId, quantity: nextQuantity })
        .onConflictDoUpdate({
          target: [cartItems.cartId, cartItems.variantId],
          set: { quantity: nextQuantity },
        })
    }
  })
}
