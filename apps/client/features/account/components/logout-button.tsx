"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@repo/ui/button"
import { FieldError } from "@repo/ui/field"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/alert-dialog"
import { signOutCustomer } from "@/features/account/sign-out"

export function LogoutButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string>()

  function logout() {
    startTransition(async () => {
      setError(undefined)

      try {
        await signOutCustomer()
        setOpen(false)
        router.replace("/")
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
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPending) return
        setError(undefined)
        setOpen(nextOpen)
      }}
    >
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            className="h-10 text-muted-foreground hover:text-destructive md:w-full md:justify-start"
            data-testid="logout-button"
          />
        }
      >
        <LogOut aria-hidden="true" />
        Log out
      </AlertDialogTrigger>
      <AlertDialogContent size="sm" aria-busy={isPending}>
        <AlertDialogHeader>
          <AlertDialogTitle>Log out?</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ll need to sign in again to access your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <FieldError>{error}</FieldError>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isPending}
            data-testid="logout-cancel-button"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={logout}
            data-testid="logout-confirm-button"
          >
            {isPending ? "Signing out..." : "Log out"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
