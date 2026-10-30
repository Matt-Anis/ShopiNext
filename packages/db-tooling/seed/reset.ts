import { db } from "../client"
import {
  categories,
  productCategories,
  products,
  images,
  productOptions,
  productOptionValues,
  productVariants,
  variantOptionValues,
  cart,
  cartItems,
  orders,
  orderItems,
  orderTimelineEvents,
} from "@repo/db/public/schema"
import {
  user,
  account,
  session,
  verification,
} from "@repo/db/public/auth-schema"
import { adminOrderNotes } from "@repo/db/admin/schema"
import {
  adminUser,
  adminAccount,
  adminSession,
  adminVerification,
} from "@repo/db/admin/auth-schema"

export async function resetDatabase() {
  console.log("Resetting database records...")

  await db.delete(adminOrderNotes)
  await db.delete(orderTimelineEvents)
  await db.delete(orderItems)
  await db.delete(orders)
  await db.delete(cartItems)
  await db.delete(cart)
  await db.delete(variantOptionValues)
  await db.delete(productVariants)
  await db.delete(productOptionValues)
  await db.delete(productOptions)
  await db.delete(productCategories)
  await db.delete(images)
  await db.delete(products)
  await db.delete(categories)
  await db.delete(adminSession)
  await db.delete(adminAccount)
  await db.delete(adminVerification)
  await db.delete(adminUser)
  await db.delete(session)
  await db.delete(account)
  await db.delete(verification)
  await db.delete(user)
}
