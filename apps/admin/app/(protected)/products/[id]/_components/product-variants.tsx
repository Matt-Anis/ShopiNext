import { Badge } from "@repo/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table"

interface OptionValue {
  id: string
  value: string
}

interface Option {
  id: string
  name: string
  values: OptionValue[]
}

interface Variant {
  id: string
  sku: string
  price: number
  stock: number
  maxPerOrder: number
  variantOptionValues: { optionValue: OptionValue }[]
}

interface ProductVariantsProps {
  options: Option[]
  variants: Variant[]
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export function ProductVariants({ options, variants }: ProductVariantsProps) {
  return (
    <section>
      <h2 className="text-sm font-medium text-foreground/80">Variants</h2>
      {variants.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          This product has no variants yet.
        </p>
      ) : (
        <div className="mt-3 rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{options.length > 0 ? "Options" : ""}</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Max per order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant) => (
                <TableRow key={variant.id}>
                  <TableCell>
                    {variant.variantOptionValues.length === 0 ? (
                      <span className="text-sm text-muted-foreground">
                        No options
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {variant.variantOptionValues.map(({ optionValue }) => (
                          <Badge key={optionValue.id} variant="secondary">
                            {optionValue.value}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {variant.sku}
                  </TableCell>
                  <TableCell>{formatPrice(variant.price)}</TableCell>
                  <TableCell>{variant.stock}</TableCell>
                  <TableCell>{variant.maxPerOrder}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  )
}
