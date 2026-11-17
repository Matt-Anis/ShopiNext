"use client"

import * as React from "react"
import Image from "next/image"
import { Maximize2 } from "lucide-react"
import { AspectRatio } from "@repo/ui/aspect-ratio"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@repo/ui/carousel"
import { Skeleton } from "@repo/ui/skeleton"
import { cn } from "@repo/ui/utils"
import ProductGalleryLightbox from "./ProductGalleryLightbox"

const SKELETON_THUMB_COUNT = 4

type GalleryImage = {
  id: string
  url: string
  altText: string | null
}

export default function ProductGallery({
  images,
  productName,
}: {
  images: GalleryImage[]
  productName: string
}) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [lightboxOpen, setLightboxOpen] = React.useState(false)
  const thumbRefs = React.useRef<(HTMLButtonElement | null)[]>([])

  React.useEffect(() => {
    if (!api) return

    const onSelect = () => {
      const index = api.selectedScrollSnap()
      setSelectedIndex(index)
      thumbRefs.current[index]?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      })
    }

    onSelect()
    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  if (images.length === 0) {
    return (
      <AspectRatio
        ratio={1 / 1}
        className="overflow-hidden rounded-md bg-muted"
      >
        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
          No image
        </div>
      </AspectRatio>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 lg:flex-row-reverse">
      <Carousel setApi={setApi} className="min-w-0 flex-1">
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={image.id}>
              <AspectRatio
                ratio={1 / 1}
                className="overflow-hidden rounded-md bg-muted"
              >
                <Image
                  src={image.url}
                  alt={image.altText ?? productName}
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  loading={index === 0 ? "eager" : "lazy"}
                  className="object-cover"
                />
              </AspectRatio>
            </CarouselItem>
          ))}
        </CarouselContent>
        {images.length > 1 && (
          <>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </>
        )}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label="Open fullscreen"
          className="absolute right-3 bottom-3 z-10 hidden size-11 items-center justify-center rounded-md bg-background text-foreground ring-1 ring-border transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring lg:flex"
        >
          <Maximize2 className="size-4" />
        </button>
      </Carousel>

      {images.length > 1 && (
        <div className="relative shrink-0 lg:w-20">
          <div className="scrollbar-hide flex gap-2 overflow-x-auto p-1 lg:h-full lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto">
            {images.map((image, index) => (
              <button
                key={image.id}
                ref={(el) => {
                  thumbRefs.current[index] = el
                }}
                type="button"
                onClick={() => api?.scrollTo(index)}
                aria-label={`Show image ${index + 1}`}
                aria-current={index === selectedIndex}
                className={cn(
                  "relative aspect-square w-16 shrink-0 overflow-hidden rounded-md bg-muted ring-offset-2 ring-offset-background transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring lg:w-full",
                  index === selectedIndex
                    ? "ring-2 ring-foreground"
                    : "ring-2 ring-border hover:ring-foreground/30"
                )}
              >
                <Image
                  src={image.url}
                  alt={image.altText ?? `${productName} thumbnail ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-8 bg-gradient-to-t from-background to-transparent lg:block" />
        </div>
      )}

      <ProductGalleryLightbox
        images={images}
        productName={productName}
        startIndex={selectedIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </div>
  )
}

export function ProductGallerySkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-4 lg:flex-row-reverse">
      <AspectRatio
        ratio={1 / 1}
        className="min-w-0 flex-1 overflow-hidden rounded-md"
      >
        <Skeleton className="h-full w-full rounded-md" />
      </AspectRatio>

      <div className="relative shrink-0 lg:w-20">
        <div className="flex gap-2 overflow-x-auto p-1 lg:h-full lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto">
          {Array.from({ length: SKELETON_THUMB_COUNT }).map((_, index) => (
            <Skeleton
              key={`gallery-skeleton-thumb-${index}`}
              className="aspect-square w-16 shrink-0 rounded-md lg:w-full"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
