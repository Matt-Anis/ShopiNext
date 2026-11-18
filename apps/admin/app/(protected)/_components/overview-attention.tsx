import Link from "next/link"
import { ChevronRight, ClipboardList, Package, type LucideIcon } from "lucide-react"

import { lowStockProductsHref, lowStockThreshold } from "@/features/products/inventory"
import { Card, CardHeader } from "@repo/ui/card"
import { cn } from "@repo/ui/utils"

interface AttentionItem {
  label: string
  description: string
  count: number
  href: string
  icon: LucideIcon
}

export function OverviewAttention({
  awaitingFulfillment,
  lowStock,
}: {
  awaitingFulfillment: number | null
  lowStock: number | null
}) {
  const items: AttentionItem[] = []

  if (awaitingFulfillment !== null) {
    items.push({
      label: "Awaiting fulfillment",
      description: "Paid and processing orders",
      count: awaitingFulfillment,
      href: "/orders?view=to-fulfill",
      icon: ClipboardList,
    })
  }

  if (lowStock !== null) {
    items.push({
      label: "Low-stock variants",
      description: `Fewer than ${lowStockThreshold} units available`,
      count: lowStock,
      href: lowStockProductsHref,
      icon: Package,
    })
  }

  if (items.length === 0) return null

  return (
    <section
      aria-labelledby="overview-attention"
      className={cn("min-w-0", awaitingFulfillment !== null && "lg:col-start-2 lg:row-span-2 lg:row-start-1")}
    >
      <Card className="gap-0 rounded-2xl border border-brand/30 bg-linear-to-br from-brand/12 via-card to-card py-0 shadow-none ring-0">
        <CardHeader className="px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
          <h2 id="overview-attention" className="text-lg font-semibold tracking-tight">Needs attention</h2>
        </CardHeader>
        <ul className="divide-y divide-border border-t border-border">
          {items.map(({ label, description, count, href, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex min-h-16 min-w-0 items-center gap-3 px-4 py-3 outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-5"
              >
                <Icon aria-hidden="true" className="size-[1.125rem] shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{label}</span>
                  <span className="block text-xs text-muted-foreground">{description}</span>
                </span>
                <span className={cn(
                  "min-w-7 shrink-0 rounded-md px-1.5 py-1 text-center text-sm leading-none font-semibold tabular-nums",
                  count > 0 ? "bg-brand/20 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {count}
                </span>
                <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  )
}
