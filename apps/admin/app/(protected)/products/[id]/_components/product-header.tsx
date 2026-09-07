"use client"

import Link from "next/link"
import { Pencil } from "lucide-react"

import { Badge } from "@repo/ui/badge"
import { Button } from "@repo/ui/button"
import { useBreadcrumb } from "../../../_components/breadcrumb-provider"

interface ProductHeaderProps {
  product: {
    id: string
    name: string
    slug: string
    description: string | null
    status: "draft" | "active"
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  }
}

export function ProductHeader({ product }: ProductHeaderProps) {
  useBreadcrumb([
    { label: "Products", href: "/products" },
    { label: product.name },
  ])

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {product.name}
          </h1>
          <Badge variant={product.status === "active" ? "default" : "secondary"}>
            {product.status === "active" ? "Active" : "Draft"}
          </Badge>
          {!product.isActive && (
            <Badge variant="destructive">Deactivated</Badge>
          )}
        </div>
        <span className="text-sm text-muted-foreground">{product.slug}</span>
        {product.description && (
          <p className="max-w-2xl text-sm text-muted-foreground">
            {product.description}
          </p>
        )}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>
            Created{" "}
            {product.createdAt.toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
          <span>
            Updated{" "}
            {product.updatedAt.toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        </div>
      </div>

      <Button
        nativeButton={false}
        render={<Link href={`/products/${product.id}/edit/step-1`} />}
      >
        <Pencil />
        Edit
      </Button>
    </div>
  )
}
