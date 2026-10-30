"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { requireSession } from "@/lib/session"
import { sendOrderStatusEmail } from "@/lib/email"
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
  publicNote?: string,
  notifyCustomer: boolean = true
) {
  await requireSession()

  const trimmedNote = publicNote?.trim() || null

  const updatedOrder = await db.transaction(async (tx) => {
    const [order] = await tx
      .update(orders)
      .set({ status })
      .where(eq(orders.id, orderId))
      .returning({
        id: orders.id,
        checkoutEmail: orders.checkoutEmail,
      })

    await tx.insert(orderTimelineEvents).values({
      orderId,
      status,
      note: trimmedNote,
    })

    return order
  })

  if (notifyCustomer && updatedOrder?.checkoutEmail) {
    await sendOrderStatusEmail({
      to: updatedOrder.checkoutEmail,
      orderId: updatedOrder.id,
      status,
      note: trimmedNote ?? undefined,
    })
  }

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

export async function updateStaffNote(noteId: string, content: string) {
  const session = await requireSession()

  const trimmed = content.trim()
  if (!trimmed) {
    throw new Error("Note content cannot be empty")
  }

  const note = await db.query.adminOrderNotes.findFirst({
    where: eq(adminOrderNotes.id, noteId),
  })

  if (!note) {
    throw new Error("Note not found")
  }

  if (note.adminUserId !== session.user.id) {
    throw new Error("Unauthorized to edit this note")
  }

  await db
    .update(adminOrderNotes)
    .set({ content: trimmed, updatedAt: new Date() })
    .where(eq(adminOrderNotes.id, noteId))

  revalidatePath(`/orders/${note.orderId}`)
}

export async function deleteStaffNote(noteId: string) {
  const session = await requireSession()

  const note = await db.query.adminOrderNotes.findFirst({
    where: eq(adminOrderNotes.id, noteId),
  })

  if (!note) {
    throw new Error("Note not found")
  }

  if (note.adminUserId !== session.user.id) {
    throw new Error("Unauthorized to delete this note")
  }

  await db.delete(adminOrderNotes).where(eq(adminOrderNotes.id, noteId))

  revalidatePath(`/orders/${note.orderId}`)
}
