import { Badge } from "@repo/ui/badge"

interface OptionValue {
  id: string
  value: string
}

interface Option {
  id: string
  name: string
  values: OptionValue[]
}

interface ProductOptionsProps {
  options: Option[]
}

export function ProductOptions({ options }: ProductOptionsProps) {
  return (
    <section>
      <h2 className="text-sm font-medium text-foreground/80">Options</h2>
      {options.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          This product has no options.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {options.map((option) => (
            <div
              key={option.id}
              className="rounded-2xl border border-border p-4"
            >
              <span className="text-sm font-medium">{option.name}</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {option.values.map((value) => (
                  <Badge key={value.id} variant="secondary">
                    {value.value}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
