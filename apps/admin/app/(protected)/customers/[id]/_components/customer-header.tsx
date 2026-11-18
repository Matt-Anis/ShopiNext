"use client"

import { Calendar, Mail } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar"
import { Badge } from "@repo/ui/badge"
import { useBreadcrumb } from "../../../_components/breadcrumb-provider"
import type { CustomerDetails } from "@/features/customers/queries"

interface CustomerHeaderProps {
  customer: CustomerDetails
}

export function CustomerHeader({ customer }: CustomerHeaderProps) {
  const displayName = customer.name || customer.email
  useBreadcrumb([
    { label: "Customers", href: "/customers" },
    { label: displayName },
  ])

  return (
    <header className="flex min-w-0 items-start gap-3 rounded-xl border border-border bg-card p-4 sm:items-center sm:gap-4 sm:p-6">
      <Avatar size="lg" aria-hidden="true" className="size-11 shrink-0 sm:size-14">
        {customer.image && <AvatarImage src={customer.image} alt="" />}
        <AvatarFallback className="bg-brand/15 text-base font-semibold text-primary sm:text-lg">
          {customer.name.charAt(0).toUpperCase() || "C"}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1 className="min-w-0 text-2xl font-semibold tracking-tight wrap-anywhere sm:text-3xl">
            {displayName}
          </h1>
          <Badge variant={customer.emailVerified ? "secondary" : "outline"}>
            {customer.emailVerified ? "Email verified" : "Email unverified"}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {displayName !== customer.email && (
            <span className="flex min-w-0 items-center gap-1.5">
              <Mail aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="wrap-anywhere">{customer.email}</span>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar aria-hidden="true" className="size-3.5 shrink-0" />
            <span>
              Joined{" "}
              <time dateTime={customer.createdAt.toISOString()} suppressHydrationWarning>
                {customer.createdAt.toLocaleDateString(undefined, { dateStyle: "medium" })}
              </time>
            </span>
          </span>
        </div>
        <p className="text-xs wrap-anywhere text-muted-foreground">
          Customer ID <span className="font-mono">{customer.id}</span>
        </p>
      </div>
    </header>
  )
}
