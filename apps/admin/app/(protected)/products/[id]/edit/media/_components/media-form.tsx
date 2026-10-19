"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@repo/ui/button"
import { toast } from "@repo/ui/toast"
import { ConfirmDialog } from "@repo/ui/confirm-dialog"
import { setProductStatus } from "@/features/products/actions"
import {
  reorderProductImages,
  deleteProductImage,
  updateProductImageAltText,
} from "@/features/products/image-actions"

import { ImageDropzone } from "./image-dropzone"
import { SortableGallery } from "./sortable-gallery"
import { AltTextDialog } from "./alt-text-dialog"

interface ImageItem {
  id: string
  url: string
  altText: string | null
  order: number
}

interface MediaFormProps {
  productId: string
  productName: string
  initialImages: ImageItem[]
  initialStatus: "draft" | "active"
}

function arrayMove<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...array]
  const [removed] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, removed)
  return result
}

export function MediaForm({
  productId,
  initialImages,
  initialStatus,
}: MediaFormProps) {
  const router = useRouter()
  const [images, setImages] = useState<ImageItem[]>(() =>
    [...initialImages].sort((a, b) => a.order - b.order)
  )
  const [editingImage, setEditingImage] = useState<ImageItem | null>(null)
  const [deletingImage, setDeletingImage] = useState<ImageItem | null>(null)
  const [isFinishing, setIsFinishing] = useState(false)
  const [isReordering, setIsReordering] = useState(false)
  const [, startTransition] = useTransition()

  function handleImageUploaded(newImage: ImageItem) {
    setImages((prev) => [...prev, newImage].sort((a, b) => a.order - b.order))
  }

  function handleReorder(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return

    const reordered = arrayMove(images, fromIndex, toIndex).map((img, i) => ({
      ...img,
      order: i,
    }))

    setImages(reordered)
    setIsReordering(true)

    startTransition(async () => {
      const promise = reorderProductImages(
        productId,
        reordered.map((img) => img.id)
      )

      await toast
        .promise(promise, {
          loading: { title: "Saving image order..." },
          success: () => ({ title: "Image order saved" }),
          error: (error: Error) => {
            setImages(images)
            return {
              title: "Failed to save image order",
              description: error.message,
            }
          },
        })
        .catch(() => {})

      setIsReordering(false)
    })
  }

  function handleMakeCover(image: ImageItem) {
    const fromIndex = images.findIndex((img) => img.id === image.id)
    if (fromIndex > 0) {
      handleReorder(fromIndex, 0)
    }
  }

  async function handleSaveAltText(imageId: string, altText: string) {
    const promise = updateProductImageAltText(productId, imageId, altText)

    await toast
      .promise(promise, {
        loading: { title: "Updating alt text..." },
        success: () => {
          setImages((prev) =>
            prev.map((img) =>
              img.id === imageId ? { ...img, altText: altText.trim() || null } : img
            )
          )
          return { title: "Alt text updated" }
        },
        error: (error: Error) => ({
          title: "Failed to update alt text",
          description: error.message,
        }),
      })
      .catch(() => {})
  }

  async function handleConfirmDelete() {
    if (!deletingImage) return

    const targetId = deletingImage.id
    const promise = deleteProductImage(productId, targetId)

    await toast
      .promise(promise, {
        loading: { title: "Deleting image..." },
        success: () => {
          setImages((prev) =>
            prev
              .filter((img) => img.id !== targetId)
              .map((img, index) => ({ ...img, order: index }))
          )
          return { title: "Image deleted" }
        },
        error: (error: Error) => ({
          title: "Failed to delete image",
          description: error.message,
        }),
      })
      .catch(() => {})

    setDeletingImage(null)
  }

  function handleFinish(status: "draft" | "active") {
    if (status === initialStatus) {
      router.push("/products")
      return
    }

    setIsFinishing(true)
    startTransition(async () => {
      const promise = setProductStatus(productId, status)

      await toast
        .promise(promise, {
          loading: {
            title: status === "active" ? "Publishing product..." : "Saving draft...",
          },
          success: () => {
            router.push("/products")
            return {
              title: status === "active" ? "Product published" : "Draft saved",
            }
          },
          error: (error: Error) => ({
            title: status === "active" ? "Failed to publish" : "Failed to save draft",
            description: error.message,
          }),
        })
        .catch(() => {})

      setIsFinishing(false)
    })
  }

  return (
    <div className="mt-8 flex flex-col gap-8">
      {/* Upload Dropzone */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Upload Images</h2>
        <ImageDropzone
          productId={productId}
          onImageUploaded={handleImageUploaded}
        />
      </section>

      {/* Gallery Section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-semibold">Image Gallery</h2>
            <span className="text-xs text-muted-foreground">
              {images.length} {images.length === 1 ? "image" : "images"}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Drag to reorder · First image is cover
          </span>
        </div>

        <SortableGallery
          images={images}
          onReorder={handleReorder}
          onMakeCover={handleMakeCover}
          onEditAlt={(img) => setEditingImage(img)}
          onDelete={(img) => setDeletingImage(img)}
          disabled={isReordering}
        />
      </section>

      {/* Navigation Footer */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={isFinishing}
          onClick={() => handleFinish("draft")}
        >
          Save as draft
        </Button>
        <Button
          type="button"
          disabled={isFinishing}
          onClick={() => handleFinish("active")}
        >
          {initialStatus === "active" ? "Save & update" : "Publish product"}
        </Button>
      </div>

      {/* Alt Text Dialog */}
      <AltTextDialog
        image={editingImage}
        open={editingImage !== null}
        onOpenChange={(open) => !open && setEditingImage(null)}
        onSave={handleSaveAltText}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deletingImage !== null}
        onOpenChange={(open) => !open && setDeletingImage(null)}
        title="Delete image"
        description="Are you sure you want to delete this image? It will be permanently removed from storage."
        confirmLabel="Delete"
        destructive
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
