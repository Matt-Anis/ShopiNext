"use client"

import { useState, useTransition } from "react"
import { Shield } from "lucide-react"

import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select"
import { toast } from "@repo/ui/toast"
import { usePermission } from "@/hooks/use-permission"
import type { RoleName } from "@/lib/auth/permissions"
import { updateStaffRole } from "@/features/staff/actions"
import {
  STAFF_ROLE_LABELS,
  STAFF_ROLE_OPTIONS,
} from "@/features/staff/constants"
import type { StaffDetails } from "@/features/staff/queries"

interface StaffRoleCardProps {
  staff: StaffDetails
  currentUserId: string
}

function resolveRoleName(role: string | null): RoleName {
  if (role && role in STAFF_ROLE_LABELS) {
    return role as RoleName
  }
  return "staff"
}

export function StaffRoleCard({ staff, currentUserId }: StaffRoleCardProps) {
  const canSetRole = usePermission("user", "set-role")
  const [isPending, startTransition] = useTransition()

  const initialRole = resolveRoleName(staff.role)
  const [role, setRole] = useState<RoleName>(initialRole)

  const isSelf = staff.id === currentUserId
  const isDirty = role !== initialRole
  const selectedRoleOption = STAFF_ROLE_OPTIONS.find(
    (option) => option.value === role
  )

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    startTransition(async () => {
      await toast
        .promise(updateStaffRole(staff.id, role), {
          loading: { title: "Updating role..." },
          success: () => ({ title: "Role updated" }),
          error: (error: Error) => ({
            title: "Failed to update role",
            description: error.message,
          }),
        })
        .catch(() => {})
    })
  }

  return (
    <Card data-testid="staff-role-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-muted-foreground" />
          <CardTitle className="text-xs font-semibold tracking-wide uppercase">
            Role &amp; Permissions
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field className="gap-1.5">
              <FieldLabel
                htmlFor="staff-role"
                className="text-xs font-medium text-muted-foreground"
              >
                Assigned Role
              </FieldLabel>
              <Select
                value={role}
                disabled={!canSetRole || isSelf || isPending}
                onValueChange={(value) => {
                  if (value) setRole(value as RoleName)
                }}
              >
                <SelectTrigger
                  id="staff-role"
                  className="h-9 w-full border-border bg-transparent sm:max-w-xs"
                  data-testid="staff-role-trigger"
                >
                  <SelectValue>
                    {(value: RoleName) => STAFF_ROLE_LABELS[value] ?? value}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {STAFF_ROLE_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        data-testid={`staff-role-option-${option.value}`}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {selectedRoleOption && (
                <FieldDescription className="text-xs">
                  {selectedRoleOption.description}
                </FieldDescription>
              )}
              {isSelf && canSetRole && (
                <p className="text-xs text-muted-foreground">
                  You cannot change your own role.
                </p>
              )}
            </Field>
          </FieldGroup>

          {canSetRole && !isSelf && (
            <div className="mt-4 flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={!isDirty || isPending}
                data-testid="staff-role-save-button"
              >
                Update role
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
