"use client"

import { useTransition } from "react"

import type { Category } from "./columns"
import { createCategory, updateCategory } from "@/features/categories/actions"
import { toast } from "@repo/ui/toast"
import { Button } from "@repo/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@repo/ui/drawer"
import { Field, FieldGroup, FieldLabel } from "@repo/ui/field"
import { Input } from "@repo/ui/input"
import { Textarea } from "@repo/ui/textarea"

interface CategoryDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category
}

export function CategoryDrawer({
  open,
  onOpenChange,
  category,
}: CategoryDrawerProps) {
  const [isPending, startTransition] = useTransition()
  const isEditing = !!category

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const description = formData.get("description") as string

    startTransition(async () => {
      const submitPromise = isEditing
        ? updateCategory(category.id, name, description)
        : createCategory(name, description)

      await toast
        .promise(submitPromise, {
          loading: {
            title: isEditing ? "Saving changes..." : "Creating category...",
          },
          success: () => {
            onOpenChange(false)
            return {
              title: isEditing ? "Category updated" : "Category created",
            }
          },
          error: (error: Error) => ({
            title: isEditing
              ? "Failed to update category"
              : "Failed to create category",
            description: error.message,
          }),
        })
        .catch(() => {})
    })
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="right">
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {isEditing ? "Edit category" : "New category"}
          </DrawerTitle>
        </DrawerHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={category?.name}
                className="border-border bg-transparent"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                name="description"
                defaultValue={category?.description ?? ""}
                className="border-border bg-transparent"
              />
            </Field>
          </FieldGroup>

          <DrawerFooter className="mt-4 flex-row justify-end p-0">
            <DrawerClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DrawerClose>
            <Button type="submit" disabled={isPending}>
              {isEditing ? "Save changes" : "Create category"}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
