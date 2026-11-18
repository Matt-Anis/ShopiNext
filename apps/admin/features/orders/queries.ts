import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, lt } from "drizzle-orm"

import { db } from "@/db"
import { orders, type OrderStatus } from "@repo/db/public/schema"
import { adminOrderNotes } from "@repo/db/admin/schema"
import { awaitingFulfillmentStatuses, paidOrderStatuses, type OrderView } from "./views"

export type GetOrdersListParams = {
  isArchived?: boolean
  status?: OrderStatus
  view?: OrderView
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

function getOrdersViewCondition(view: OrderView, now = new Date()) {
  if (view === "to-fulfill") {
    return and(isNull(orders.archivedAt), inArray(orders.status, awaitingFulfillmentStatuses))
  }

  const start = new Date(now)
  start.setUTCHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)

  return and(
    gte(orders.createdAt, start),
    lt(orders.createdAt, end),
    view === "paid-today" ? inArray(orders.status, paidOrderStatuses) : undefined
  )
}

export async function getOrdersList(
  params: GetOrdersListParams = {}
): Promise<OrderListItem[]> {
  const { isArchived = false, status, view } = params

  const conditions = [
    view
      ? getOrdersViewCondition(view)
      : isArchived ? isNotNull(orders.archivedAt) : isNull(orders.archivedAt),
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
    orderBy: [asc(adminOrderNotes.createdAt)],
    with: {
      author: {
        columns: { id: true, name: true, email: true },
      },
    },
  })
}

export type OrderNoteItem = Awaited<ReturnType<typeof getOrderNotes>>[number]
