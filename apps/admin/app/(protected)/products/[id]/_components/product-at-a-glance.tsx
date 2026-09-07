interface Variant {
  price: number
  stock: number
}

interface ProductAtAGlanceProps {
  variants: Variant[]
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export function ProductAtAGlance({ variants }: ProductAtAGlanceProps) {
  const prices = variants.map((variant) => variant.price)
  const totalStock = variants.reduce((sum, variant) => sum + variant.stock, 0)
  const minPrice = prices.length > 0 ? Math.min(...prices) : null
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null

  const priceRange =
    minPrice === null || maxPrice === null
      ? "—"
      : minPrice === maxPrice
        ? formatPrice(minPrice)
        : `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        At a glance
      </h2>
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Price range</dt>
          <dd className="font-medium">{priceRange}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Variants</dt>
          <dd className="font-medium">{variants.length}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Total stock</dt>
          <dd className="font-medium">{totalStock}</dd>
        </div>
      </dl>
    </section>
  )
}
