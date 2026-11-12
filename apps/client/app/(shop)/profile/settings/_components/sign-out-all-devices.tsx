"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@repo/ui/button"
import { ConfirmDialog } from "@repo/ui/confirm-dialog"
import { FieldError } from "@repo/ui/field"
import { toast } from "@repo/ui/toast"
import { revokeAllCustomerSessions } from "@/features/account/session-actions"
import { SignInAgainButton } from "./sign-in-again-button"

export function SignOutAllDevices() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string>()
  const [needsSignIn, setNeedsSignIn] = useState(false)

  function signOutAllDevices() {
    startTransition(async () => {
      setError(undefined)

      try {
        const result = await revokeAllCustomerSessions()
        setOpen(false)

        if (result.status === "reauthenticate") {
          setNeedsSignIn(true)
          return
        }
        if (result.status === "error") {
          setError(result.message)
          return
        }

        toast.add({ title: "Signed out on all devices", type: "success" })
        router.replace("/login")
        router.refresh()
      } catch {
        setOpen(false)
        setError("We couldn't sign out all devices. Please try again.")
      }
    })
  }

  return (
    <div className="space-y-3" aria-busy={isPending}>
      <Button
        type="button"
        variant="destructive"
        disabled={isPending || needsSignIn}
        onClick={() => setOpen(true)}
      >
        {isPending ? "Signing out..." : "Sign out all devices"}
      </Button>
      <FieldError>{error}</FieldError>
      {needsSignIn && (
        <div className="space-y-3">
          <p role="alert" className="text-sm text-muted-foreground">
            Please sign in again to manage your devices.
          </p>
          <SignInAgainButton />
        </div>
      )}
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Sign out all devices?"
        description="You'll be signed out of ShopiNext on every device, including this one. You'll need to sign in again."
        confirmLabel={isPending ? "Signing out..." : "Sign out all devices"}
        destructive
        disabled={isPending}
        onConfirm={signOutAllDevices}
      />
    </div>
  )
}
