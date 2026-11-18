"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import {
  Archive,
  CircleCheck,
  CircleOff,
  Eye,
  MoreHorizontal,
  Package,
  Pencil,
  Rocket,
} from "lucide-react"

import { Badge } from "@repo/ui/badge"
import { Button } from "@repo/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu"
import { cn } from "@repo/ui/utils"

export interface Product {
  id: string
  name: string
  slug: string
  status: "draft" | "active"
  isActive: boolean
  createdAt: Date
  thumbnailUrl: string | null
  variantCount: number
  optionCount: number
  categoryNames: string[]
}

interface GetColumnsOptions {
  onView: (product: Product) => void
  onEdit: (product: Product) => void
  onDeactivate: (product: Product) => void
  onActivate: (product: Product) => void
  onTogglePublish: (product: Product) => void
  canUpdate?: boolean
}

function renderProductThumbnail(product: Product, compact = false) {
  return (
    <div className={cn(
      "grid shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted",
      compact ? "size-11" : "size-9"
    )}>
      {product.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.thumbnailUrl} alt="" loading="lazy" className="size-full object-cover" />
      ) : (
        <Package aria-hidden="true" className="size-4 text-muted-foreground" />
      )}
    </div>
  )
}

function renderProductStatus({ isActive, status }: Product) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant={isActive ? "secondary" : "destructive"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
      <Badge
        variant={status === "active" ? "outline" : "secondary"}
        className={status === "active"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
          : undefined}
      >
        {status === "active" ? "Published" : "Draft"}
      </Badge>
    </div>
  )
}

function renderProductActions(
  product: Product,
  { onView, onEdit, onDeactivate, onActivate, onTogglePublish, canUpdate = true }: GetColumnsOptions,
  compact = false
) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" className={compact ? "size-11" : undefined}>
            <MoreHorizontal aria-hidden="true" />
            <span className="sr-only">Open menu</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView(product)}>
          <Eye />
          View
        </DropdownMenuItem>
        {canUpdate && (
          <>
            <DropdownMenuItem onClick={() => onEdit(product)}>
              <Pencil />
              Edit
            </DropdownMenuItem>
            {product.status === "active" ? (
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onTogglePublish(product)}
              >
                <Archive />
                Move to draft
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onTogglePublish(product)}>
                <Rocket />
                Publish
              </DropdownMenuItem>
            )}
            {product.isActive ? (
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDeactivate(product)}
              >
                <CircleOff />
                Deactivate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onActivate(product)}>
                <CircleCheck />
                Activate
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function renderProductCompactRow(product: Product, actions: GetColumnsOptions) {
  return (
    <div className="flex min-w-0 items-center gap-1 px-3 py-1">
      <Link
        href={`/products/${product.id}`}
        aria-label={product.name}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-1 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {renderProductThumbnail(product, true)}
        <div className="min-w-0 space-y-1">
          <p className="line-clamp-2 text-sm font-semibold wrap-anywhere" title={product.name}>
            {product.name}
          </p>
          {renderProductStatus(product)}
        </div>
      </Link>
      {renderProductActions(product, actions, true)}
    </div>
  )
}

export function getColumns(actions: GetColumnsOptions): ColumnDef<Product>[] {
  return [
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {renderProductThumbnail(row.original)}
          <div className="flex flex-col">
            <span className="font-medium">{row.original.name}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.slug}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => renderProductStatus(row.original),
    },
    {
      id: "categories",
      accessorFn: (row) => row.categoryNames.join(", "),
      header: "Categories",
      cell: ({ row }) => (
        <span
          className="block max-w-xs truncate text-muted-foreground"
          title={row.original.categoryNames.join(", ") || undefined}
        >
          {row.original.categoryNames.join(", ") || "—"}
        </span>
      ),
    },
    {
      accessorKey: "optionCount",
      header: "Options",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.optionCount}</span>
      ),
    },
    {
      accessorKey: "variantCount",
      header: "Variants",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.variantCount}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.createdAt.toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      enableHiding: false,
      meta: {
        headerClassName: "sticky right-0 bg-card",
        cellClassName: "sticky right-0 border-l bg-card",
      },
      cell: ({ row }) => renderProductActions(row.original, actions),
    },
  ]
}
