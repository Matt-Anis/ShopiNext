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

type DrawerState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; category: Category }

interface CategoriesClientProps {
  categories: Category[]
}

const breadcrumbItems = [{ label: "Categories" }]

export function CategoriesClient({ categories }: CategoriesClientProps) {
  useBreadcrumb(breadcrumbItems)

  const [drawerState, setDrawerState] = useState<DrawerState>({
    mode: "closed",
  })
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  const columns = getColumns({
    onEdit: (category) => setDrawerState({ mode: "edit", category }),
    onDelete: (category) => setDeleteTarget(category),
  })

  return (
    <>
      <DataTable
        columns={columns}
        data={categories}
        searchColumn="name"
        searchPlaceholder="Search categories..."
        actions={
          <Button
            onClick={() => setDrawerState({ mode: "create" })}
            data-testid="new-category-button"
          >
            <Plus />
            New category
          </Button>
        }
        emptyIcon={<FolderTree />}
        emptyTitle="No categories yet"
        emptyDescription="Categories you add will appear here."
        emptyTestId="categories-empty-state"
        tableId="categories"
      />

      <CategoryDrawer
        key={drawerState.mode === "edit" ? drawerState.category.id : "create"}
        open={drawerState.mode !== "closed"}
        onOpenChange={(open) =>
          !open && setDrawerState({ mode: "closed" })
        }
        category={
          drawerState.mode === "edit" ? drawerState.category : undefined
        }
      />

      <DeleteCategoryDialog
        category={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      />
    </>
  )
}
