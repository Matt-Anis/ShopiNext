import type { Metadata } from "next"
import Link from "next/link"
import { FolderOpen } from "lucide-react"
import { buttonVariants } from "@repo/ui/button"
import { getActiveCategories } from "@/features/categories/queries"
import { CategoryCard } from "./_components/CategoryCard"

export const metadata: Metadata = {
  title: "Categories | ShopiNext",
  description: "Browse products by category",
}

export default async function CategoriesPage() {
  const categories = await getActiveCategories()

  return (
    <div className="storefront-container py-12 md:py-20">
      <header className="mb-8 sm:mb-12">
        <p className="mb-5 font-mono text-xs tracking-wider text-muted-foreground uppercase">
          Explore the collection
        </p>
        <h1 className="page-heading">Categories</h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Explore our collections and browse products by category.
        </p>
      </header>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-6 py-20 text-center">
          <FolderOpen className="mb-3 size-10 text-muted-foreground" />
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            No categories available
          </h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            There are currently no active categories to browse. Check back soon!
          </p>
          <Link
            href="/"
            className={buttonVariants({
              variant: "outline",
              className: "mt-6",
            })}
          >
            Return to shop
          </Link>
        </div>
      ) : (
        <div className="border-t border-border">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  )
}
