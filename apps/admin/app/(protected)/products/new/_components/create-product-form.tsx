"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { createProduct } from "@/features/products/actions"
import { toast } from "@repo/ui/toast"
import { Button } from "@repo/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/tooltip"
import { ProductDetailsFields } from "../../_components/product-details-fields"

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function CreateProductForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const slugInputRef = useRef<HTMLInputElement>(null)
  const [slugEdited, setSlugEdited] = useState(false)

  function handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (slugEdited || !slugInputRef.current) return
    slugInputRef.current.value = slugify(event.target.value)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const slug = formData.get("slug") as string
    const description = formData.get("description") as string

    startTransition(async () => {
      const createPromise = createProduct(name, slug, description)

      await toast
        .promise(createPromise, {
          loading: { title: "Creating product..." },
          success: ({ id }) => {
            router.push(`/products/${id}/edit/step-2`)
            return { title: "Product created" }
          },
          error: (error: Error) => ({
            title: "Failed to create product",
            description: error.message,
          }),
        })
        .catch(() => {})
    })
  }

  return (
    <form onSubmit={handleSubmit} data-testid="create-product-form">
      <ProductDetailsFields
        testIdPrefix="create-product"
        namePlaceholder="Classic Tee"
        slugPlaceholder="classic-tee"
        descriptionPlaceholder="A short description customers will see on the product page"
        slugInputRef={slugInputRef}
        onNameChange={handleNameChange}
        onSlugChange={() => setSlugEdited(true)}
      />

      <div className="mt-7 flex items-center gap-3 pt-4">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="submit"
                disabled={isPending}
                data-testid="create-product-submit-button"
              >
                Continue
              </Button>
            }
          />
          <TooltipContent>
            Saved as a draft. It won&apos;t appear in the storefront until
            you&apos;ve added variants.
          </TooltipContent>
        </Tooltip>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
