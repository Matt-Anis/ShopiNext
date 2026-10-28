import { randomUUID } from "node:crypto"
import { db } from "../client"
import {
  orders,
  orderItems,
  orderTimelineEvents,
  type OrderStatus,
} from "@repo/db/public/schema"
import { adminOrderNotes } from "@repo/db/admin/schema"
import type { SeededVariant } from "./products"
import type { SeededCustomer } from "./customers"

interface OrderSeedScenario {
  customerEmail: string
  userId?: string
  status: OrderStatus
  isArchived?: boolean
  itemIndices: number[]
  timeline: { status: OrderStatus; note?: string; offsetHours: number }[]
  notes: string[]
}

interface SeedOrdersParams {
  variants: SeededVariant[]
  customers: SeededCustomer[]
  adminUserId: string
}

export async function seedOrders({
  variants,
  customers,
  adminUserId,
}: SeedOrdersParams) {
  console.log("Seeding orders, items, timeline events, and staff notes...")

  const ordersSeedConfig: OrderSeedScenario[] = [
    {
      customerEmail: "alice@example.com",
      userId: customers[0]?.id,
      status: "paid",
      itemIndices: [0, 2],
      timeline: [
        { status: "paid", note: "Order placed and payment confirmed via Stripe", offsetHours: 2 },
      ],
      notes: [],
    },
    {
      customerEmail: "bob@example.com",
      userId: customers[1]?.id,
      status: "processing",
      itemIndices: [1],
      timeline: [
        { status: "paid", note: "Payment authorized", offsetHours: 24 },
        { status: "processing", note: "Sent to fulfillment center for packing", offsetHours: 18 },
      ],
      notes: ["Customer requested gift receipt and discreet shipping."],
    },
    {
      customerEmail: "carol@example.com",
      userId: customers[2]?.id,
      status: "shipped",
      itemIndices: [3, 4],
      timeline: [
        { status: "paid", note: "Payment processed", offsetHours: 48 },
        { status: "processing", note: "Packed at Seattle warehouse", offsetHours: 36 },
        { status: "shipped", note: "Dispatched via FedEx Express (tracking #FX-918237462)", offsetHours: 12 },
      ],
      notes: [
        "Carrier label generated via automated batch.",
        "Verified delivery address with customer via phone.",
      ],
    },
    {
      customerEmail: "david@example.com",
      userId: customers[3]?.id,
      status: "delivered",
      itemIndices: [5],
      timeline: [
        { status: "paid", note: "Order paid", offsetHours: 96 },
        { status: "processing", note: "Processing order", offsetHours: 84 },
        { status: "shipped", note: "Shipped via UPS Ground", offsetHours: 60 },
        { status: "delivered", note: "Delivered to front porch by carrier", offsetHours: 12 },
      ],
      notes: ["Signed confirmation on file."],
    },
    {
      customerEmail: "emma@example.com",
      userId: customers[4]?.id,
      status: "cancelled",
      itemIndices: [6, 7],
      timeline: [
        { status: "paid", note: "Order submitted", offsetHours: 30 },
        { status: "cancelled", note: "Order cancelled per customer request before shipment", offsetHours: 20 },
      ],
      notes: ["Customer changed their mind; voided pre-authorization."],
    },
    {
      customerEmail: "guest.shopper@gmail.com",
      status: "paid",
      itemIndices: [8],
      timeline: [
        { status: "paid", note: "Guest checkout order confirmed", offsetHours: 4 },
      ],
      notes: ["Guest order: no registered account."],
    },
    {
      customerEmail: "alice@example.com",
      userId: customers[0]?.id,
      status: "refunded",
      itemIndices: [9],
      timeline: [
        { status: "paid", note: "Order paid", offsetHours: 168 },
        { status: "shipped", note: "Shipped", offsetHours: 140 },
        { status: "delivered", note: "Delivered", offsetHours: 90 },
        { status: "refunded", note: "Full refund issued following return inspection", offsetHours: 10 },
      ],
      notes: ["Item returned in original packaging. Restocked."],
    },
    {
      customerEmail: "bob@example.com",
      userId: customers[1]?.id,
      status: "delivered",
      isArchived: true,
      itemIndices: [10, 11],
      timeline: [
        { status: "paid", note: "Order paid", offsetHours: 300 },
        { status: "shipped", note: "Shipped via DHL", offsetHours: 280 },
        { status: "delivered", note: "Delivered to recipient", offsetHours: 240 },
      ],
      notes: ["Archived after 30 days of inactivity."],
    },
    {
      customerEmail: "mark.taylor@outlook.com",
      status: "cancelled",
      isArchived: true,
      itemIndices: [12],
      timeline: [
        { status: "paid", note: "Order initiated", offsetHours: 400 },
        { status: "cancelled", note: "Suspected fraudulent billing address; auto-cancelled", offsetHours: 395 },
      ],
      notes: ["High fraud score flagged by Stripe Radar. Archived."],
    },
  ]

  const now = Date.now()

  for (const cfg of ordersSeedConfig) {
    const orderId = randomUUID()
    const selectedVariants = cfg.itemIndices
      .map((idx) => variants[idx % variants.length])
      .filter((v): v is NonNullable<typeof v> => Boolean(v))

    const totalAmount = selectedVariants.reduce((sum, v) => sum + v.price, 0)
    const orderCreatedAt = new Date(now - (cfg.timeline[0]?.offsetHours ?? 1) * 3600000)

    await db.insert(orders).values({
      id: orderId,
      userId: cfg.userId ?? null,
      checkoutEmail: cfg.customerEmail,
      stripeSessionId: `cs_test_${randomUUID().replace(/-/g, "")}`,
      totalAmount,
      status: cfg.status,
      archivedAt: cfg.isArchived ? new Date(now - 86400000) : null,
      createdAt: orderCreatedAt,
      updatedAt: orderCreatedAt,
    })

    for (const v of selectedVariants) {
      await db.insert(orderItems).values({
        id: randomUUID(),
        orderId,
        variantId: v.id,
        priceAtPurchase: v.price,
        quantity: 1,
      })
    }

    for (const event of cfg.timeline) {
      await db.insert(orderTimelineEvents).values({
        id: randomUUID(),
        orderId,
        status: event.status,
        note: event.note ?? null,
        createdAt: new Date(now - event.offsetHours * 3600000),
      })
    }

    for (const noteContent of cfg.notes) {
      await db.insert(adminOrderNotes).values({
        id: randomUUID(),
        orderId,
        adminUserId,
        content: noteContent,
        createdAt: new Date(now - 1800000),
      })
    }
  }

  console.log(`Seeded ${ordersSeedConfig.length} orders.`)
}
