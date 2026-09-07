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
          <StatusDot
            label={product.isActive ? "Active" : "Inactive"}
            color={product.isActive ? "emerald" : "destructive"}
          />
          <StatusDot
            label={product.status === "active" ? "Published" : "Draft"}
            color={product.status === "active" ? "emerald" : "muted"}
          />
        </div>
        <span className="text-sm text-muted-foreground">{product.slug}</span>
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

interface StatusDotProps {
  label: string
  color: "emerald" | "destructive" | "muted"
}

function StatusDot({ label, color }: StatusDotProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        color === "destructive" && "bg-destructive/10 text-destructive",
        color === "emerald" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        color === "muted" && "bg-muted text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          color === "destructive" && "bg-destructive",
          color === "emerald" && "bg-emerald-500 dark:bg-emerald-400",
          color === "muted" && "bg-muted-foreground"
        )}
      />
      {label}
    </span>
  )
}
