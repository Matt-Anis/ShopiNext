"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { requireSession } from "@/lib/session"
import {
  orders,
  orderTimelineEvents,
  type OrderStatus,
} from "@repo/db/public/schema"
import { adminOrderNotes } from "@repo/db/admin/schema"

export async function archiveOrder(orderId: string) {
  await requireSession()

  await db
    .update(orders)
    .set({ archivedAt: new Date() })
    .where(eq(orders.id, orderId))

  revalidatePath("/orders")
  revalidatePath("/orders/archived")
  revalidatePath(`/orders/${orderId}`)
}

export async function unarchiveOrder(orderId: string) {
  await requireSession()

  await db
    .update(orders)
    .set({ archivedAt: null })
    .where(eq(orders.id, orderId))

  revalidatePath("/orders")
  revalidatePath("/orders/archived")
  revalidatePath(`/orders/${orderId}`)
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  publicNote?: string
) {
  await requireSession()

  await db.transaction(async (tx) => {
    await tx.update(orders).set({ status }).where(eq(orders.id, orderId))

    await tx.insert(orderTimelineEvents).values({
      orderId,
      status,
      note: publicNote?.trim() || null,
    })
  })

  revalidatePath("/orders")
  revalidatePath("/orders/archived")
  revalidatePath(`/orders/${orderId}`)
}

export async function addStaffNote(orderId: string, content: string) {
  const session = await requireSession()

  const trimmed = content.trim()
  if (!trimmed) {
    throw new Error("Note content cannot be empty")
  }

  await db.insert(adminOrderNotes).values({
    orderId,
    adminUserId: session.user.id,
    content: trimmed,
  })

  revalidatePath(`/orders/${orderId}`)
}
