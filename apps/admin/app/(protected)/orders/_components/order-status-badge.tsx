import type { OrderStatus } from "@repo/db/public/schema"
import { Badge } from "@repo/ui/badge"

const statusStyles: Record<OrderStatus, string> = {
  paid: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
  processing: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
  shipped: "border-teal-200 bg-teal-50 text-teal-900 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-200",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  cancelled: "",
  refunded: "bg-muted text-muted-foreground",
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={status === "cancelled" ? "destructive" : "outline"} className={statusStyles[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}
