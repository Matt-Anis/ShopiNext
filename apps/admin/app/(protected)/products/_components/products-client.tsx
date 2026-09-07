"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Package, Plus } from "lucide-react"

import { activateProduct, deactivateProduct } from "@/features/products/actions"
import type { Product } from "./columns"
import { getColumns } from "./columns"
import { DataTable } from "@repo/ui/data-table"
import { Button } from "@repo/ui/button"
import { ConfirmDialog } from "@repo/ui/confirm-dialog"
import { toast } from "@repo/ui/toast"
import { useBreadcrumb } from "../../_components/breadcrumb-provider"

interface ProductsClientProps {
  products: Product[]
}

const breadcrumbItems = [{ label: "Products" }]

export function ProductsClient({ products }: ProductsClientProps) {
  useBreadcrumb(breadcrumbItems)

  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deactivateTarget, setDeactivateTarget] = useState<Product | null>(null)

  const columns = getColumns({
    onView: (product) => router.push(`/products/${product.id}`),
    onEdit: (product) => router.push(`/products/${product.id}/edit/step-1`),
    onDeactivate: (product) => setDeactivateTarget(product),
    onActivate: (product) => {
      startTransition(async () => {
        await toast
          .promise(activateProduct(product.id), {
            loading: { title: "Activating product..." },
            success: () => ({ title: "Product activated" }),
            error: (error: Error) => ({
              title: "Failed to activate product",
              description: error.message,
            }),
          })
          .catch(() => {})
      })
    },
  })

  function handleDeactivate() {
    if (!deactivateTarget) return

    startTransition(async () => {
      await toast
        .promise(deactivateProduct(deactivateTarget.id), {
          loading: { title: "Deactivating product..." },
          success: () => {
            setDeactivateTarget(null)
            return { title: "Product deactivated" }
          },
          error: (error: Error) => ({
            title: "Failed to deactivate product",
            description: error.message,
          }),
        })
        .catch(() => {})
    })
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={products}
        searchColumn="name"
        searchPlaceholder="Search products..."
        actions={
          <Button
            onClick={() => router.push("/products/new")}
            data-testid="new-product-button"
          >
            <Plus />
            New product
          </Button>
        }
        emptyIcon={<Package />}
        emptyTitle="No products yet"
        emptyDescription="Products you add will appear here."
        emptyTestId="products-empty-state"
        tableId="products"
      />

      <ConfirmDialog
        open={deactivateTarget !== null}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
        title="Deactivate product"
        description={
          <>
            This will deactivate{" "}
            <span className="font-medium text-foreground">
              {deactivateTarget?.name}
            </span>
            . It will be hidden from the storefront but its order history is
            preserved, and it can be reactivated later.
          </>
        }
        confirmLabel="Deactivate"
        destructive
        disabled={isPending}
        onConfirm={handleDeactivate}
      />
    </>
  )
}
