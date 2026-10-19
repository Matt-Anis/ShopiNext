"use client"

import { useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@repo/ui/dialog"
import { Button } from "@repo/ui/button"
import { Input } from "@repo/ui/input"

interface ImageItem {
  id: string
  url: string
  altText: string | null
  order: number
}

interface AltTextDialogProps {
  image: ImageItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (imageId: string, altText: string) => Promise<void>
}

interface AltTextFormProps {
  image: ImageItem
  onSave: (imageId: string, altText: string) => Promise<void>
  onCancel: () => void
}

function AltTextForm({ image, onSave, onCancel }: AltTextFormProps) {
  const [altText, setAltText] = useState(image.altText ?? "")
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    try {
      await onSave(image.id, altText)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-4 py-2">
        <div className="size-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt={altText || "Preview"}
            className="size-full object-cover"
          />
        </div>
        <div className="flex-1">
          <Input
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Describe this image..."
            disabled={isSaving}
            autoFocus
          />
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <DialogClose
          render={
            <Button variant="outline" disabled={isSaving} onClick={onCancel}>
              Cancel
            </Button>
          }
        />
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save changes"}
        </Button>
      </DialogFooter>
    </>
  )
}

export function AltTextDialog({
  image,
  open,
  onOpenChange,
  onSave,
}: AltTextDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Alt Text</DialogTitle>
          <DialogDescription>
            Alt text improves accessibility for screen readers and search engines.
          </DialogDescription>
        </DialogHeader>

        {image && (
          <AltTextForm
            key={image.id}
            image={image}
            onSave={async (id, text) => {
              await onSave(id, text)
              onOpenChange(false)
            }}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
