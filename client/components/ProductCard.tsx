import Image from "next/image";
import Link from "next/link";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/db/queries";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const formatPrice = (priceInCents: number) =>
  currencyFormatter.format(priceInCents / 100);

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];

  return (
    <Link href={`/products/${product.id}`} className="block h-full ">
      <Card className="gap-0 h-full p-0 rounded-md border border-border  shadow-none ring-0 transition-all duration-300 hover:-translate-y-1">
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
              {formatPrice(product.price)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
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
