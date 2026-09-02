import Image from "next/image"

import { AspectRatio } from "@repo/ui/aspect-ratio"
import { Card } from "@repo/ui/card"
import { CartControl } from "@/features/cart/CartControl"
import { formatPrice } from "@/lib/utils"
import type { CartItem } from "@/features/cart/actions"

export function CartItemCard({ item }: { item: CartItem }) {
  const { variant, quantity } = item
  const { product } = variant
  const image = product.image

  return (
    <Card className="gap-3 border border-border p-4 shadow-none ring-0">
      <AspectRatio
        ratio={1 / 1}
        className="overflow-hidden rounded-md bg-muted"
      >
        {image && (
          <Image
            src={image.url}
            alt={image.altText ?? product.name}
            fill
            sizes="(min-width: 768px) 33vw, 80vw"
            className="object-cover"
          />
        )}
      </AspectRatio>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p
            className="line-clamp-2 text-sm font-medium"
            data-testid="cart-item-name"
          >
            {product.name}
          </p>
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
      <CartControl variant={variant} />
    </Card>
  )
}
