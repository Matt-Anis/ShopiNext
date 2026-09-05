"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"

import { createStaffAccount } from "@/features/staff/actions"
import { toast } from "@repo/ui/toast"
import { Button } from "@repo/ui/button"
import { Field, FieldGroup, FieldLabel } from "@repo/ui/field"
import { Input } from "@repo/ui/input"

export function CreateStaffForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string

    startTransition(async () => {
      const createPromise = createStaffAccount(name, email)

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
