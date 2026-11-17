import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Badge } from "@repo/ui/badge"
import { Markdown } from "@repo/ui/markdown"
import { Skeleton } from "@repo/ui/skeleton"
import { fetchProductBySlug } from "@/features/products/actions"
import {
  VariantAddToCart,
  VariantBuyNow,
  VariantOptionPills,
  VariantPickerProvider,
  VariantPrice,
} from "./VariantPicker"
import ProductGallery, { ProductGallerySkeleton } from "./ProductGallery"
import RelatedProducts from "./RelatedProducts"

export default async function ProductDetail({ slug }: { slug: string }) {
  const product = await fetchProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const cartProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    image: product.images[0] ?? null,
  }

  return (
    <>
      <VariantPickerProvider
        options={product.options}
        variants={product.variants}
        minPrice={product.minPrice}
      >
        <section className="storefront-container grid gap-8 py-8 md:py-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16 lg:py-16">
          <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
            <ProductGallery
              images={product.images}
              productName={product.name}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <div className="flex flex-col gap-5">
              <h1 className="font-heading text-4xl leading-[1.02] font-extrabold tracking-[-0.05em] wrap-anywhere sm:text-5xl xl:text-6xl">
                {product.name}
              </h1>
              {product.categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {product.categories.map((category) => (
                    <Badge key={category.id} variant="secondary">
                      {category.name}
                    </Badge>
                  ))}
                </div>
              )}
              <VariantPrice className="font-heading text-3xl font-semibold tracking-tight" />
            </div>

            {product.options.length > 0 && (
              <div className="order-1 border-y border-border pt-6 pb-2">
                <VariantOptionPills />
              </div>
            )}

            {product.description && (
              <div className="order-2 border-t border-border pt-6 lg:order-3">
                <Markdown content={product.description} />
              </div>
            )}

            <div className="sticky bottom-0 z-20 order-3 -mx-4 grid gap-3 border-t border-border bg-background px-4 py-4 sm:mx-0 sm:grid-cols-2 sm:px-0 lg:static lg:order-2 lg:grid-cols-1 lg:border-0 lg:py-0 xl:grid-cols-2">
              <VariantAddToCart
                product={cartProduct}
                size="lg"
                className="border-border bg-background text-foreground hover:bg-muted"
              />
              <VariantBuyNow className="w-full" />
            </div>
          </div>
        </section>
      </VariantPickerProvider>
      <Suspense fallback={null}>
        <RelatedProducts
          productId={product.id}
          categoryIds={product.categories.map((category) => category.id)}
        />
      </Suspense>
    </>
  )
}

export function ProductDetailSkeleton() {
  return (
    <section className="storefront-container grid gap-8 py-8 md:py-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16 lg:py-16">
      <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
        <ProductGallerySkeleton />
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-5">
          <Skeleton className="h-12 w-full sm:h-16" />
          <Skeleton className="h-12 w-2/3 sm:h-16" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>

        <div className="border-y border-border py-6">
          <Skeleton className="h-12 w-2/3" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <Skeleton className="h-13 w-full" />
          <Skeleton className="h-13 w-full" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </section>
  )
}
