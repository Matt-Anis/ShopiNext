import type { Metadata } from "next"
import Link from "next/link"
import { FolderOpen } from "lucide-react"
import { Button } from "@repo/ui/button"
import { getActiveCategories } from "@/features/categories/queries"
import { CategoryCard } from "./_components/CategoryCard"

export const metadata: Metadata = {
  title: "Categories | ShopiNext",
  description: "Browse products by category",
}

export default async function CategoriesPage() {
  const categories = await getActiveCategories()

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:px-10 md:py-16">
      <header className="mb-8 sm:mb-12">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          Categories
        </h1>
        <p className="mt-2 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Explore our collections and browse products by category.
        </p>
      </header>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <FolderOpen className="mb-3 size-10 text-muted-foreground" />
          <h2 className="font-heading text-lg font-medium text-foreground">
            No categories available
          </h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            There are currently no active categories to browse. Check back soon!
          </p>
          <Button
            variant="outline"
            className="mt-6 rounded-full"
            render={<Link href="/" />}
          >
            Return to shop
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  )
}
