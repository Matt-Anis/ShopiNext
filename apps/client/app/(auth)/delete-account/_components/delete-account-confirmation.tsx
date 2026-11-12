"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Button } from "@repo/ui/button"
import { FieldError } from "@repo/ui/field"
import { authClient } from "@/lib/auth-client"

export function DeleteAccountConfirmation({ token }: { token: string }) {
  const {
    data: session,
    isPending: sessionPending,
    error: sessionError,
  } = authClient.useSession()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<
    "ready" | "invalid-link" | "reauthenticate"
  >("ready")
  const [error, setError] = useState<string>()

  function deleteAccount() {
    startTransition(async () => {
      setError(undefined)

      try {
        const result = await authClient.deleteUser({ token })

        if (result.error) {
          if (
            result.error.status === 401 ||
            result.error.code === "FAILED_TO_GET_USER_INFO"
          ) {
            setStatus("reauthenticate")
          } else if (result.error.code === "INVALID_TOKEN") {
            setStatus("invalid-link")
          } else {
            setError(
              "We couldn't confirm deletion. Try again, or request a new link in account settings."
            )
          }
          return
        }

        if (!result.data?.success) {
          throw new Error("Account deletion was not confirmed")
        }

        window.location.replace("/")
      } catch {
        setError(
          "We couldn't confirm deletion. Try again, or request a new link in account settings."
        )
      }
    })
  }

  if (sessionPending) {
    return (
      <p role="status" className="text-sm">
        Checking your sign-in...
      </p>
    )
  }

  if (sessionError) {
    return (
      <div className="space-y-4">
        <FieldError>
          We couldn&apos;t check your sign-in. Please reload to try again.
        </FieldError>
        <Button onClick={() => window.location.reload()}>Reload page</Button>
      </div>
    )
  }

  if (!session || status === "reauthenticate") {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-sm text-muted-foreground">
          Sign in to the account that requested deletion, then reopen this link
          from your email. If you already deleted your account, this link cannot
          be used again.
        </p>
        <Button nativeButton={false} render={<Link href="/login" />}>
          Sign in
        </Button>
      </div>
    )
  }

  if (status === "invalid-link") {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-sm text-muted-foreground">
          This link is invalid, expired, already used, or belongs to a different
          account. Sign in to the correct account and request a new deletion
          email in account settings.
        </p>
        <Button nativeButton={false} render={<Link href="/profile/settings" />}>
          Account settings
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4" aria-busy={isPending}>
      <p className="text-sm text-muted-foreground">
        You are signed in as{" "}
        <span className="font-medium break-all text-foreground">
          {session.user.email}
        </span>
        . Continue only if this is the account you want to delete. This cannot
        be undone and will sign you out on every device.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="destructive"
          onClick={deleteAccount}
          disabled={isPending}
        >
          {isPending ? "Deleting account..." : "Delete my account"}
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/profile/settings" />}
          disabled={isPending}
        >
          Keep my account
        </Button>
      </div>
      <FieldError>{error}</FieldError>
      {error && (
        <Link
          href="/profile/settings"
          className="text-sm underline underline-offset-4"
        >
          Request a new link in account settings
        </Link>
      )}
    </div>
  )
}
