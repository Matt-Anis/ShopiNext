import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card"
import type { Category } from "@/features/categories/queries"

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-3xl"
    >
      <Card
        data-testid={`category-card-${category.slug}`}
        className="h-full rounded-3xl border border-border bg-card p-6 shadow-none ring-0 transition-colors group-hover:bg-muted/50 group-hover:border-foreground/20 flex flex-col justify-between"
      >
        <CardHeader className="p-0 gap-2">
          <CardTitle className="font-heading text-xl font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
            {category.name}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
            {category.description || "Explore products in this collection."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pt-4 mt-auto">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            Browse products
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </CardContent>
      </Card>
    </Link>
  )
}
