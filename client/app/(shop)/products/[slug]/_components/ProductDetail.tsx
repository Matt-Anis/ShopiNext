import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { fetchProductBySlug } from "@/features/products/actions";
import { checkoutNow } from "@/features/checkout/actions";
import { CartControl } from "@/features/cart/CartControl";
import ProductGallery, { ProductGallerySkeleton } from "./ProductGallery";

export default async function ProductDetail({ slug }: { slug: string }) {
  const product = await fetchProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-8 lg:flex-row lg:items-start lg:gap-12 lg:py-12">
      <div className="lg:sticky lg:top-24 lg:w-1/3">
        <ProductGallery images={product.images} productName={product.name} />
      </div>

      <div className="flex flex-1 flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
            {product.name}
          </h1>
          <p className="text-2xl font-medium lg:hidden">
            {formatPrice(product.price)}
          </p>
        </div>

        {product.description && (
          <p className="leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        )}

        <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-border bg-background/95 px-4 py-4 backdrop-blur-sm lg:hidden">
          <CartControl
            product={product}
            size="lg"
            className="border-border bg-background text-foreground hover:bg-muted"
          />
          <form action={checkoutNow.bind(null, product.id, 1)}>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              data-testid="buy-now-button"
            >
              Buy now
            </Button>
          </form>
        </div>
      </div>

      <div className="hidden lg:sticky lg:top-24 lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:gap-4 lg:rounded-md lg:border lg:border-border lg:p-6">
        <p className="text-2xl font-medium">{formatPrice(product.price)}</p>
        <div className="flex flex-col gap-2">
          <CartControl
            product={product}
            size="lg"
            className="border-border bg-background text-foreground hover:bg-muted"
          />
          <form action={checkoutNow.bind(null, product.id, 1)}>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              data-testid="buy-now-button"
            >
              Buy now
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}

export function ProductDetailSkeleton() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-8 lg:flex-row lg:items-start lg:gap-12 lg:py-12">
      <div className="lg:sticky lg:top-24 lg:w-1/3">
        <ProductGallerySkeleton />
      </div>

      <div className="flex flex-1 flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-8 w-24 lg:hidden" />
        </div>

        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        <div className="flex flex-col gap-2 lg:hidden">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>

      <div className="hidden lg:sticky lg:top-24 lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:gap-4 lg:rounded-md lg:border lg:border-border lg:p-6">
        <Skeleton className="h-8 w-24" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    </section>
  );
}
