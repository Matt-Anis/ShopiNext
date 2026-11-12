import { Card, CardContent, CardHeader } from "@repo/ui/card"
import type { CustomerOrder } from "@/features/orders/customer-queries"
import { formatOrderDateTime } from "@/features/orders/format"
import { OrderStatusBadge } from "../../_components/order-status-badge"

export function OrderTimeline({
  events,
}: {
  events: CustomerOrder["timelineEvents"]
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-heading text-xl font-semibold">Status history</h2>
      </CardHeader>
      <CardContent>
        <ol className="space-y-5" aria-label="Public order status history">
          {events.map((event) => (
            <li
              key={event.id}
              className="border-l-2 border-border pl-4"
              data-testid="order-timeline-event"
            >
              <div className="flex flex-wrap items-center gap-3">
                <OrderStatusBadge status={event.status} />
                <time
                  dateTime={event.createdAt.toISOString()}
                  className="text-sm text-muted-foreground"
                >
                  {formatOrderDateTime(event.createdAt)}
                </time>
              </div>
              {event.note && (
                <p className="mt-2 text-sm break-words whitespace-pre-wrap">
                  {event.note}
                </p>
              )}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
