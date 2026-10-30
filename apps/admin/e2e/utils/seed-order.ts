import {
  orders,
  orderItems,
  orderTimelineEvents,
  type OrderStatus,
} from "@repo/db/public/schema"
import { adminOrderNotes } from "@repo/db/admin/schema"
import { testDb } from "./db"
import { uniqueSuffix } from "./unique"

export const DEFAULT_TEST_ORDER = {
  checkoutEmail: "customer@example.com",
  stripeSessionId: "cs_test_session",
  totalAmount: 5000,
  status: "paid" as OrderStatus,
}

export async function seedOrder(
  overrides: Partial<typeof DEFAULT_TEST_ORDER> & {
    id?: string
    userId?: string
    archivedAt?: Date | null
    createdAt?: Date
  } = {}
) {
  const [localPart, domain] = (
    overrides.checkoutEmail ?? DEFAULT_TEST_ORDER.checkoutEmail
  ).split("@")
  const checkoutEmail = `${localPart}+${uniqueSuffix()}@${domain}`
  const stripeSessionId = `${overrides.stripeSessionId ?? DEFAULT_TEST_ORDER.stripeSessionId}_${uniqueSuffix()}`

  const [order] = await testDb
    .insert(orders)
    .values({
      id: overrides.id,
      userId: overrides.userId,
      checkoutEmail,
      stripeSessionId,
      totalAmount: overrides.totalAmount ?? DEFAULT_TEST_ORDER.totalAmount,
      status: overrides.status ?? DEFAULT_TEST_ORDER.status,
      archivedAt: overrides.archivedAt,
      createdAt: overrides.createdAt,
    })
    .returning()

  if (!order) {
    throw new Error("Failed to seed order")
  }

  return order
}

export async function seedOrderItem(
  orderId: string,
  variantId: string,
  overrides: {
    priceAtPurchase?: number
    quantity?: number
  } = {}
) {
  const [item] = await testDb
    .insert(orderItems)
    .values({
      orderId,
      variantId,
      priceAtPurchase: overrides.priceAtPurchase ?? 2500,
      quantity: overrides.quantity ?? 1,
    })
    .returning()

  if (!item) {
    throw new Error("Failed to seed order item")
  }

  return item
}

export async function seedOrderTimelineEvent(
  orderId: string,
  status: OrderStatus,
  note?: string,
  createdAt?: Date
) {
  const [event] = await testDb
    .insert(orderTimelineEvents)
    .values({
      orderId,
      status,
      note,
      createdAt,
    })
    .returning()

  if (!event) {
    throw new Error("Failed to seed order timeline event")
  }

  return event
}

export async function seedAdminOrderNote(
  orderId: string,
  adminUserId: string,
  content: string,
  createdAt?: Date
) {
  const [note] = await testDb
    .insert(adminOrderNotes)
    .values({
      orderId,
      adminUserId,
      content,
      createdAt,
    })
    .returning()

  if (!note) {
    throw new Error("Failed to seed admin order note")
  }

  return note
}
