"use client"

import { useMemo, useState, useTransition } from "react"
import { Plus } from "lucide-react"

import { addProductCategory, removeProductCategory } from "@/features/products/actions"
import { createCategory } from "@/features/categories/actions"
import { toast } from "@repo/ui/toast"
import { ConfirmDialog } from "@repo/ui/confirm-dialog"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@repo/ui/combobox"

interface Category {
  id: string
  name: string
}

interface CategoriesSectionProps {
  productId: string
  categories: Category[]
  selectedCategoryIds: string[]
}

type PendingAction =
  | { kind: "create-category"; name: string }
  | { kind: "remove-category"; categoryId: string; name: string }

function isDestructive(action: PendingAction) {
  return action.kind === "remove-category"
}

function getDialogContent(action: PendingAction) {
  switch (action.kind) {
    case "create-category":
      return {
        title: "Create category",
        description: `Create the category "${action.name}"?`,
        confirmLabel: "Create",
      }
    case "remove-category":
      return {
        title: "Remove category",
        description: `Remove "${action.name}" from this product?`,
        confirmLabel: "Remove",
      }
  }
}

export function CategoriesSection({
  productId,
  categories: initialCategories,
  selectedCategoryIds,
}: CategoriesSectionProps) {
  const [, startTransition] = useTransition()
  const [categories, setCategories] = useState(initialCategories)
  const [selectedNames, setSelectedNames] = useState(() =>
    initialCategories
      .filter((category) => selectedCategoryIds.includes(category.id))
      .map((category) => category.name)
  )
  const [categoryQuery, setCategoryQuery] = useState("")
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null
  )
  const [isConfirming, setIsConfirming] = useState(false)
  const anchor = useComboboxAnchor()

  const categoryByName = useMemo(
    () => new Map(categories.map((category) => [category.name, category])),
    [categories]
  )
  const categoryNames = useMemo(
    () => categories.map((category) => category.name),
    [categories]
  )

  function handleCategoriesChange(names: string[]) {
    const added = names.filter((name) => !selectedNames.includes(name))
    const removed = selectedNames.filter((name) => !names.includes(name))

    if (removed.length > 0) {
      const name = removed[0]
      const category = categoryByName.get(name)
      if (category) {
        setPendingAction({
          kind: "remove-category",
          categoryId: category.id,
          name,
        })
      }
    }

    if (added.length === 0) return

    setSelectedNames((prev) => [...prev, ...added])

    startTransition(async () => {
      for (const name of added) {
        const category = categoryByName.get(name)
        if (!category) continue

        await toast
          .promise(addProductCategory(productId, category.id), {
            loading: { title: "Updating categories..." },
            success: () => ({ title: "Categories updated" }),
            error: (error: Error) => {
              setSelectedNames((prev) => prev.filter((n) => n !== name))
              return {
                title: "Failed to update categories",
                description: error.message,
              }
            },
          })
          .catch(() => {})
      }
    })
  }

  function handleCreateCategory(name: string) {
    const trimmedName = name.trim()
    if (!trimmedName) return

    setIsConfirming(true)
    startTransition(async () => {
      const promise = createCategory(trimmedName, "")

      await toast
        .promise(promise, {
          loading: { title: "Creating category..." },
          success: (category) => {
            setCategories((prev) =>
              [...prev, category].sort((a, b) => a.name.localeCompare(b.name))
            )
            setSelectedNames((prev) => [...prev, category.name])
            setCategoryQuery("")
            setPendingAction(null)
            addProductCategory(productId, category.id).catch(() => {})
            return { title: "Category created" }
          },
          error: (error: Error) => ({
            title: "Failed to create category",
            description: error.message,
          }),
        })
        .catch(() => {})
      setIsConfirming(false)
    })
  }

  function handleRemoveCategory(categoryId: string, name: string) {
    setIsConfirming(true)
    startTransition(async () => {
      await toast
        .promise(removeProductCategory(productId, categoryId), {
          loading: { title: "Updating categories..." },
          success: () => {
            setSelectedNames((prev) => prev.filter((n) => n !== name))
            setPendingAction(null)
            return { title: "Categories updated" }
          },
          error: (error: Error) => ({
            title: "Failed to update categories",
            description: error.message,
          }),
        })
        .catch(() => {})
      setIsConfirming(false)
    })
  }

  function handleConfirm() {
    if (!pendingAction) return
    if (pendingAction.kind === "create-category") {
      handleCreateCategory(pendingAction.name)
    } else {
      handleRemoveCategory(pendingAction.categoryId, pendingAction.name)
    }
  }

  const dialogContent = pendingAction && getDialogContent(pendingAction)

  return (
    <section>
      <h2 className="text-sm font-medium text-foreground/80">Categories</h2>
      <Combobox
        multiple
        items={categoryNames}
        value={selectedNames}
        onValueChange={handleCategoriesChange}
        inputValue={categoryQuery}
        onInputValueChange={setCategoryQuery}
      >
        <ComboboxChips ref={anchor} className="mt-3 w-full">
          <ComboboxValue>
            {(values: string[]) => (
              <>
                {values.map((name) => (
                  <ComboboxChip key={name}>{name}</ComboboxChip>
                ))}
                <ComboboxChipsInput placeholder="Add categories..." />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>
            {categoryQuery.trim() ? (
              <button
                type="button"
                disabled={isConfirming}
                onClick={() =>
                  setPendingAction({
                    kind: "create-category",
                    name: categoryQuery.trim(),
                  })
                }
                className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                <Plus className="size-4" />
                Create &quot;{categoryQuery.trim()}&quot;
              </button>
            ) : (
              "No categories found."
            )}
          </ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={dialogContent?.title}
        description={dialogContent?.description}
        confirmLabel={dialogContent?.confirmLabel}
        destructive={pendingAction !== null && isDestructive(pendingAction)}
        disabled={isConfirming}
        onConfirm={handleConfirm}
      />
    </section>
  )
}
