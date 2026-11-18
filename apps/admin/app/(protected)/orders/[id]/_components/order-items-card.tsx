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

      <div className="overflow-hidden rounded-xl border border-border">
        <Table role="table" aria-label="Order items" className="max-lg:admin-stacked-table">
          <TableHeader className="max-lg:sr-only">
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody role="rowgroup">
            {items.map((item) => {
              const optionsSummary = item.variant.variantOptionValues
                .map(
                  (vov) =>
                    `${vov.optionValue.option.name}: ${vov.optionValue.value}`
                )
                .join(", ")

              return (
                <TableRow key={item.id} role="row">
                  <TableCell role="cell" className="whitespace-normal">
                    <div className="flex flex-col gap-0.5">
                      <Link
                        href={`/products/${item.variant.product.id}`}
                        className="inline-flex items-baseline gap-1 font-medium wrap-anywhere text-foreground hover:underline"
                      >
                        <span>{item.variant.product.name}</span>
                        <ExternalLink aria-hidden="true" className="size-3 shrink-0 self-center text-muted-foreground" />
                      </Link>
                      {optionsSummary ? (
                        <span className="text-xs wrap-anywhere text-muted-foreground">
                          {optionsSummary}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Default variant
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell role="cell" className="max-lg:col-span-2">
                    <span aria-hidden="true" className="mb-1 block text-xs text-muted-foreground lg:hidden">SKU</span>
                    <span className="font-mono text-xs wrap-anywhere text-muted-foreground">
                      {item.variant.sku}
                    </span>
                  </TableCell>
                  <TableCell role="cell" className="tabular-nums lg:text-right">
                    <span aria-hidden="true" className="mb-1 block text-xs text-muted-foreground lg:hidden">Unit price</span>
                    {formatPrice(item.priceAtPurchase)}
                  </TableCell>
                  <TableCell role="cell" className="font-medium tabular-nums lg:text-right">
                    <span aria-hidden="true" className="mb-1 block text-xs font-normal text-muted-foreground lg:hidden">Quantity</span>
                    {item.quantity}
                  </TableCell>
                  <TableCell role="cell" className="font-semibold text-foreground tabular-nums max-lg:flex max-lg:items-center max-lg:justify-between lg:text-right">
                    <span aria-hidden="true" className="text-xs font-normal text-muted-foreground lg:hidden">Line total</span>
                    {formatPrice(item.priceAtPurchase * item.quantity)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        <div className="border-t border-border bg-muted/20 p-4">
          <div className="ml-auto flex max-w-xs flex-col gap-2 text-sm tabular-nums">
            <div className="flex items-center justify-between gap-2 text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-medium text-foreground">
                {formatPrice(subtotal)}
              </span>
            </div>
            {shippingAndFees > 0 && (
              <div className="flex items-center justify-between gap-2 text-muted-foreground">
                <span>Shipping & Taxes</span>
                <span className="font-medium text-foreground">
                  {formatPrice(shippingAndFees)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between gap-2 border-t border-border pt-2 text-base font-semibold text-foreground">
              <span>Total</span>
              <span>{formatPrice(totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
