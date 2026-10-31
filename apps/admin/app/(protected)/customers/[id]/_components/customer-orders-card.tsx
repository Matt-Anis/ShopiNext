import Link from "next/link"
import { ExternalLink, ShoppingBag } from "lucide-react"

import { Badge } from "@repo/ui/badge"
import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table"
import { formatPrice } from "@/lib/utils"
import type { CustomerOrderSummary } from "@/features/customers/queries"
import type { OrderStatus } from "@repo/db/public/schema"

interface CustomerOrdersCardProps {
  orders: CustomerOrderSummary[]
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

export function CustomerOrdersCard({ orders }: CustomerOrdersCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="size-4 text-muted-foreground" />
          <CardTitle className="text-sm font-semibold">Order History</CardTitle>
        </div>
        <Badge variant="outline" className="text-xs">
          {orders.length} {orders.length === 1 ? "order" : "orders"}
        </Badge>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShoppingBag className="mb-2 size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">
              No orders yet
            </p>
            <p className="text-xs text-muted-foreground">
              Orders placed by this customer will appear here.
            </p>
          </div>
        ) : (
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Order</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[44px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const statusLabel =
                    order.status.charAt(0).toUpperCase() +
                    order.status.slice(1)
                  const variant =
                    statusVariantMap[order.status] ?? "secondary"

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs font-medium">
                        {order.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {order.createdAt.toLocaleDateString(undefined, {
                          dateStyle: "medium",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={variant} className="text-xs">
                          {statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {order.itemCount}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        {formatPrice(order.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          nativeButton={false}
                          render={<Link href={`/orders/${order.id}`} />}
                        >
                          <ExternalLink className="size-3.5" />
                          <span className="sr-only">Open order</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
