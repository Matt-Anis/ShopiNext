import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getCategoryBySlug } from "@/features/categories/queries"
import { getAllProducts } from "@/features/products/queries"
import ProductCatalog from "../../_components/ProductCatalog"
import { parseProductDiscovery } from "@/features/products/discovery"
import { ProductEmptyState } from "@/features/products/components/product-empty-state"

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
  searchParams,
}: PageProps<"/categories/[slug]">) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)

  if (!category) {
    notFound()
  }

  const discovery = parseProductDiscovery(await searchParams)
  const { products, nextCursor } = await getAllProducts({
    ...discovery,
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

      <ProductCatalog
        initialProducts={products}
        initialCursor={nextCursor}
        discovery={discovery}
        categoryId={category.id}
        emptyState={
          <ProductEmptyState
            discovery={discovery}
            pathname={`/categories/${category.slug}`}
            category
          />
        }
      />
    </div>
  )
}
