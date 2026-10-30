import Link from "next/link"
import { ExternalLink, Package } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table"
import { formatPrice } from "@/lib/utils"
import type { OrderDetails } from "@/features/orders/queries"

interface OrderItemsCardProps {
  items: OrderDetails["items"]
  totalAmount: number
}

export function OrderItemsCard({ items, totalAmount }: OrderItemsCardProps) {
  const subtotal = items.reduce(
    (acc, item) => acc + item.priceAtPurchase * item.quantity,
    0
  )
  const shippingAndFees = Math.max(0, totalAmount - subtotal)

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Package className="size-4 text-muted-foreground" />
        <h2 className="text-xs font-semibold tracking-wide text-foreground uppercase">
          Items Ordered ({items.reduce((acc, item) => acc + item.quantity, 0)})
        </h2>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const optionsSummary = item.variant.variantOptionValues
                .map(
                  (vov) =>
                    `${vov.optionValue.option.name}: ${vov.optionValue.value}`
                )
                .join(", ")

              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <Link
                        href={`/products/${item.variant.product.id}`}
                        className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
                      >
                        {item.variant.product.name}
                        <ExternalLink className="size-3 text-muted-foreground" />
                      </Link>
                      {optionsSummary ? (
                        <span className="text-xs text-muted-foreground">
                          {optionsSummary}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Default variant
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">
                      {item.variant.sku}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPrice(item.priceAtPurchase)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-foreground">
                    {formatPrice(item.priceAtPurchase * item.quantity)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        <div className="border-t border-border bg-muted/20 p-4">
          <div className="flex flex-col gap-2 max-w-xs ml-auto text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-medium text-foreground">
                {formatPrice(subtotal)}
              </span>
            </div>
            {shippingAndFees > 0 && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Shipping & Taxes</span>
                <span className="font-medium text-foreground">
                  {formatPrice(shippingAndFees)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
              <span>Total</span>
              <span>{formatPrice(totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
