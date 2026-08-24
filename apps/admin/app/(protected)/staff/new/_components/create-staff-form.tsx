"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"

import { createStaffAccount } from "@/features/staff/actions"
import { toast } from "@repo/ui/toast"
import { Button } from "@repo/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card"
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
    <Card>
      <CardHeader>
        <CardTitle>New staff</CardTitle>
        <CardDescription>
          They&apos;ll receive an email to set their own password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} data-testid="create-staff-form">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                name="name"
                type="text"
                required
                data-testid="create-staff-name-input"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="staff@example.com"
                data-testid="create-staff-email-input"
              />
            </Field>
            <Field>
              <Button
                type="submit"
                disabled={isPending}
                data-testid="create-staff-submit-button"
              >
                Create staff account
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
