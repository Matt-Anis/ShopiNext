"use client"

import { Calendar, Key, Mail } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar"
import { Badge } from "@repo/ui/badge"
import { useBreadcrumb } from "../../../_components/breadcrumb-provider"
import { formatStaffRole } from "@/features/staff/constants"
import type { StaffDetails } from "@/features/staff/queries"

interface StaffHeaderProps {
  staff: StaffDetails
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function StaffHeader({ staff }: StaffHeaderProps) {
  useBreadcrumb([
    { label: "Staff", href: "/staff" },
    { label: staff.name || staff.email },
  ])

  const initials = staff.name ? getInitials(staff.name) : "S"

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-4">
        <Avatar size="lg" className="size-14 text-lg">
          {staff.image && <AvatarImage src={staff.image} alt={staff.name} />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1
              className="text-2xl font-semibold tracking-tight"
              data-testid="staff-detail-name"
            >
              {staff.name || staff.email}
            </h1>
            <Badge variant="outline" data-testid="staff-detail-role-badge">
              {formatStaffRole(staff.role)}
            </Badge>
            <Badge variant={staff.emailVerified ? "secondary" : "outline"}>
              {staff.emailVerified ? "Verified" : "Unverified"}
            </Badge>
            {staff.banned && (
              <Badge variant="destructive" data-testid="staff-detail-banned-badge">
                Banned
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span
              className="flex items-center gap-1.5"
              data-testid="staff-detail-email"
            >
              <Mail className="size-3.5" />
              {staff.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              Joined{" "}
              {staff.createdAt.toLocaleDateString(undefined, {
                dateStyle: "medium",
              })}
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <Key className="size-3" />
              ID: {staff.id}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
