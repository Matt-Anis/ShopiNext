"use client"

import type { ChangeEvent, Ref } from "react"

import { Field, FieldGroup, FieldLabel } from "@repo/ui/field"
import { Input } from "@repo/ui/input"
import { Textarea } from "@repo/ui/textarea"

interface ProductDetailsFieldsProps {
  testIdPrefix: string
  defaultName?: string
  defaultSlug?: string
  defaultDescription?: string
  namePlaceholder?: string
  slugPlaceholder?: string
  descriptionPlaceholder?: string
  slugInputRef?: Ref<HTMLInputElement>
  onNameChange?: (event: ChangeEvent<HTMLInputElement>) => void
  onSlugChange?: () => void
}

export function ProductDetailsFields({
  testIdPrefix,
  defaultName,
  defaultSlug,
  defaultDescription,
  namePlaceholder,
  slugPlaceholder,
  descriptionPlaceholder,
  slugInputRef,
  onNameChange,
  onSlugChange,
}: ProductDetailsFieldsProps) {
  return (
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
          defaultValue={defaultName}
          placeholder={namePlaceholder}
          className="h-9 border-border bg-transparent"
          onChange={onNameChange}
          data-testid={`${testIdPrefix}-name-input`}
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
          defaultValue={defaultSlug}
          placeholder={slugPlaceholder}
          className="h-9 border-border bg-transparent font-mono text-sm"
          ref={slugInputRef}
          onChange={onSlugChange}
          data-testid={`${testIdPrefix}-slug-input`}
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
          defaultValue={defaultDescription}
          placeholder={descriptionPlaceholder}
          className="border-border bg-transparent"
          data-testid={`${testIdPrefix}-description-input`}
        />
      </Field>
    </FieldGroup>
  )
}
