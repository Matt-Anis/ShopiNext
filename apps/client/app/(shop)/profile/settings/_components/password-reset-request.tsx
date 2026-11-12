"use client"

import { useState, useTransition } from "react"
import { Button } from "@repo/ui/button"
import { FieldError } from "@repo/ui/field"
import { toast } from "@repo/ui/toast"
import { requestPasswordReset } from "@/lib/request-password-reset"

export function PasswordResetRequest({ email }: { email: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string>()
  const [sent, setSent] = useState(false)

  function sendResetEmail() {
    startTransition(async () => {
      setError(undefined)
      setSent(false)

      await toast
        .promise(requestPasswordReset(email), {
          loading: { title: "Sending reset link..." },
          success: () => {
            setSent(true)
            return {
              title: "Reset link sent",
              description:
                "Check your email for a link to reset your password.",
            }
          },
          error: (error: unknown) => {
            const message =
              error instanceof Error
                ? error.message
                : "We couldn't send a password reset email. Please try again."
            setError(message)
            return { title: "Unable to send reset email", description: message }
          },
        })
        .catch(() => {})
    })
  }

  return (
    <div className="space-y-4" aria-busy={isPending}>
      <p id="password-reset-email" className="text-sm text-muted-foreground">
        We&apos;ll send a password reset link to{" "}
        <span className="font-medium break-all text-foreground">{email}</span>.
      </p>
      <p id="password-reset-notice" className="text-sm text-muted-foreground">
        Requesting a link keeps you signed in. Completing the reset signs you
        out on all devices, including this one.
      </p>
      <Button
        type="button"
        onClick={sendResetEmail}
        disabled={isPending}
        aria-describedby="password-reset-email password-reset-notice"
      >
        {isPending ? "Sending reset email..." : "Send password reset email"}
      </Button>
      {sent && (
        <p role="status" className="text-sm text-muted-foreground">
          Check your inbox for a link to reset your password.
        </p>
      )}
      <FieldError>{error}</FieldError>
    </div>
  )
}
