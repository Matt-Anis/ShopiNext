"use client"

import { useSortable } from "@dnd-kit/react/sortable"
import {
  GripVertical,
  Star,
  Pencil,
  Trash2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react"

import { Button } from "@repo/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/tooltip"

interface ImageItem {
  id: string
  url: string
  altText: string | null
  order: number
}

interface SortableImageCardProps {
  image: ImageItem
  index: number
  totalCount: number
  onMakeCover: (image: ImageItem) => void
  onMove: (fromIndex: number, toIndex: number) => void
  onEditAlt: (image: ImageItem) => void
  onDelete: (image: ImageItem) => void
  disabled?: boolean
}

export function SortableImageCard({
  image,
  index,
  totalCount,
  onMakeCover,
  onMove,
  onEditAlt,
  onDelete,
  disabled = false,
}: SortableImageCardProps) {
  const { ref, handleRef, isDragging } = useSortable({
    id: image.id,
    index,
    disabled,
  })

  const isCover = index === 0

  return (
    <div
      ref={ref}
      className={`group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition-all ${
        isDragging
          ? "opacity-50 ring-2 ring-primary shadow-lg z-10"
          : isCover
            ? "border-primary/50 ring-1 ring-primary/20"
            : "border-border"
      }`}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.altText || `Product image ${index + 1}`}
          className="size-full object-cover select-none pointer-events-none"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
          {isCover ? (
            <span className="flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground shadow-xs">
              <Star className="size-3 fill-current" />
              Cover
            </span>
          ) : (
            <span className="rounded-md bg-background/90 px-1.5 py-0.5 text-[11px] font-medium text-foreground backdrop-blur-xs shadow-xs">
              Image {index + 1}
            </span>
          )}
        </div>

        {/* Drag Handle */}
        <button
          ref={handleRef}
          type="button"
          disabled={disabled}
          title="Drag to reorder"
          className="absolute top-2 right-2 flex size-7 cursor-grab active:cursor-grabbing items-center justify-center rounded-md bg-background/90 text-muted-foreground backdrop-blur-xs shadow-xs hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
        >
          <GripVertical className="size-4" />
        </button>
      </div>

      {/* Info & Actions */}
      <div className="flex flex-col gap-2 p-2.5">
        <div className="min-h-5">
          <p
            className="truncate text-xs text-muted-foreground"
            title={image.altText ?? "No description"}
          >
            {image.altText ? `Alt: ${image.altText}` : "No description"}
          </p>
        </div>

        <div className="flex items-center justify-between border-t pt-2 border-border">
          {/* Reordering arrow controls */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={disabled || index === 0}
                    onClick={() => onMove(index, index - 1)}
                  >
                    <ArrowLeft className="size-3.5" />
                  </Button>
                }
              />
              <TooltipContent>Move earlier</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={disabled || index === totalCount - 1}
                    onClick={() => onMove(index, index + 1)}
                  >
                    <ArrowRight className="size-3.5" />
                  </Button>
                }
              />
              <TooltipContent>Move later</TooltipContent>
            </Tooltip>
          </div>

          {/* Edit & Delete actions */}
          <div className="flex items-center gap-1">
            {!isCover && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-primary"
                      disabled={disabled}
                      onClick={() => onMakeCover(image)}
                    >
                      <Star className="size-3.5" />
                    </Button>
                  }
                />
                <TooltipContent>Make cover image</TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-foreground"
                    disabled={disabled}
                    onClick={() => onEditAlt(image)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                }
              />
              <TooltipContent>Edit alt text</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    disabled={disabled}
                    onClick={() => onDelete(image)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                }
              />
              <TooltipContent>Delete image</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  )
}
