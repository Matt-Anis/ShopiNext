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
    <section>
      <h2 className="text-sm font-medium text-foreground/80">Categories</h2>
      {categories.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          This product isn&apos;t assigned to any categories.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
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
