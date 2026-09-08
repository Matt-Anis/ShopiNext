import { Badge } from "@repo/ui/badge"

interface Category {
  id: string
  name: string
}

interface ProductCategoriesProps {
  categories: Category[]
}

export function ProductCategories({ categories }: ProductCategoriesProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-medium tracking-wide text-foreground uppercase">
        Categories
      </h2>
      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Not assigned to any categories.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge key={category.id} variant="secondary">
              {category.name}
            </Badge>
          ))}
        </div>
      )}
    </section>
  )
}
