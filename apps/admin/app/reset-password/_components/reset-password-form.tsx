"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Circle, X } from "lucide-react"

import { authClient } from "@/lib/auth-client"
import { resetPasswordFormSchema } from "@/lib/validations/auth"
import { cn } from "@repo/ui/utils"
import { toast } from "@repo/ui/toast"
import { Button } from "@repo/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@repo/ui/field"
import { Input } from "@repo/ui/input"

const passwordRules = [
  { label: "8-20 characters", test: (v: string) => v.length >= 8 && v.length <= 20 },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "One number", test: (v: string) => /[0-9]/.test(v) },
]

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{
    password?: string
    confirmPassword?: string
  }>({})

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const result = resetPasswordFormSchema.safeParse({
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    })

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      setErrors({
        password: fieldErrors.password?.[0],
        confirmPassword: fieldErrors.confirmPassword?.[0],
      })
      return
    }

    setErrors({})

    startTransition(async () => {
      const resetPromise = authClient
        .resetPassword({ newPassword: result.data.password, token })
        .then((res) => {
          if (res.error) {
            throw new Error(res.error.message ?? "Something went wrong")
          }
          return res.data
        })

      await toast
        .promise(resetPromise, {
          loading: { title: "Setting password..." },
          success: () => {
            router.push("/login")
            return { title: "Password set successfully", description: undefined }
          },
          error: (error: Error) => ({
            title: "Couldn't set password",
            description: error.message,
          }),
        })
        .catch(() => {})
    })
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Set your password</CardTitle>
        <CardDescription>
          Choose a password for your ShopiNext admin account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} data-testid="reset-password-form">
          <FieldGroup>
            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">New password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={!!errors.password}
                className="border-border bg-transparent"
                data-testid="reset-password-password-input"
              />
              <ul className="flex flex-col gap-0.5 text-xs">
                {passwordRules.map((rule) => {
                  const touched = password.length > 0
                  const satisfied = rule.test(password)
                  const Icon = !touched ? Circle : satisfied ? Check : X

                  return (
                    <li
                      key={rule.label}
                      className={cn(
                        "flex items-center gap-1.5",
                        touched && !satisfied
                          ? "text-destructive"
                          : "text-muted-foreground"
                      )}
                    >
                      <Icon className="size-3" />
                      {rule.label}
                    </li>
                  )
                })}
              </ul>
              <FieldError>{errors.password}</FieldError>
            </Field>
            <Field data-invalid={!!errors.confirmPassword}>
              <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                aria-invalid={!!errors.confirmPassword}
                className="border-border bg-transparent"
                data-testid="reset-password-confirm-password-input"
              />
              <FieldError>{errors.confirmPassword}</FieldError>
            </Field>
            <Field>
              <Button
                type="submit"
                disabled={isPending}
                data-testid="reset-password-submit-button"
              >
                Set password
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
