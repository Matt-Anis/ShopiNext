import { and, desc, eq, isNotNull, isNull } from "drizzle-orm"

import { db } from "@/db"
import { orders, type OrderStatus } from "@repo/db/public/schema"
import { adminOrderNotes } from "@repo/db/admin/schema"

export type GetOrdersListParams = {
  isArchived?: boolean
  status?: OrderStatus
}

export type OrderListItem = {
  id: string
  createdAt: Date
  customerEmail: string
  status: OrderStatus
  totalAmount: number
  itemCount: number
  archivedAt: Date | null
}

export async function getOrdersList(
  params: GetOrdersListParams = {}
): Promise<OrderListItem[]> {
  const { isArchived = false, status } = params

  const conditions = [
    isArchived ? isNotNull(orders.archivedAt) : isNull(orders.archivedAt),
  ]

  if (status) {
    conditions.push(eq(orders.status, status))
  }

  const rows = await db.query.orders.findMany({
    where: and(...conditions),
    orderBy: [desc(orders.createdAt)],
    with: {
      items: {
        columns: { quantity: true },
      },
    },
  })

  return rows.map((order) => ({
    id: order.id,
    createdAt: order.createdAt,
    customerEmail: order.checkoutEmail,
    status: order.status,
    totalAmount: order.totalAmount,
    itemCount: order.items.reduce((acc, item) => acc + item.quantity, 0),
    archivedAt: order.archivedAt,
  }))
}

export async function getOrderById(id: string) {
  return db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: {
      items: {
        with: {
          variant: {
            columns: { id: true, sku: true, price: true },
            with: {
              product: {
                columns: { id: true, name: true, slug: true },
              },
              variantOptionValues: {
                with: {
                  optionValue: {
                    columns: { id: true, value: true },
                    with: {
                      option: {
                        columns: { id: true, name: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      timelineEvents: {
        orderBy: (event, { asc }) => [asc(event.createdAt)],
      },
    },
  })
}

export type OrderDetails = NonNullable<Awaited<ReturnType<typeof getOrderById>>>

export async function getOrderNotes(orderId: string) {
  return db.query.adminOrderNotes.findMany({
    where: eq(adminOrderNotes.orderId, orderId),
    orderBy: [desc(adminOrderNotes.createdAt)],
    with: {
      author: {
        columns: { id: true, name: true, email: true },
      },
    },
  })
}

export type OrderNoteItem = Awaited<ReturnType<typeof getOrderNotes>>[number]
