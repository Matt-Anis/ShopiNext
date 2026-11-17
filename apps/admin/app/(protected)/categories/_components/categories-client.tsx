"use client"

import { useState } from "react"
import { FolderTree, Plus } from "lucide-react"

import type { Category } from "./columns"
import { getColumns } from "./columns"
import { DataTable } from "@repo/ui/data-table"
import { CategoryDrawer } from "./category-drawer"
import { DeleteCategoryDialog } from "./delete-category-dialog"
import { Button } from "@repo/ui/button"
import { useBreadcrumb } from "../../_components/breadcrumb-provider"
import { usePermission } from "@/hooks/use-permission"
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/alert"
import { useCategorySelection } from "./use-category-selection"

interface CategoriesClientProps {
  categories: Category[]
}

const breadcrumbItems = [{ label: "Categories" }]

export function CategoriesClient({ categories }: CategoriesClientProps) {
  useBreadcrumb(breadcrumbItems)

  const { categoryId, selectCategory, clearCategory } = useCategorySelection()
  const selectedCategory = categories.find(
    (category) => category.id === categoryId
  )
  const [creating, setCreating] = useState(false)
  const showingCreate = creating && !categoryId
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  const canCreate = usePermission("categories", "create")
  const canUpdate = usePermission("categories", "update")
  const canDelete = usePermission("categories", "delete")

  function closeDrawer() {
    setCreating(false)
    if (categoryId) clearCategory()
  }

  const columns = getColumns({
    onEdit: (category) => {
      setCreating(false)
      selectCategory(category.id)
    },
    onDelete: (category) => setDeleteTarget(category),
    canUpdate,
    canDelete,
  })

  return (
    <>
      {categoryId && !selectedCategory && (
        <Alert>
          <FolderTree aria-hidden="true" />
          <AlertTitle>Category unavailable</AlertTitle>
          <AlertDescription>
            <p>This category is no longer available.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={clearCategory}
            >
              Back to categories
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <DataTable
        columns={columns}
        data={categories}
        searchColumn="name"
        searchPlaceholder="Search categories..."
        actions={
          canCreate ? (
            <Button
              onClick={() => {
                clearCategory()
                setCreating(true)
              }}
              data-testid="new-category-button"
            >
              <Plus />
              New category
            </Button>
          ) : undefined
        }
        emptyIcon={<FolderTree />}
        emptyTitle="No categories yet"
        emptyDescription="Categories you add will appear here."
        emptyTestId="categories-empty-state"
        tableId="categories"
      />

      <CategoryDrawer
        key={showingCreate ? "create" : (selectedCategory?.id ?? "closed")}
        open={showingCreate || !!selectedCategory}
        onOpenChange={(open) => {
          if (!open) closeDrawer()
        }}
        category={showingCreate ? undefined : selectedCategory}
        readOnly={!showingCreate && !canUpdate}
      />

      <DeleteCategoryDialog
        category={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      />
    </>
  )
}
