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
    <div className="storefront-container py-10 md:py-16">
      <div className="mb-6">
        <Link
          href="/categories"
          className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" />
          All categories
        </Link>
      </div>

      <header className="mb-8 border-b border-border pb-8 sm:mb-12">
        <h1 className="page-heading wrap-anywhere">{category.name}</h1>
        {category.description && (
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
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
