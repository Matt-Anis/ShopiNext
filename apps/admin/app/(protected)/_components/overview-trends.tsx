"use client"

import { Tabs } from "@base-ui/react/tabs"
import { useState } from "react"

import { Card, CardContent, CardHeader } from "@repo/ui/card"
import { cn } from "@repo/ui/utils"
import type { OrdersOverview } from "@/features/orders/queries"
import { formatPrice } from "@/lib/utils"

type DailyOrders = OrdersOverview["daily"]
type Metric = "sales" | "orders"

const metrics = [
  { value: "sales", label: "Paid sales" },
  { value: "orders", label: "Orders" },
] as const

const weekdays = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" })
const dates = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" })
const numbers = new Intl.NumberFormat("en-US")
const compactNumbers = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 })
const compactPrices = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1,
})

function TrendPlot({ daily, metric }: { daily: DailyOrders; metric: Metric }) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const format = metric === "sales" ? formatPrice : numbers.format
  const formatAxis = (value: number) => metric === "sales" ? compactPrices.format(value / 100) : compactNumbers.format(value)
  const total = daily.reduce((sum, day) => sum + day[metric], 0)
  const max = Math.max(0, ...daily.map((day) => day[metric]))
  const selected = daily.find((day) => day.day === selectedDay)

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <p className="text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">{format(total)}</p>
        <p className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
          {selected ? `${dates.format(new Date(selected.day))} · ${format(selected[metric])}` : "7-day total"}
        </p>
      </div>
      <div className="mt-6 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 sm:gap-x-4">
        <div aria-hidden="true" className="flex h-32 flex-col justify-between text-right text-[0.6875rem] leading-none tabular-nums text-muted-foreground sm:h-40 sm:text-xs">
          <span>{max > 0 ? formatAxis(max) : ""}</span>
          <span>{formatAxis(0)}</span>
        </div>
        <div className="relative grid min-w-0 grid-cols-7 gap-1 sm:gap-2">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 flex h-32 flex-col justify-between sm:h-40">
            <span className="border-t border-border/70" />
            <span className="border-t border-border/70" />
            <span className="border-t border-border" />
          </div>
          {daily.map((day, index) => {
            const date = new Date(day.day)
            const isToday = index === daily.length - 1
            const active = day.day === selectedDay
            const height = max > 0 ? (day[metric] / max) * 100 : 0
            const label = `${dates.format(date)} · ${format(day[metric])}`

            return (
              <button
                key={day.day}
                type="button"
                aria-label={label}
                aria-pressed={active}
                title={label}
                className="group/bar relative min-w-0 cursor-pointer rounded-md px-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setSelectedDay(active ? null : day.day)}
              >
                <span className="mx-auto flex h-32 max-w-14 items-end sm:h-40">
                  <span
                    className={cn(
                      "w-full rounded-t-md bg-brand/45 transition-colors group-hover/bar:bg-brand/80 motion-reduce:transition-none",
                      (active || isToday) && "bg-brand"
                    )}
                    style={{ height: `${height}%` }}
                  />
                </span>
                <span className={cn("block pt-2 pb-1 text-[0.625rem] text-muted-foreground sm:text-xs", (active || isToday) && "font-semibold text-foreground")}>
                  {isToday ? "Today" : weekdays.format(date)}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

export function OverviewTrends({ daily }: { daily: DailyOrders }) {
  return (
    <section aria-labelledby="overview-performance" className="min-w-0 lg:col-start-1 lg:row-start-2">
      <Card className="rounded-2xl border border-border bg-linear-to-br from-brand/8 via-card to-card py-0 shadow-none ring-0">
        <Tabs.Root defaultValue="sales">
          <CardHeader className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-5">
            <div>
              <h2 id="overview-performance" className="text-lg font-semibold tracking-tight">Performance</h2>
              <p className="text-xs text-muted-foreground">Last 7 days · UTC</p>
            </div>
            <Tabs.List aria-label="Performance metric" className="flex gap-0.5 rounded-xl border border-border bg-muted/70 p-0.5">
              {metrics.map(({ value, label }) => (
                <Tabs.Tab
                  key={value}
                  value={value}
                  className="min-h-9 rounded-lg px-2.5 text-xs font-medium whitespace-nowrap text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring data-active:bg-card data-active:text-foreground data-active:shadow-sm sm:px-3"
                >
                  {label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </CardHeader>
          <CardContent className="px-4 pt-4 pb-4 sm:px-6 sm:pb-5">
            {metrics.map(({ value }) => (
              <Tabs.Panel key={value} value={value} className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <TrendPlot daily={daily} metric={value} />
              </Tabs.Panel>
            ))}
          </CardContent>
        </Tabs.Root>
      </Card>
    </section>
  )
}
