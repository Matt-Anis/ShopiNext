import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { lowStockThreshold } from "@/features/products/inventory"
import type { LowStockVariant } from "@/features/products/queries"
import { Badge } from "@repo/ui/badge"
import { Button } from "@repo/ui/button"
import { Card } from "@repo/ui/card"

export function LowStockVariants({ variants }: { variants: LowStockVariant[] }) {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-5 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Low-stock variants</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Published variants with fewer than {lowStockThreshold} units available
          </p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/products" />}>
          All products
        </Button>
      </div>
      <Card className="rounded-2xl border border-border py-0 shadow-none ring-0">
        {variants.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No published variants are low on stock.</p>
        ) : (
          <ul className="divide-y divide-border">
            {variants.map((variant) => (
              <li key={variant.id}>
                <Link
                  href={`/products/${variant.productId}#product-variants`}
                  className="flex min-h-16 min-w-0 items-center gap-3 px-4 py-3 outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium wrap-anywhere">{variant.productName}</span>
                    <span className="block text-xs wrap-anywhere text-muted-foreground">{variant.sku}</span>
                  </span>
                  <Badge variant={variant.stock === 0 ? "destructive" : "secondary"} className="shrink-0 tabular-nums">
                    {variant.stock === 0 ? "Out of stock" : `${variant.stock} left`}
                  </Badge>
                  <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
