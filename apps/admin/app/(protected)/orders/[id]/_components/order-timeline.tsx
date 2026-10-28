import { CheckCircle2, Clock } from "lucide-react"

import { Badge } from "@repo/ui/badge"
import type { OrderStatus } from "@repo/db/public/schema"
import type { OrderDetails } from "@/features/orders/queries"

interface OrderTimelineProps {
  events: OrderDetails["timelineEvents"]
}

const statusVariantMap: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  paid: "secondary",
  processing: "secondary",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
  refunded: "outline",
}

export function OrderTimeline({ events }: OrderTimelineProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Clock className="size-4 text-muted-foreground" />
        <h2 className="text-xs font-semibold tracking-wide text-foreground uppercase">
          Timeline & Public History ({events.length})
        </h2>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No timeline events recorded yet.
        </div>
      ) : (
        <div className="relative ml-3 border-l border-border pl-6 space-y-6 py-2">
          {events.map((event) => {
            const label =
              event.status.charAt(0).toUpperCase() + event.status.slice(1)
            const variant = statusVariantMap[event.status] ?? "secondary"

            return (
              <div key={event.id} className="relative group">
                <div className="absolute -left-[31px] top-0.5 flex size-4 items-center justify-center rounded-full border border-border bg-background ring-4 ring-background">
                  <CheckCircle2 className="size-3 text-muted-foreground" />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      Status set to
                    </span>
                    <Badge variant={variant}>{label}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {event.createdAt.toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>

                  {event.note && (
                    <div className="mt-1.5 rounded-xl border border-border bg-muted/40 p-3 text-xs text-foreground leading-relaxed max-w-xl">
                      {event.note}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
