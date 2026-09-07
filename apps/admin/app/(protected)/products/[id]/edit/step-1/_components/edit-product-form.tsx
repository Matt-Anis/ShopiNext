"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"

import { updateProductDetails } from "@/features/products/actions"
import { toast } from "@repo/ui/toast"
import { Button } from "@repo/ui/button"
import { ProductDetailsFields } from "../../../../_components/product-details-fields"

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
      <ProductDetailsFields
        testIdPrefix="edit-product"
        defaultName={name}
        defaultSlug={slug}
        defaultDescription={description ?? ""}
      />

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
