import { Badge } from "@repo/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table"
import { cn } from "@repo/ui/utils"

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
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 className="text-xs font-medium tracking-wide text-foreground uppercase">
          Variants
        </h2>
        {options.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {options.map((option) => (
              <span key={option.id}>
                {option.name}:{" "}
                <span className="font-medium text-foreground">
                  {option.values.map((value) => value.value).join(", ")}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
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
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Max/order</TableHead>
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
                  <TableCell className="text-right">
                    {formatPrice(variant.price)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right",
                      variant.stock === 0
                        ? "text-destructive"
                        : variant.stock < 5
                          ? "text-amber-600 dark:text-amber-400"
                          : undefined
                    )}
                  >
                    {variant.stock}
                  </TableCell>
                  <TableCell className="text-right">
                    {variant.maxPerOrder}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  )
}
