import Image from "next/image"
import Link from "next/link"
import { ArrowDown, ArrowUpRight } from "lucide-react"
import { Button } from "@repo/ui/button"
import Logo from "@/components/Logo"
import type { Product } from "@/features/products/queries"
import { formatPrice } from "@/lib/utils"

export default function HeroSection({ product }: { product?: Product }) {
  const image = product?.images[0]

  return (
    <section className="border-b border-border">
      <div className="storefront-container grid gap-12 py-12 md:py-16 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16 lg:py-20">
        <div className="min-w-0">
          <p className="mb-8 font-mono text-xs font-medium tracking-[0.16em] uppercase">
            ShopiNext / Everyday discoveries
          </p>
          <h1 className="font-heading text-[clamp(3.5rem,8.4vw,7.75rem)] leading-[0.92] font-black tracking-[-0.065em]">
            Your next
            <br />
            good{" "}
            <span className="bg-primary px-2 text-primary-foreground">
              find.
            </span>
          </h1>
          <p className="mt-8 max-w-sm text-base leading-relaxed text-muted-foreground sm:text-lg">
            Everyday essentials. Unexpected favourites. Discover something that
            feels a little more you.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="gap-6 px-6 font-semibold"
              nativeButton={false}
              render={<a href="#products" />}
            >
              Browse Products
              <ArrowDown aria-hidden="true" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-6"
              nativeButton={false}
              render={<Link href="/categories" />}
            >
              Explore categories
            </Button>
          </div>
        </div>
        {product && image ? (
          <Link
            href={`/products/${product.slug}`}
            className="group min-w-0 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          >
            <div className="mb-3 flex items-center justify-between border-b border-border pb-3 font-mono text-xs tracking-wider uppercase">
              <span>In the collection</span>
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
              <Image
                src={image.url}
                alt={image.altText ?? product.name}
                fill
                sizes="(min-width: 1440px) 580px, (min-width: 1024px) 44vw, 100vw"
                loading="eager"
                className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.03]"
              />
            </div>
            <div className="mt-4 flex items-start justify-between gap-4">
              <span className="min-w-0 font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                {product.name}
              </span>
              <span className="shrink-0 pt-1 text-sm font-medium">
                {formatPrice(product.minPrice)}
              </span>
            </div>
          </Link>
        ) : (
          <div className="flex aspect-square flex-col items-center justify-center gap-8 rounded-lg bg-primary p-8 text-primary-foreground">
            <Logo className="size-40 sm:size-56" />
            <p className="text-center font-mono text-xs tracking-[0.16em] uppercase">
              Stay curious. Keep exploring.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
