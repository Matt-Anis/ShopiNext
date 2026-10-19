"use client"

import { useState, useRef, useTransition, type DragEvent, type ChangeEvent } from "react"
import { Upload, Loader2, ImagePlus } from "lucide-react"

import { Button } from "@repo/ui/button"
import { toast } from "@repo/ui/toast"
import { ALLOWED_IMAGE_TYPES, type AllowedImageType } from "@/lib/storage"
import {
  getPresignedProductImageUploadUrl,
  createProductImage,
} from "@/features/products/image-actions"

interface ImageItem {
  id: string
  url: string
  altText: string | null
  order: number
}

interface ImageDropzoneProps {
  productId: string
  onImageUploaded: (image: ImageItem) => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function ImageDropzone({
  productId,
  onImageUploaded,
}: ImageDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [, startTransition] = useTransition()

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void processFiles(Array.from(e.dataTransfer.files))
    }
  }

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      void processFiles(Array.from(e.target.files))
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  async function uploadSingleFile(file: File): Promise<ImageItem> {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as AllowedImageType)) {
      throw new Error(
        `"${file.name}" has an unsupported format. Allowed types: JPG, PNG, WebP, AVIF.`
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`"${file.name}" exceeds the 10MB file size limit.`)
    }

    // 1. Get presigned upload URL from Next.js server
    const { uploadUrl, fileUrl } = await getPresignedProductImageUploadUrl(
      productId,
      file.name,
      file.type
    )

    // 2. Direct PUT to S3 / SeaweedFS storage
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    })

    if (!uploadRes.ok) {
      throw new Error(`Storage upload failed for "${file.name}" (${uploadRes.statusText})`)
    }

    // 3. Save database record
    const defaultAlt = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ")
    const newImage = await createProductImage(productId, fileUrl, defaultAlt)

    return newImage
  }

  async function processFiles(files: File[]) {
    if (files.length === 0) return

    setIsUploading(true)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress(`Uploading ${i + 1} of ${files.length}: ${file.name}`)
        await toast
          .promise(uploadSingleFile(file), {
            loading: { title: `Uploading "${file.name}"...` },
            success: (image) => {
              startTransition(() => {
                onImageUploaded(image)
              })
              return { title: `Uploaded "${file.name}"` }
            },
            error: (error: Error) => ({
              title: "Upload failed",
              description: error.message,
            }),
          })
          .catch(() => {})
      }
    } finally {
      setIsUploading(false)
      setUploadProgress(null)
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
        isDragOver
          ? "border-primary bg-primary/5"
          : "border-border hover:border-muted-foreground/50 bg-card"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {isUploading ? (
          <Loader2 className="size-6 animate-spin text-primary" />
        ) : (
          <Upload className="size-6" />
        )}
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium">
          {isUploading
            ? uploadProgress ?? "Uploading..."
            : "Drag and drop your images here, or browse"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Supports JPG, PNG, WebP, and AVIF up to 10MB each
        </p>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        className="mt-4"
      >
        <ImagePlus className="mr-2 size-4" />
        Choose files
      </Button>
    </div>
  )
}
