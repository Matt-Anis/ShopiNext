"use client"

import Link from "next/link"
import { Pencil } from "lucide-react"

import { Button } from "@repo/ui/button"
import { cn } from "@repo/ui/utils"
import { useBreadcrumb } from "../../../_components/breadcrumb-provider"

interface ProductHeaderProps {
  product: {
    id: string
    name: string
    slug: string
    status: "draft" | "active"
    isActive: boolean
  }
}

export function ProductHeader({ product }: ProductHeaderProps) {
  useBreadcrumb([
    { label: "Products", href: "/products" },
    { label: product.name },
  ])

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {product.name}
          </h1>
          <StatusBadge
            label={product.isActive ? "Active" : "Inactive"}
            color={product.isActive ? "emerald" : "destructive"}
          />
          <StatusBadge
            label={product.status === "active" ? "Published" : "Draft"}
            color={product.status === "active" ? "emerald" : "muted"}
          />
        </div>
        <span className="text-sm text-muted-foreground">{product.slug}</span>
      </div>

      <Button
        nativeButton={false}
        render={<Link href={`/products/${product.id}/edit/details`} />}
      >
        <Pencil />
        Edit
      </Button>
    </div>
  )
}

interface StatusBadgeProps {
  label: string
  color: "emerald" | "destructive" | "muted"
}

function StatusBadge({ label, color }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        color === "destructive" && "bg-destructive/10 text-destructive",
        color === "emerald" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        color === "muted" && "bg-muted text-muted-foreground"
      )}
    >
      {label}
    </span>
  )
}
