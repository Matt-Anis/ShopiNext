"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"

import { updateProductDetails } from "@/features/products/actions"
import { toast } from "@repo/ui/toast"
import { Button } from "@repo/ui/button"
import { Field, FieldGroup, FieldLabel } from "@repo/ui/field"
import { Input } from "@repo/ui/input"
import { Textarea } from "@repo/ui/textarea"

interface EditProductFormProps {
  productId: string
  name: string
  slug: string
  description: string | null
}

export function EditProductForm({
  productId,
  name,
  slug,
  description,
}: EditProductFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const nextName = formData.get("name") as string
    const nextSlug = formData.get("slug") as string
    const nextDescription = formData.get("description") as string

    startTransition(async () => {
      const promise = updateProductDetails(
        productId,
        nextName,
        nextSlug,
        nextDescription
      )

      await toast
        .promise(promise, {
          loading: { title: "Saving changes..." },
          success: () => {
            router.push(`/products/${productId}/edit/step-2`)
            return { title: "Product updated" }
          },
          error: (error: Error) => ({
            title: "Failed to update product",
            description: error.message,
          }),
        })
        .catch(() => {})
    })
  }

  return (
    <form onSubmit={handleSubmit} data-testid="edit-product-form">
      <FieldGroup className="mt-8 gap-5">
        <Field className="gap-1.5">
          <FieldLabel
            htmlFor="name"
            className="text-sm font-medium text-foreground/80"
          >
            Name
          </FieldLabel>
          <Input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={name}
            className="h-9 border-border bg-transparent"
            data-testid="edit-product-name-input"
          />
        </Field>
        <Field className="gap-1.5">
          <FieldLabel
            htmlFor="slug"
            className="text-sm font-medium text-foreground/80"
          >
            Slug
          </FieldLabel>
          <Input
            id="slug"
            name="slug"
            type="text"
            required
            defaultValue={slug}
            className="h-9 border-border bg-transparent font-mono text-sm"
            data-testid="edit-product-slug-input"
          />
        </Field>
        <Field className="gap-1.5">
          <FieldLabel
            htmlFor="description"
            className="text-sm font-medium text-foreground/80"
          >
            Description
          </FieldLabel>
          <Textarea
            id="description"
            name="description"
            defaultValue={description ?? ""}
            className="border-border bg-transparent"
            data-testid="edit-product-description-input"
          />
        </Field>
      </FieldGroup>

      <div className="mt-7 flex items-center gap-3 pt-4">
        <Button
          type="submit"
          disabled={isPending}
          data-testid="edit-product-submit-button"
        >
          Continue
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/products")}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
