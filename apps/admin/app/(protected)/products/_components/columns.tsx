"use client"

import type { ColumnDef } from "@tanstack/react-table"
import {
  Archive,
  CircleCheck,
  CircleOff,
  Eye,
  MoreHorizontal,
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
}

export function getColumns({
  onView,
  onEdit,
  onDeactivate,
  onActivate,
  onTogglePublish,
}: GetColumnsOptions): ColumnDef<Product>[] {
  return [
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
            {row.original.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={row.original.thumbnailUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : null}
          </div>
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
      cell: ({ row }) => {
        const { status, isActive } = row.original

        return (
          <div className="flex items-center gap-1.5">
            <Badge variant={isActive ? "default" : "destructive"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge variant={status === "active" ? "default" : "secondary"}>
              {status === "active" ? "Published" : "Draft"}
            </Badge>
          </div>
        )
      },
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
        headerClassName: "sticky right-0 bg-background",
        cellClassName: "sticky right-0 border-l bg-background",
      },
      cell: ({ row }) => {
        const product = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal />
                  <span className="sr-only">Open menu</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(product)}>
                <Eye />
                View
              </DropdownMenuItem>
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
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
