import Image from "next/image"
import Link from "next/link"

import { AspectRatio } from "@repo/ui/aspect-ratio"
import { Button } from "@repo/ui/button"
import { Card, CardContent, CardFooter, CardTitle } from "@repo/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/popover"
import { Skeleton } from "@repo/ui/skeleton"
import type { Product } from "@/features/products/queries"
import { CartControl } from "@/features/cart/CartControl"
import {
  VariantAddToCart,
  VariantOptionPills,
  VariantPickerProvider,
} from "@/app/(shop)/products/[slug]/_components/VariantPicker"
import { formatPrice } from "@/lib/utils"

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0]
  const cartProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    image: image ?? null,
  }
  const singleVariant =
    product.variants.length === 1 ? product.variants[0] : null

  return (
    <div className="block h-full">
      <Card
        data-testid={`product-card-${product.id}`}
        className="h-full min-w-0 gap-0 overflow-visible rounded-none border-0 bg-transparent p-0 shadow-none ring-0"
      >
        <Link
          href={`/products/${product.slug}`}
          className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          <AspectRatio
            ratio={1 / 1}
            className="overflow-hidden rounded-lg bg-muted"
          >
            {image ? (
              <Image
                src={image.url}
                alt={image.altText ?? product.name}
                fill
                sizes="(min-width: 1440px) 425px, (min-width: 1024px) 33vw, (min-width: 480px) 50vw, 100vw"
                className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover/card:scale-[1.03]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                No image
              </div>
            )}
          </AspectRatio>
          <CardContent className="px-0 py-4">
            <div className="flex flex-col gap-2">
              <CardTitle className="line-clamp-2 min-h-14 text-xl leading-7 font-semibold tracking-tight wrap-anywhere">
                {product.name}
              </CardTitle>
              <span className="text-base font-medium text-muted-foreground">
                {formatPrice(product.minPrice)}
              </span>
            </div>
          </CardContent>
        </Link>
        <CardFooter className="mt-auto px-0 pt-0 pb-2">
          {singleVariant ? (
            <CartControl
              variant={{
                id: singleVariant.id,
                price: singleVariant.price,
                maxPerOrder: singleVariant.maxPerOrder,
                optionLabel: "",
                product: cartProduct,
              }}
              testIdSuffix={product.id}
              className="border-border bg-transparent text-foreground hover:bg-secondary"
            />
          ) : (
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    data-testid={`product-card-add-to-cart-${product.id}`}
                  >
                    Add to Cart
                  </Button>
                }
              />
              <PopoverContent align="start">
                <VariantPickerProvider
                  options={product.options}
                  variants={product.variants}
                  minPrice={product.minPrice}
                  testIdSuffix={product.id}
                >
                  <VariantOptionPills />
                  <VariantAddToCart product={cartProduct} />
                </VariantPickerProvider>
              </PopoverContent>
            </Popover>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <Card className="h-full gap-0 rounded-none border-0 bg-transparent p-0 shadow-none ring-0">
      <AspectRatio
        ratio={1 / 1}
        className="overflow-hidden rounded-lg bg-muted"
      >
        <Skeleton className="h-full w-full rounded-none" />
      </AspectRatio>
      <CardContent className="px-0 py-4">
        <div className="flex flex-col gap-2">
          <div className="flex h-14 flex-col gap-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      </CardContent>
      <CardFooter className="mt-auto px-0 pt-0 pb-2">
        <Skeleton className="h-11 w-full rounded-md" />
      </CardFooter>
    </Card>
  )
}
