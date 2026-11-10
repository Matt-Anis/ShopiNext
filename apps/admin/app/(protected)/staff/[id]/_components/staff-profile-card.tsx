"use client"

import { useState, useTransition } from "react"
import { UserCog } from "lucide-react"

import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { Field, FieldGroup, FieldLabel } from "@repo/ui/field"
import { Input } from "@repo/ui/input"
import { toast } from "@repo/ui/toast"
import { usePermission } from "@/hooks/use-permission"
import { updateStaffProfile } from "@/features/staff/actions"
import type { StaffDetails } from "@/features/staff/queries"

interface StaffProfileCardProps {
  staff: StaffDetails
}

export function StaffProfileCard({ staff }: StaffProfileCardProps) {
  const canUpdate = usePermission("user", "update")
  const canSetEmail = usePermission("user", "set-email")
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState(staff.name)
  const [email, setEmail] = useState(staff.email)

  const isDirty =
    name.trim() !== staff.name ||
    email.trim().toLowerCase() !== staff.email.toLowerCase()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    startTransition(async () => {
      await toast
        .promise(updateStaffProfile(staff.id, { name, email }), {
          loading: { title: "Updating staff profile..." },
          success: () => ({ title: "Staff profile updated" }),
          error: (error: Error) => ({
            title: "Failed to update profile",
            description: error.message,
          }),
        })
        .catch(() => {})
    })
  }

  return (
    <Card data-testid="staff-profile-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserCog className="size-4 text-muted-foreground" />
          <CardTitle className="text-xs font-semibold tracking-wide uppercase">
            Profile Details
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field className="gap-1.5">
              <FieldLabel
                htmlFor="staff-name"
                className="text-xs font-medium text-muted-foreground"
              >
                Name
              </FieldLabel>
              <Input
                id="staff-name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={!canUpdate || isPending}
                className="h-9 border-border bg-transparent"
                data-testid="staff-profile-name-input"
              />
            </Field>
            <Field className="gap-1.5">
              <FieldLabel
                htmlFor="staff-email"
                className="text-xs font-medium text-muted-foreground"
              >
                Email
              </FieldLabel>
              <Input
                id="staff-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={!canUpdate || !canSetEmail || isPending}
                className="h-9 border-border bg-transparent"
                data-testid="staff-profile-email-input"
              />
            </Field>
          </FieldGroup>

          {canUpdate && (
            <div className="mt-4 flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={!isDirty || isPending}
                data-testid="staff-profile-save-button"
              >
                Save changes
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
