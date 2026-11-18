import type { OrderStatus } from "@repo/db/public/schema"

export const orderViewLabels = {
  today: "Orders today",
  "paid-today": "Paid orders today",
  "to-fulfill": "Awaiting fulfillment",
} as const

export type OrderView = keyof typeof orderViewLabels

export function parseOrderView(value: string | string[] | undefined): OrderView | undefined {
  if (value === "today" || value === "paid-today" || value === "to-fulfill") {
    return value
  }
}

export const awaitingFulfillmentStatuses: OrderStatus[] = ["paid", "processing"]
export const paidOrderStatuses: OrderStatus[] = [
  ...awaitingFulfillmentStatuses,
  "shipped",
  "delivered",
]
