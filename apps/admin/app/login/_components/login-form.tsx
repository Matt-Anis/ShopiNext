"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"

import { cn } from "@repo/ui/utils"
import { authClient } from "@/lib/auth-client"
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
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Sign in</CardTitle>
          <CardDescription>
            Enter your credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} data-testid="login-form">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  data-testid="login-email-input"
                  className="border-border bg-transparent"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  data-testid="login-password-input"
                  className="border-border bg-transparent"
                />
              </Field>
              <Field>
                <Button
                  type="submit"
                  disabled={isPending}
                  data-testid="login-submit-button"
                >
                  Login
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
