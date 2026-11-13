"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@repo/ui/button"
import { FieldError } from "@repo/ui/field"
import { toast } from "@repo/ui/toast"
import { revokeCustomerSession } from "@/features/account/session-actions"
import type { CustomerSession } from "@/features/account/session-types"
import { SignInAgainButton } from "./sign-in-again-button"

export function SessionSignOutButton({
  session,
}: {
  session: CustomerSession
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string>()
  const [needsSignIn, setNeedsSignIn] = useState(false)

  function signOut() {
    startTransition(async () => {
      setError(undefined)

      try {
        const result = await revokeCustomerSession(session.id)
        if (result.status === "reauthenticate") {
          setNeedsSignIn(true)
          return
        }
        if (result.status === "error") {
          setError(result.message)
          return
        }
        if (result.signedOut) {
          router.replace("/login")
          router.refresh()
          return
        }

        toast.add({ title: "Device signed out", type: "success" })
      } catch {
        setError("We couldn't sign out this device. Please try again.")
      }
    })
  }

  return (
    <div className="space-y-3" aria-busy={isPending}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={signOut}
        disabled={isPending || needsSignIn}
        aria-label={
          session.isCurrent
            ? "Sign out this device"
            : `Sign out ${session.description}`
        }
      >
        {isPending
          ? "Signing out..."
          : session.isCurrent
            ? "Sign out this device"
            : "Sign out"}
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
    </div>
  )
}
