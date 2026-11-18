import Link from "next/link"
import { ArrowUpRight, CalendarDays, PackageCheck, Wallet } from "lucide-react"

import type { OrdersOverview } from "@/features/orders/queries"
import { formatPrice } from "@/lib/utils"

export function OverviewMetrics({ orders }: { orders: OrdersOverview }) {
  const metrics = [
    { label: "Orders placed", value: orders.ordersToday, icon: CalendarDays, href: "/orders?view=today" },
    { label: "Paid sales", value: formatPrice(orders.salesToday), icon: Wallet, href: "/orders?view=paid-today" },
    { label: "To fulfill", value: orders.awaitingFulfillment, icon: PackageCheck, href: "/orders?view=to-fulfill", note: "Across all dates" },
  ]

  return (
    <section aria-labelledby="overview-today" className="min-w-0 lg:col-start-1 lg:row-start-1">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="overview-today" className="text-lg font-semibold tracking-tight">Today</h2>
        <span className="text-xs text-muted-foreground">UTC</span>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {metrics.map(({ label, value, icon: Icon, href, note }) => (
          <li key={href} className="min-w-0 last:col-span-2 sm:last:col-span-1">
            <Link
              href={href}
              className="group/metric flex h-full min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card p-3 text-card-foreground outline-none transition-colors hover:border-brand/60 focus-visible:ring-2 focus-visible:ring-ring sm:p-4"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand/15 text-primary">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground group-hover/metric:text-primary" />
              </span>
              <span className="space-y-1">
                <span className="block text-sm text-muted-foreground">{label}</span>
                <span className="block text-2xl leading-none font-semibold tracking-tight wrap-anywhere tabular-nums sm:text-3xl">{value}</span>
                {note && <span className="block text-xs text-muted-foreground">{note}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
