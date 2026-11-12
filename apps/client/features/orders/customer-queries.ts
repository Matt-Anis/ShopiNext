import "server-only"

import { and, asc, desc, eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { z } from "zod"
import { db } from "@/db"
import { requireCustomerSession } from "@/lib/require-customer-session"
import { orderItems, orders, orderTimelineEvents } from "@repo/db/public/schema"
import { CUSTOMER_ORDERS_PAGE_SIZE } from "./pagination"

const orderIdSchema = z.uuid()

export async function getCustomerOrders(requestedPage = 1) {
  const session = await requireCustomerSession()
  const ownership = eq(orders.userId, session.user.id)
  const totalOrders = await db.$count(orders, ownership)
  const totalPages = Math.max(
    1,
    Math.ceil(totalOrders / CUSTOMER_ORDERS_PAGE_SIZE)
  )
  const validPage =
    Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const page = Math.min(validPage, totalPages)

  const customerOrders = await db.query.orders.findMany({
    columns: {
      id: true,
      createdAt: true,
      status: true,
      totalAmount: true,
    },
    where: ownership,
    orderBy: [desc(orders.createdAt), desc(orders.id)],
    limit: CUSTOMER_ORDERS_PAGE_SIZE,
    offset: (page - 1) * CUSTOMER_ORDERS_PAGE_SIZE,
    with: {
      items: {
        columns: { id: true },
        orderBy: [asc(orderItems.id)],
        with: {
          variant: {
            columns: {},
            with: {
              product: {
                columns: { name: true },
              },
            },
          },
        },
      },
    },
  })

  return { orders: customerOrders, page, totalPages, totalOrders }
}

export async function getCustomerOrder(id: string) {
  const session = await requireCustomerSession()

  if (!orderIdSchema.safeParse(id).success) {
    notFound()
  }

  const order = await db.query.orders.findFirst({
    columns: {
      id: true,
      createdAt: true,
      status: true,
      totalAmount: true,
    },
    where: and(eq(orders.id, id), eq(orders.userId, session.user.id)),
    with: {
      items: {
        columns: { id: true, quantity: true, priceAtPurchase: true },
        orderBy: [asc(orderItems.id)],
        with: {
          variant: {
            columns: { isActive: true },
            with: {
              product: {
                columns: {
                  name: true,
                  slug: true,
                  isActive: true,
                  status: true,
                },
              },
              variantOptionValues: {
                columns: {},
                with: {
                  optionValue: {
                    columns: { value: true },
                    with: {
                      option: {
                        columns: { name: true },
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
        columns: { id: true, status: true, note: true, createdAt: true },
        orderBy: [
          asc(orderTimelineEvents.createdAt),
          asc(orderTimelineEvents.id),
        ],
      },
    },
  })

  if (!order) {
    notFound()
  }

  return order
}

export type CustomerOrder = Awaited<ReturnType<typeof getCustomerOrder>>
export type CustomerOrderListItem = Awaited<
  ReturnType<typeof getCustomerOrders>
>["orders"][number]
