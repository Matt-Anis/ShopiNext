"use client"

import { useTransition } from "react"

import type { Category } from "./columns"
import { toast } from "@repo/ui/toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/alert-dialog"

interface DeleteCategoryDialogProps {
  category: Category | null
  onOpenChange: (open: boolean) => void
}

export function DeleteCategoryDialog({
  category,
  onOpenChange,
}: DeleteCategoryDialogProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!category) return

    startTransition(async () => {
      // TODO: wire to deleteCategory server action
      const deletePromise = Promise.resolve(console.log({ id: category.id }))

      await toast
        .promise(deletePromise, {
          loading: { title: "Deleting category..." },
          success: () => {
            onOpenChange(false)
            return { title: "Category deleted" }
          },
          error: (error: Error) => ({
            title: "Failed to delete category",
            description: error.message,
          }),
        })
        .catch(() => {})
    })
  }

  return (
    <AlertDialog open={!!category} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete category</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete{" "}
            <span className="font-medium text-foreground">
              {category?.name}
            </span>
            . Products in this category will not be deleted, only
            unassigned from it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={handleDelete}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
