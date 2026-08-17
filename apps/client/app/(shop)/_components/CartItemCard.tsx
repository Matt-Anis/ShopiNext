import Image from "next/image";

import { AspectRatio } from "@repo/ui/aspect-ratio";
import { Card } from "@repo/ui/card";
import { CartControl } from "@/features/cart/CartControl";
import { formatPrice } from "@/lib/utils";
import type { CartItem } from "@/features/cart/actions";

export function CartItemCard({ item }: { item: CartItem }) {
  const { product, quantity } = item;
  const image = product.images[0];

  return (
    <Card className="gap-3 border border-border p-4">
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
        <p
          className="line-clamp-2 text-sm font-medium"
          data-testid="cart-item-name"
        >
          {product.name}
        </p>
        <p className="shrink-0 text-sm font-medium" data-testid="cart-item-price">
          {formatPrice(product.price * quantity)}
        </p>
      </div>
      <CartControl product={product} />
    </Card>
  );
}
