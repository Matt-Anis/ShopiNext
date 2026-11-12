import Link from "next/link"
import { Badge } from "@repo/ui/badge"
import type { CustomerOrder } from "@/features/orders/customer-queries"

export function OrderProductSummary({
  variant,
}: {
  variant: CustomerOrder["items"][number]["variant"]
}) {
  const { product } = variant
  const isAvailable =
    variant.isActive && product.isActive && product.status === "active"
  const optionsSummary = variant.variantOptionValues
    .map(
      ({ optionValue }) => `${optionValue.option.name}: ${optionValue.value}`
    )
    .join(", ")

  return (
    <div className="space-y-1">
      {isAvailable ? (
        <Link
          href={`/products/${product.slug}`}
          className="font-medium underline-offset-4 hover:underline"
        >
          {product.name}
        </Link>
      ) : (
        <p className="font-medium">{product.name}</p>
      )}
      {optionsSummary && (
        <p className="text-sm text-muted-foreground">{optionsSummary}</p>
      )}
      {!isAvailable && <Badge variant="outline">No longer available</Badge>}
    </div>
  )
}
