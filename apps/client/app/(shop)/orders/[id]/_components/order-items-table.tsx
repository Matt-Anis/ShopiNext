import { Card, CardContent, CardHeader } from "@repo/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table"
import type { CustomerOrder } from "@/features/orders/customer-queries"
import { formatPrice } from "@/lib/utils"
import { OrderProductSummary } from "./order-product-summary"

export function OrderItemsTable({
  items,
  totalAmount,
}: {
  items: CustomerOrder["items"]
  totalAmount: number
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-heading text-xl font-semibold">Purchased items</h2>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Unit price paid</TableHead>
              <TableHead className="text-right">Line total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} data-testid="order-item">
                <TableCell className="min-w-48 whitespace-normal">
                  <OrderProductSummary variant={item.variant} />
                </TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">
                  {formatPrice(item.priceAtPurchase)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatPrice(item.priceAtPurchase * item.quantity)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <dl className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-5 text-lg font-semibold">
          <dt>Total paid</dt>
          <dd data-testid="order-total">{formatPrice(totalAmount)}</dd>
        </dl>
      </CardContent>
    </Card>
  )
}
