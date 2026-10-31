"use client"

import { Calendar, Key, Mail } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar"
import { Badge } from "@repo/ui/badge"
import { useBreadcrumb } from "../../../_components/breadcrumb-provider"
import type { CustomerDetails } from "@/features/customers/queries"

interface CustomerHeaderProps {
  customer: CustomerDetails
}

export function CustomerHeader({ customer }: CustomerHeaderProps) {
  useBreadcrumb([
    { label: "Customers", href: "/customers" },
    { label: customer.name || customer.email },
  ])

  const initial = customer.name
    ? customer.name.charAt(0).toUpperCase()
    : "C"

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-4">
        <Avatar size="lg" className="size-14 text-lg">
          {customer.image && (
            <AvatarImage src={customer.image} alt={customer.name} />
          )}
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {customer.name}
            </h1>
            <Badge variant={customer.emailVerified ? "secondary" : "outline"}>
              {customer.emailVerified ? "Verified" : "Unverified"}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Mail className="size-3.5" />
              {customer.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              Joined{" "}
              {customer.createdAt.toLocaleDateString(undefined, {
                dateStyle: "medium",
              })}
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <Key className="size-3" />
              ID: {customer.id}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
