"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { createStaffAccount } from "@/features/staff/actions"
import {
  STAFF_ROLE_LABELS,
  STAFF_ROLE_OPTIONS,
} from "@/features/staff/constants"
import type { RoleName } from "@/lib/auth/permissions"
import { toast } from "@repo/ui/toast"
import { Button } from "@repo/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/field"
import { Input } from "@repo/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select"
import { useBreadcrumb } from "../../../_components/breadcrumb-provider"

const breadcrumbItems = [{ label: "Staff", href: "/staff" }, { label: "New staff" }]

export function CreateStaffForm() {
  useBreadcrumb(breadcrumbItems)

  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [role, setRole] = useState<RoleName>("staff")

  const selectedRoleOption = STAFF_ROLE_OPTIONS.find(
    (option) => option.value === role
  )

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string

    startTransition(async () => {
      const createPromise = createStaffAccount(name, email, role)

      await toast
        .promise(createPromise, {
          loading: { title: "Creating staff account..." },
          success: () => {
            router.push("/staff")
            return {
              title: "Staff account created",
              description: "They'll get an email to set their password.",
            }
          },
          error: (error: Error) => ({
            title: "Failed to create staff account",
            description: error.message,
          }),
        })
        .catch(() => {})
    })
  }

  return (
    <form onSubmit={handleSubmit} data-testid="create-staff-form">
      <FieldGroup className="mt-8 gap-5">
        <Field className="gap-1.5">
          <FieldLabel
            htmlFor="name"
            className="text-sm font-medium text-foreground/80"
          >
            Name
          </FieldLabel>
          <Input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Jordan Ellis"
            className="h-9 border-border bg-transparent"
            data-testid="create-staff-name-input"
          />
        </Field>
        <Field className="gap-1.5">
          <FieldLabel
            htmlFor="email"
            className="text-sm font-medium text-foreground/80"
          >
            Email
          </FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="staff@example.com"
            className="h-9 border-border bg-transparent"
            data-testid="create-staff-email-input"
          />
        </Field>
        <Field className="gap-1.5">
          <FieldLabel
            htmlFor="role"
            className="text-sm font-medium text-foreground/80"
          >
            Role
          </FieldLabel>
          <Select
            value={role}
            onValueChange={(value) => {
              if (value) setRole(value as RoleName)
            }}
          >
            <SelectTrigger
              id="role"
              className="h-9 w-full border-border bg-transparent"
              data-testid="create-staff-role-trigger"
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
                    data-testid={`create-staff-role-option-${option.value}`}
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
        </Field>
      </FieldGroup>

      <div className="mt-7 flex items-center gap-3 pt-4">
        <Button
          type="submit"
          disabled={isPending}
          data-testid="create-staff-submit-button"
        >
          Create staff account
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/staff")}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
