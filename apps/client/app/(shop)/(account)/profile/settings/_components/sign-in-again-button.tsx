"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@repo/ui/button"
import { FieldError } from "@repo/ui/field"
import { signOutCustomer } from "@/features/account/sign-out"

export function SignInAgainButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string>()

  function signInAgain() {
    startTransition(async () => {
      setError(undefined)

      try {
        await signOutCustomer()
        router.replace("/login")
        router.refresh()
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to sign out. Please try again."
        )
      }
    })
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        onClick={signInAgain}
        disabled={isPending}
      >
        {isPending ? "Signing out..." : "Sign in again"}
      </Button>
      <FieldError>{error}</FieldError>
    </div>
  )
}
