import { Badge } from "@repo/ui/badge"
import type { OrderStatus } from "@repo/db/public/schema"

const statuses = {
  paid: { label: "Paid", variant: "secondary" },
  processing: { label: "Processing", variant: "secondary" },
  shipped: { label: "Shipped", variant: "default" },
  delivered: { label: "Delivered", variant: "default" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  refunded: { label: "Refunded", variant: "outline" },
} as const

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, variant } = statuses[status]

  return <Badge variant={variant}>{label}</Badge>
}
