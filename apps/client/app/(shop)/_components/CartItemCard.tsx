import Image from "next/image"
import Link from "next/link"

import { AspectRatio } from "@repo/ui/aspect-ratio"
import { Card } from "@repo/ui/card"
import { DrawerClose } from "@repo/ui/drawer"
import { CartControl } from "@/features/cart/CartControl"
import { formatPrice } from "@/lib/utils"
import type { CartItem } from "@/features/cart/actions"

export function CartItemCard({ item }: { item: CartItem }) {
  const { variant, quantity } = item
  const { product } = variant
  const image = product.image
  const productHref = `/products/${product.slug}`

  return (
    <Card className="grid grid-cols-[5rem_minmax(0,1fr)] items-start gap-4 rounded-none border-0 border-b border-border bg-transparent p-0 pb-6 shadow-none ring-0">
      <DrawerClose
        nativeButton={false}
        render={
          <Link
            href={productHref}
            className="group row-span-2 block overflow-hidden rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <AspectRatio
              ratio={1 / 1}
              className="overflow-hidden rounded-md bg-muted"
            >
              {image && (
                <Image
                  src={image.url}
                  alt={image.altText ?? product.name}
                  fill
                  sizes="80px"
                  className="object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-105"
                />
              )}
            </AspectRatio>
          </Link>
        }
      />
      <div className="flex min-w-0 flex-col gap-2">
        <div>
          <DrawerClose
            nativeButton={false}
            render={
              <Link
                href={productHref}
                className="rounded-xs hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <p
                  className="line-clamp-2 font-heading text-base font-semibold tracking-tight wrap-anywhere"
                  data-testid="cart-item-name"
                >
                  {product.name}
                </p>
              </Link>
            }
          />
          {variant.optionLabel && (
            <p className="text-sm text-muted-foreground">
              {variant.optionLabel}
            </p>
          )}
        </div>
        <p
          className="shrink-0 text-sm font-medium"
          data-testid="cart-item-price"
        >
          {formatPrice(variant.price * quantity)}
        </p>
      </div>
      <div className="col-start-2 min-w-0">
        <CartControl variant={variant} />
      </div>
    </Card>
  )
}
