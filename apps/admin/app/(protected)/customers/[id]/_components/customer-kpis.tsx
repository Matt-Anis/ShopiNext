import { DollarSign, ShoppingBag, TrendingUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { formatPrice } from "@/lib/utils"

interface CustomerKpisProps {
  metrics: {
    totalSpent: number
    totalOrders: number
    averageOrderValue: number
  }
}

export function CustomerKpis({ metrics }: CustomerKpisProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Lifetime Spend
          </CardTitle>
          <DollarSign className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatPrice(metrics.totalSpent)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Total Orders
          </CardTitle>
          <ShoppingBag className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalOrders}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Average Order Value
          </CardTitle>
          <TrendingUp className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatPrice(metrics.averageOrderValue)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
