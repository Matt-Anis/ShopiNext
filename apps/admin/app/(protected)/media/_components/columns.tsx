"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { Copy, ExternalLink, Eye, Image as ImageIcon, MoreHorizontal } from "lucide-react"

import { Badge } from "@repo/ui/badge"
import { Button } from "@repo/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu"
import { toast } from "@repo/ui/toast"
import type { MediaListItem } from "@/features/media/queries"

interface GetColumnsOptions {
  onViewProduct: (productId: string) => void
}

export function getColumns({
  onViewProduct,
}: GetColumnsOptions): ColumnDef<MediaListItem>[] {
  return [
    {
      id: "preview",
      header: "Preview",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
          {row.original.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.original.url}
              alt={row.original.altText ?? "Product image"}
              className="size-full object-cover"
            />
          ) : (
            <ImageIcon className="size-5 text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      accessorKey: "productName",
      header: "Product",
      cell: ({ row }) => (
        <Link
          href={`/products/${row.original.productId}`}
          className="font-medium text-foreground hover:underline"
        >
          {row.original.productName}
        </Link>
      ),
    },
    {
      accessorKey: "altText",
      header: "Alt Text",
      cell: ({ row }) =>
        row.original.altText ? (
          <span className="text-sm">{row.original.altText}</span>
        ) : (
          <span className="text-sm italic text-muted-foreground">No alt text</span>
        ),
    },
    {
      accessorKey: "order",
      header: "Position",
      cell: ({ row }) => (
        <Badge variant={row.original.order === 0 ? "default" : "secondary"}>
          {row.original.order === 0 ? "1 (Primary)" : `#${row.original.order + 1}`}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      meta: {
        cellClassName: "sticky right-0 border-l bg-background text-right",
      },
      cell: ({ row }) => {
        const item = row.original

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
              <DropdownMenuItem
                onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}
              >
                <ExternalLink />
                View full size
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewProduct(item.productId)}>
                <Eye />
                View product
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  await toast
                    .promise(navigator.clipboard.writeText(item.url), {
                      loading: { title: "Copying image URL..." },
                      success: () => ({ title: "Image URL copied to clipboard" }),
                      error: (error: Error) => ({
                        title: "Failed to copy URL",
                        description: error.message,
                      }),
                    })
                    .catch(() => {})
                }}
              >
                <Copy />
                Copy URL
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
