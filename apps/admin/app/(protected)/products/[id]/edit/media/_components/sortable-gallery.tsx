"use client"

import { DragDropProvider } from "@dnd-kit/react"

import { SortableImageCard } from "./sortable-image-card"

interface ImageItem {
  id: string
  url: string
  altText: string | null
  order: number
}

interface SortableGalleryProps {
  images: ImageItem[]
  onReorder: (fromIndex: number, toIndex: number) => void
  onMakeCover: (image: ImageItem) => void
  onEditAlt: (image: ImageItem) => void
  onDelete: (image: ImageItem) => void
  disabled?: boolean
}

export function SortableGallery({
  images,
  onReorder,
  onMakeCover,
  onEditAlt,
  onDelete,
  disabled = false,
}: SortableGalleryProps) {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          No images uploaded yet.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Use the dropzone above to upload your product photos.
        </p>
      </div>
    )
  }

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (event.canceled) return
        const { source, target } = event.operation
        if (source && target && source.id !== target.id) {
          const fromIndex = images.findIndex((img) => img.id === source.id)
          const toIndex = images.findIndex((img) => img.id === target.id)
          if (fromIndex !== -1 && toIndex !== -1) {
            onReorder(fromIndex, toIndex)
          }
        }
      }}
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {images.map((image, index) => (
          <SortableImageCard
            key={image.id}
            image={image}
            index={index}
            totalCount={images.length}
            onMakeCover={onMakeCover}
            onMove={onReorder}
            onEditAlt={onEditAlt}
            onDelete={onDelete}
            disabled={disabled}
          />
        ))}
      </div>
    </DragDropProvider>
  )
}
