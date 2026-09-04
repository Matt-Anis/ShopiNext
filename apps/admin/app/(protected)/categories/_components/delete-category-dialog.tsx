"use client"

import { useTransition } from "react"

import type { Category } from "./columns"
import { deleteCategory } from "@/features/categories/actions"
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
      const deletePromise = deleteCategory(category.id)

      await toast
        .promise(deletePromise, {
          loading: { title: "Deactivating category..." },
          success: () => {
            onOpenChange(false)
            return { title: "Category deactivated" }
          },
          error: (error: Error) => ({
            title: "Failed to deactivate category",
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
          <AlertDialogTitle>Deactivate category</AlertDialogTitle>
          <AlertDialogDescription>
            This will deactivate{" "}
            <span className="font-medium text-foreground">
              {category?.name}
            </span>
            . It will be hidden from this list but products keep their
            association with it, and it can be reactivated later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={handleDelete}
          >
            Deactivate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
