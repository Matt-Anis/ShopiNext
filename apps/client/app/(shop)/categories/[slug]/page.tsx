import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, PackageOpen } from "lucide-react"
import { Button } from "@repo/ui/button"
import { getCategoryBySlug } from "@/features/categories/queries"
import { getAllProducts } from "@/features/products/queries"
import ProductList from "../../_components/ProductList"

export async function generateMetadata({
  params,
}: PageProps<"/categories/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)

  if (!category) {
    return { title: "Category Not Found | ShopiNext" }
  }

  return {
    title: `${category.name} | ShopiNext`,
    description: category.description || `Browse products in ${category.name}`,
  }
}

export default async function CategoryProductsPage({
  params,
}: PageProps<"/categories/[slug]">) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)

  if (!category) {
    notFound()
  }

  const { products, nextCursor } = await getAllProducts({
    categoryId: category.id,
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-10 md:py-12">
      <div className="mb-6">
        <Link
          href="/categories"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All categories
        </Link>
      </div>

      <header className="mb-8 border-b border-border pb-8 sm:mb-12">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {category.description}
          </p>
        )}
      </header>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <PackageOpen className="mb-3 size-10 text-muted-foreground" />
          <h2 className="font-heading text-lg font-medium text-foreground">
            No products found
          </h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            There are no products in this category right now. Check back soon!
          </p>
          <Button
            variant="outline"
            className="mt-6 rounded-full"
            render={<Link href="/categories" />}
          >
            Browse other categories
          </Button>
        </div>
      ) : (
        <ProductList
          initialProducts={products}
          initialCursor={nextCursor}
          categoryId={category.id}
          title={null}
          className="p-0"
        />
      )}
    </div>
  )
}
