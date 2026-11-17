import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import type { Category } from "@/features/categories/queries"

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group block border-b border-border px-4 py-7 transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none sm:px-6 sm:py-10"
    >
      <div
        data-testid={`category-card-${category.slug}`}
        className="flex items-center justify-between gap-6"
      >
        <div className="min-w-0">
          <h2 className="font-heading text-3xl leading-tight font-bold tracking-[-0.04em] wrap-anywhere sm:text-4xl lg:text-5xl">
            {category.name}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground group-hover:text-primary-foreground/80 sm:text-base">
            {category.description || "Explore products in this collection."}
          </p>
          <span className="mt-5 inline-block font-mono text-xs tracking-wider uppercase">
            Browse products
          </span>
        </div>
        <ArrowUpRight
          aria-hidden="true"
          className="size-8 shrink-0 motion-safe:transition-transform motion-safe:group-hover:translate-x-1 motion-safe:group-hover:-translate-y-1 sm:size-12"
        />
      </div>
    </Link>
  )
}
