import Image from "next/image";
import Link from "next/link";

import { AspectRatio } from "@repo/ui/aspect-ratio";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "@repo/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/popover";
import { Skeleton } from "@repo/ui/skeleton";
import type { Product } from "@/features/products/queries";
import { CartControl } from "@/features/cart/CartControl";
import {
  VariantAddToCart,
  VariantOptionPills,
  VariantPickerProvider,
} from "@/app/(shop)/products/[slug]/_components/VariantPicker";
import { formatPrice } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];
  const cartProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    image: image ?? null,
  };
  const singleVariant =
    product.variants.length === 1 ? product.variants[0] : null;

  return (
    <div className="block h-full">
      <Card className="gap-0 h-full p-0 rounded-3xl border border-border  shadow-none ring-0">
        <Link href={`/products/${product.slug}`}>
          <AspectRatio ratio={1 / 1} className="overflow-hidden bg-muted ">
            {image ? (
              <Image
                src={image.url}
                alt={image.altText ?? product.name}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover  transition-transform duration-300 group-hover/card:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                No image
              </div>
            )}
          </AspectRatio>
          <CardContent className="flex items-center justify-between gap-2 px-4 py-3">
            <div>
              <CardTitle className="line-clamp-4  ">{product.name}</CardTitle>
              <span className="shrink-0 text-2xl font-medium">
                {formatPrice(product.minPrice)}
              </span>
            </div>
          </CardContent>
        </Link>
        <CardFooter className="px-4 py-4">
          {singleVariant ? (
            <CartControl
              variant={{
                id: singleVariant.id,
                price: singleVariant.price,
                stock: singleVariant.stock,
                maxPerOrder: singleVariant.maxPerOrder,
                optionLabel: "",
                product: cartProduct,
              }}
            />
          ) : (
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    className="w-full"
                    data-testid="product-card-add-to-cart"
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
  );
}

export function ProductCardSkeleton() {
  return (
    <Card className="gap-0 h-full p-0 rounded-md border border-border shadow-none ring-0">
      <AspectRatio ratio={1 / 1} className="overflow-hidden bg-muted">
        <Skeleton className="h-full w-full rounded-none" />
      </AspectRatio>
      <CardContent className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex w-full flex-col gap-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-7 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}
