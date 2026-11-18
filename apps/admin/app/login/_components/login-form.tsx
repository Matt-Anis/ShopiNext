"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"

import { cn } from "@repo/ui/utils"
import { authClient } from "@/lib/auth/client"
import { toast } from "@repo/ui/toast"
import { Button } from "@repo/ui/button"
import { Field, FieldGroup, FieldLabel } from "@repo/ui/field"
import { Input } from "@repo/ui/input"
import { PasswordInput } from "@repo/ui/password-input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    startTransition(async () => {
      const signInPromise = authClient.signIn
        .email({ email, password })
        .then((res) => {
          if (res.error) {
            throw new Error(res.error.message ?? "Something went wrong")
          }
          return res.data
        })

      await toast
        .promise(signInPromise, {
          loading: { title: "Signing in..." },
          success: () => {
            router.push("/")
            return { title: "Signed in successfully", description: undefined }
          },
          error: (error: Error) => ({
            title: "Login failed",
            description: error.message,
          }),
        })
        .catch(() => {})
    })
  }

  return (
    <div className={cn("space-y-7", className)} {...props}>
      <h1 className="text-3xl leading-none font-semibold tracking-tight sm:text-4xl">
        Sign in
      </h1>
      <form onSubmit={handleSubmit} data-testid="login-form">
        <FieldGroup className="gap-5">
          <Field className="gap-2">
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              placeholder="you@example.com"
              data-testid="login-email-input"
              className="h-11 border-input bg-card"
            />
          </Field>
          <Field className="gap-2">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              required
              data-testid="login-password-input"
              className="h-11 border-input bg-card"
            />
          </Field>
          <Field>
            <Button
              type="submit"
              className="mt-1 h-11 w-full font-semibold"
              disabled={isPending}
              data-testid="login-submit-button"
            >
              {isPending ? "Signing in…" : "Sign in"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
