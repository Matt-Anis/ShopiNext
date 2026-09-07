interface Image {
  id: string
  url: string
  altText: string | null
  isPrimary: boolean
}

interface ProductImagesProps {
  images: Image[]
}

export function ProductImages({ images }: ProductImagesProps) {
  const primaryCount = images.filter((image) => image.isPrimary).length

  return (
    <section>
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Images
        </h2>
        {images.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {images.length} · {primaryCount} primary
          </span>
        )}
      </div>
      {images.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No images uploaded yet.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-3">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative size-24 overflow-hidden rounded-2xl border border-border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.altText ?? ""}
                className="size-full object-cover"
              />
              {image.isPrimary && (
                <span className="absolute bottom-1 left-1 rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] font-medium">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
