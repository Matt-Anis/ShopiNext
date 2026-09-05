"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { createProduct } from "@/features/products/actions"
import { toast } from "@repo/ui/toast"
import { Button } from "@repo/ui/button"
import { Field, FieldGroup, FieldLabel } from "@repo/ui/field"
import { Input } from "@repo/ui/input"
import { Textarea } from "@repo/ui/textarea"
import { useBreadcrumb } from "../../../_components/breadcrumb-provider"

const breadcrumbItems = [
  { label: "Products", href: "/products" },
  { label: "New product" },
]

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function CreateProductForm() {
  useBreadcrumb(breadcrumbItems)

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
            placeholder="Classic Tee"
            className="h-9 border-border bg-transparent"
            onChange={handleNameChange}
            data-testid="create-product-name-input"
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
            placeholder="classic-tee"
            className="h-9 border-border bg-transparent font-mono text-sm"
            ref={slugInputRef}
            onChange={() => setSlugEdited(true)}
            data-testid="create-product-slug-input"
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
            placeholder="A short description customers will see on the product page"
            className="border-border bg-transparent"
            data-testid="create-product-description-input"
          />
        </Field>
      </FieldGroup>

      <div className="mt-7 flex items-center gap-3 pt-4">
        <Button
          type="submit"
          disabled={isPending}
          data-testid="create-product-submit-button"
        >
          Continue
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
