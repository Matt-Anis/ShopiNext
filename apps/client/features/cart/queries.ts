import { and, eq, inArray } from "drizzle-orm"
import { db } from "@/db"
import { cart, cartItems, images, productVariants } from "@repo/db/public/schema"
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
    optionLabel: item.variant.variantOptionValues
      .map((v) => v.optionValue.value)
      .join(" / "),
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
                    where: eq(images.isPrimary, true),
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

  return result ?? null
}

// Scalar subquery resolving a user's cart id inline, so callers don't
// need a separate round trip before reading/writing cart_items.
const cartIdForUser = (userId: string) =>
  db.select({ id: cart.id }).from(cart).where(eq(cart.userId, userId))

const ensureCartId = async (userId: string) => {
  const [row] = await db
    .insert(cart)
    .values({ userId })
    .onConflictDoUpdate({ target: cart.userId, set: { userId } })
    .returning({ id: cart.id })

  return row.id
}

export const createCartItem = async (
  userId: string,
  variantId: string,
  quantity = 1
) => {
  await db.transaction(async (tx) => {
    const cartId = await ensureCartId(userId)

    const [variant] = await tx
      .select({ stock: productVariants.stock, maxPerOrder: productVariants.maxPerOrder })
      .from(productVariants)
      .where(eq(productVariants.id, variantId))

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
      .where(eq(productVariants.id, variantId))

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
