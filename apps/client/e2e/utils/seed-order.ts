import { randomUUID } from "node:crypto"
import {
  orders,
  orderItems,
  orderTimelineEvents,
  type OrderStatus,
} from "@repo/db/public/schema"
import { adminUser } from "@repo/db/admin/auth-schema"
import { adminOrderNotes } from "@repo/db/admin/schema"
import { testDb } from "./db"
import { uniqueSuffix } from "./unique"

export async function seedOrder(
  overrides: {
    userId?: string | null
    checkoutEmail?: string
    totalAmount?: number
    status?: OrderStatus
    archivedAt?: Date | null
    createdAt?: Date
  } = {}
) {
  const [order] = await testDb
    .insert(orders)
    .values({
      userId: overrides.userId,
      checkoutEmail:
        overrides.checkoutEmail ?? `orders.${uniqueSuffix()}@example.com`,
      stripeSessionId: `cs_test_orders_${uniqueSuffix()}`,
      totalAmount: overrides.totalAmount ?? 5000,
      status: overrides.status ?? "paid",
      archivedAt: overrides.archivedAt,
      createdAt: overrides.createdAt,
    })
    .returning()

  return order
}

export async function seedOrderItem(
  orderId: string,
  variantId: string,
  overrides: { priceAtPurchase?: number; quantity?: number } = {}
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

  return item
}

export async function seedOrderTimelineEvent(
  orderId: string,
  status: OrderStatus,
  note: string,
  createdAt: Date
) {
  const [event] = await testDb
    .insert(orderTimelineEvents)
    .values({ orderId, status, note: `${note} ${uniqueSuffix()}`, createdAt })
    .returning()

  return event
}

export async function seedOrderStaffNote(orderId: string) {
  const suffix = uniqueSuffix()
  const [author] = await testDb
    .insert(adminUser)
    .values({
      id: randomUUID(),
      name: `Orders staff ${suffix}`,
      email: `orders-staff.${suffix}@example.com`,
      emailVerified: true,
      role: "staff",
    })
    .returning()

  const [note] = await testDb
    .insert(adminOrderNotes)
    .values({
      orderId,
      adminUserId: author.id,
      content: `Private orders packing instruction ${uniqueSuffix()}`,
    })
    .returning()

  return note
}
