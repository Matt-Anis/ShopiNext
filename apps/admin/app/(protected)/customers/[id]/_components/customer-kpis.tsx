import { formatPrice } from "@/lib/utils"

interface CustomerKpisProps {
  metrics: {
    totalSpent: number
    totalOrders: number
    averageOrderValue: number
  }
}

export function CustomerKpis({ metrics }: CustomerKpisProps) {
  const totals = [
    { label: "Lifetime spend", value: formatPrice(metrics.totalSpent) },
    { label: "Total orders", value: metrics.totalOrders },
    { label: "Average order value", value: formatPrice(metrics.averageOrderValue) },
  ]

  return (
    <dl className="grid divide-y divide-border rounded-xl border border-border bg-card @min-[32rem]/customer:grid-cols-3 @min-[32rem]/customer:divide-x @min-[32rem]/customer:divide-y-0">
      {totals.map(({ label, value }) => (
        <div
          key={label}
          className="flex min-w-0 items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3 @min-[32rem]/customer:flex-col @min-[32rem]/customer:px-5 @min-[32rem]/customer:py-4"
        >
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="min-w-0 text-xl font-semibold tracking-tight wrap-anywhere tabular-nums @min-[32rem]/customer:text-2xl">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
