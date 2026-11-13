"use client"

import { useState, useTransition } from "react"
import { Button } from "@repo/ui/button"
import { ConfirmDialog } from "@repo/ui/confirm-dialog"
import { FieldError } from "@repo/ui/field"
import { toast } from "@repo/ui/toast"
import { authClient } from "@/lib/auth-client"
import { SignInAgainButton } from "./sign-in-again-button"

export function AccountDeletionRequest({ email }: { email: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string>()
  const [sent, setSent] = useState(false)
  const [needsSignIn, setNeedsSignIn] = useState(false)

  function sendDeletionEmail() {
    setOpen(false)
    startTransition(async () => {
      setError(undefined)
      setSent(false)

      try {
        const result = await authClient.deleteUser({})

        if (result.error) {
          if (result.error.status === 401) {
            setNeedsSignIn(true)
          } else {
            setError(
              result.error.status === 429
                ? "Too many requests. Please wait before requesting another deletion email."
                : "We couldn't send a deletion email. Please try again."
            )
          }
          return
        }

        if (result.data?.message !== "Verification email sent") {
          throw new Error("Deletion email was not confirmed")
        }

        setSent(true)
        toast.add({
          title: "Deletion email sent",
          description:
            "Check your inbox to review and confirm account deletion.",
          type: "success",
        })
      } catch {
        setError("We couldn't send a deletion email. Please try again.")
      }
    })
  }

  return (
    <div className="space-y-4" aria-busy={isPending}>
      <p id="account-deletion-email" className="text-sm text-muted-foreground">
        We&apos;ll send a confirmation link to{" "}
        <span className="font-medium break-all text-foreground">{email}</span>.
      </p>
      <p id="account-deletion-notice" className="text-sm text-muted-foreground">
        Requesting an email keeps your account active. Deletion happens only
        after you open the link and confirm while signed in to this account.
      </p>
      <Button
        type="button"
        variant="destructive"
        disabled={isPending || needsSignIn}
        onClick={() => setOpen(true)}
        aria-describedby="account-deletion-email account-deletion-notice"
      >
        {isPending
          ? "Sending deletion email..."
          : sent
            ? "Send another deletion email"
            : "Delete account"}
      </Button>
      {sent && (
        <p role="status" className="text-sm text-muted-foreground">
          Check your inbox and spam folder for the confirmation link. It expires
          in 24 hours. If you change your mind, ignore the email.
        </p>
      )}
      <FieldError>{error}</FieldError>
      {needsSignIn && (
        <div className="space-y-3">
          <p role="alert" className="text-sm text-muted-foreground">
            Please sign in again before requesting account deletion.
          </p>
          <SignInAgainButton />
        </div>
      )}
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Send account deletion email?"
        description="We'll email you a link to review and confirm permanent deletion of your profile, sign-ins, and cart. Existing orders and their checkout email are retained. Your account stays active until you confirm using the link."
        confirmLabel="Send deletion email"
        destructive
        disabled={isPending}
        onConfirm={sendDeletionEmail}
      />
    </div>
  )
}
