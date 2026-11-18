import { and, asc, count, desc, eq, gte, inArray, isNotNull, isNull, lt, sql, sum } from "drizzle-orm"

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

function startOfOrderDay(now: Date) {
  const day = new Date(now)
  day.setUTCHours(0, 0, 0, 0)
  return day
}

function offsetOrderDay(day: Date, offset: number) {
  const result = new Date(day)
  result.setUTCDate(result.getUTCDate() + offset)
  return result
}

function getOrdersViewCondition(view: OrderView, now = new Date()) {
  if (view === "to-fulfill") {
    return and(isNull(orders.archivedAt), inArray(orders.status, awaitingFulfillmentStatuses))
  }

  const start = startOfOrderDay(now)

  return and(
    gte(orders.createdAt, start),
    lt(orders.createdAt, offsetOrderDay(start, 1)),
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

export async function getOrdersOverview(now: Date) {
  const days = 7
  const today = startOfOrderDay(now)
  const firstDay = offsetOrderDay(today, 1 - days)
  const orderDay = sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`
  const [dailyTotals, awaitingFulfillment, recent] = await Promise.all([
    db
      .select({ day: orderDay, status: orders.status, orders: count(), total: sum(orders.totalAmount) })
      .from(orders)
      .where(and(gte(orders.createdAt, firstDay), lt(orders.createdAt, offsetOrderDay(today, 1))))
      .groupBy(orderDay, orders.status),
    db.$count(orders, getOrdersViewCondition("to-fulfill", now)),
    db
      .select({
        id: orders.id,
        customerEmail: orders.checkoutEmail,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(isNull(orders.archivedAt))
      .orderBy(desc(orders.createdAt), desc(orders.id))
      .limit(5),
  ])

  const daily = Array.from({ length: days }, (_, index) => ({
    day: offsetOrderDay(firstDay, index).toISOString().slice(0, 10),
    orders: 0,
    sales: 0,
  }))
  const totalsByDay = new Map(daily.map((entry) => [entry.day, entry]))

  for (const row of dailyTotals) {
    const entry = totalsByDay.get(row.day)
    if (!entry) continue
    entry.orders += row.orders
    if (paidOrderStatuses.includes(row.status)) entry.sales += Number(row.total)
  }

  return {
    ordersToday: daily[days - 1].orders,
    salesToday: daily[days - 1].sales,
    daily,
    awaitingFulfillment,
    recent,
  }
}

export type OrdersOverview = Awaited<ReturnType<typeof getOrdersOverview>>

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
