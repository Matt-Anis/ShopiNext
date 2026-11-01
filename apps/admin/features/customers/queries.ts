import { count, desc, eq, isNotNull, max, sql } from "drizzle-orm"

import { db } from "@/db"
import { user, account } from "@repo/db/public/auth-schema"
import { orders, type OrderStatus } from "@repo/db/public/schema"

export type CustomerListItem = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: Date
  providers: string[]
  totalOrders: number
  totalSpent: number
  lastOrderAt: Date | null
}

export type CustomerOrderSummary = {
  id: string
  createdAt: Date
  status: OrderStatus
  totalAmount: number
  itemCount: number
  archivedAt: Date | null
}

export type CustomerSessionItem = {
  id: string
  ipAddress: string | null
  userAgent: string | null
  expiresAt: Date
  createdAt: Date
}

export type CustomerAccountItem = {
  id: string
  providerId: string
  createdAt: Date
}

export type CustomerDetails = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: Date
  updatedAt: Date
  providers: CustomerAccountItem[]
  sessions: CustomerSessionItem[]
  orders: CustomerOrderSummary[]
  metrics: {
    totalSpent: number
    totalOrders: number
    averageOrderValue: number
  }
}

export async function getCustomersList(): Promise<CustomerListItem[]> {
  const ordersSummary = db
    .select({
      userId: orders.userId,
      totalOrders: count(orders.id).as("total_orders"),
      totalSpent:
        sql<number>`coalesce(sum(case when ${orders.status} != 'cancelled' then ${orders.totalAmount} else 0 end), 0)::int`.as(
          "total_spent"
        ),
      lastOrderAt: max(orders.createdAt).as("last_order_at"),
    })
    .from(orders)
    .where(isNotNull(orders.userId))
    .groupBy(orders.userId)
    .as("orders_summary")

  const accountsSummary = db
    .select({
      userId: account.userId,
      providers:
        sql<string[]>`array_remove(array_agg(distinct ${account.providerId}), null)`.as(
          "providers"
        ),
    })
    .from(account)
    .groupBy(account.userId)
    .as("accounts_summary")

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt,
      totalOrders: sql<number>`coalesce(${ordersSummary.totalOrders}, 0)::int`,
      totalSpent: sql<number>`coalesce(${ordersSummary.totalSpent}, 0)::int`,
      lastOrderAt: ordersSummary.lastOrderAt,
      providers: sql<string[]>`coalesce(${accountsSummary.providers}, array[]::text[])`,
    })
    .from(user)
    .leftJoin(ordersSummary, eq(ordersSummary.userId, user.id))
    .leftJoin(accountsSummary, eq(accountsSummary.userId, user.id))
    .orderBy(desc(user.createdAt))

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    emailVerified: row.emailVerified,
    image: row.image,
    createdAt: row.createdAt,
    providers: row.providers ?? [],
    totalOrders: Number(row.totalOrders) || 0,
    totalSpent: Number(row.totalSpent) || 0,
    lastOrderAt: row.lastOrderAt ?? null,
  }))
}

export async function getCustomerById(
  id: string
): Promise<CustomerDetails | null> {
  const customer = await db.query.user.findFirst({
    where: eq(user.id, id),
    columns: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
    with: {
      accounts: {
        columns: {
          id: true,
          providerId: true,
          createdAt: true,
        },
      },
      sessions: {
        columns: {
          id: true,
          ipAddress: true,
          userAgent: true,
          expiresAt: true,
          createdAt: true,
        },
        orderBy: (sessionTable, { desc: descOrder }) => [
          descOrder(sessionTable.createdAt),
        ],
      },
    },
  })

  if (!customer) {
    return null
  }

  const customerOrders = await db.query.orders.findMany({
    where: eq(orders.userId, id),
    orderBy: [desc(orders.createdAt)],
    with: {
      items: {
        columns: { quantity: true },
      },
    },
  })

  const formattedOrders: CustomerOrderSummary[] = customerOrders.map(
    (order) => ({
      id: order.id,
      createdAt: order.createdAt,
      status: order.status,
      totalAmount: order.totalAmount,
      itemCount: order.items.reduce((acc, item) => acc + item.quantity, 0),
      archivedAt: order.archivedAt,
    })
  )

  const nonCancelledOrders = formattedOrders.filter(
    (order) => order.status !== "cancelled"
  )
  const totalSpent = nonCancelledOrders.reduce(
    (acc, order) => acc + order.totalAmount,
    0
  )
  const totalOrders = formattedOrders.length
  const averageOrderValue =
    nonCancelledOrders.length > 0
      ? Math.round(totalSpent / nonCancelledOrders.length)
      : 0

  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    emailVerified: customer.emailVerified,
    image: customer.image,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    providers: customer.accounts,
    sessions: customer.sessions,
    orders: formattedOrders,
    metrics: {
      totalSpent,
      totalOrders,
      averageOrderValue,
    },
  }
}
