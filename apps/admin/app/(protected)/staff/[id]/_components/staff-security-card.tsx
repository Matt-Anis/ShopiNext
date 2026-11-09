"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Ban, Lock, Mail, Trash2, Undo2 } from "lucide-react"

import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { ConfirmDialog } from "@repo/ui/confirm-dialog"
import { Field, FieldLabel } from "@repo/ui/field"
import { Input } from "@repo/ui/input"
import { toast } from "@repo/ui/toast"
import { usePermission } from "@/hooks/use-permission"
import {
  banStaffMember,
  deleteStaffMember,
  sendStaffPasswordReset,
  unbanStaffMember,
} from "@/features/staff/actions"
import type { StaffDetails } from "@/features/staff/queries"

interface StaffSecurityCardProps {
  staff: StaffDetails
  currentUserId: string
}

export function StaffSecurityCard({
  staff,
  currentUserId,
}: StaffSecurityCardProps) {
  const router = useRouter()
  const canResetPassword = usePermission("user", "set-password")
  const canBan = usePermission("user", "ban")
  const canDelete = usePermission("user", "delete")

  const [isPending, startTransition] = useTransition()
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [banReason, setBanReason] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  if (!canResetPassword && !canBan && !canDelete) {
    return null
  }

  const isSelf = staff.id === currentUserId

  function handleSendPasswordReset() {
    startTransition(async () => {
      await toast
        .promise(sendStaffPasswordReset(staff.id), {
          loading: { title: "Sending password reset email..." },
          success: () => ({
            title: "Password reset email sent",
            description: `Sent a reset link to ${staff.email}.`,
          }),
          error: (error: Error) => ({
            title: "Failed to send reset email",
            description: error.message,
          }),
        })
        .catch(() => {})
    })
  }

  function handleBanConfirm() {
    startTransition(async () => {
      await toast
        .promise(banStaffMember(staff.id, banReason), {
          loading: { title: "Banning staff account..." },
          success: () => {
            setBanDialogOpen(false)
            setBanReason("")
            return { title: "Staff account banned" }
          },
          error: (error: Error) => ({
            title: "Failed to ban account",
            description: error.message,
          }),
        })
        .catch(() => {})
    })
  }

  function handleUnban() {
    startTransition(async () => {
      await toast
        .promise(unbanStaffMember(staff.id), {
          loading: { title: "Unbanning staff account..." },
          success: () => ({ title: "Staff account unbanned" }),
          error: (error: Error) => ({
            title: "Failed to unban account",
            description: error.message,
          }),
        })
        .catch(() => {})
    })
  }

  function handleDeleteConfirm() {
    startTransition(async () => {
      await toast
        .promise(deleteStaffMember(staff.id), {
          loading: { title: "Deleting staff account..." },
          success: () => {
            setDeleteDialogOpen(false)
            router.push("/staff")
            return { title: "Staff account deleted" }
          },
          error: (error: Error) => ({
            title: "Failed to delete account",
            description: error.message,
          }),
        })
        .catch(() => {})
    })
  }

  return (
    <>
      <Card data-testid="staff-security-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-muted-foreground" />
            <CardTitle className="text-xs font-semibold tracking-wide uppercase">
              Security &amp; Account Actions
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border text-sm">
          {canResetPassword && (
            <div className="flex flex-col justify-between gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-foreground">
                  Password Reset
                </span>
                <span className="text-xs text-muted-foreground">
                  Send a password reset link to {staff.email}.
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={handleSendPasswordReset}
                data-testid="staff-reset-password-button"
              >
                <Mail className="size-3.5" />
                Send reset email
              </Button>
            </div>
          )}

          {canBan && (
            <div className="flex flex-col justify-between gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-foreground">
                  {staff.banned ? "Account Banned" : "Ban Account"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {staff.banned
                    ? staff.banReason
                      ? `Banned — Reason: ${staff.banReason}`
                      : "This account is currently banned and cannot sign in."
                    : isSelf
                      ? "You cannot ban your own account."
                      : "Suspend access and revoke all active sessions."}
                </span>
              </div>
              {staff.banned ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={handleUnban}
                  data-testid="staff-unban-button"
                >
                  <Undo2 className="size-3.5" />
                  Unban account
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSelf || isPending}
                  onClick={() => setBanDialogOpen(true)}
                  data-testid="staff-ban-button"
                >
                  <Ban className="size-3.5" />
                  Ban account
                </Button>
              )}
            </div>
          )}

          {canDelete && (
            <div className="flex flex-col justify-between gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-foreground">
                  Delete Account
                </span>
                <span className="text-xs text-muted-foreground">
                  {isSelf
                    ? "You cannot delete your own account."
                    : "Permanently remove this staff account and all sessions."}
                </span>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isSelf || isPending}
                onClick={() => setDeleteDialogOpen(true)}
                data-testid="staff-delete-button"
              >
                <Trash2 className="size-3.5" />
                Delete account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={banDialogOpen}
        onOpenChange={setBanDialogOpen}
        title={`Ban ${staff.name || staff.email}?`}
        description={
          <div className="flex flex-col gap-3">
            <span>
              They will be signed out of all active sessions and prevented from
              signing in until unbanned.
            </span>
            <Field className="gap-1.5">
              <FieldLabel
                htmlFor="ban-reason"
                className="text-xs font-medium text-foreground"
              >
                Reason (optional)
              </FieldLabel>
              <Input
                id="ban-reason"
                type="text"
                value={banReason}
                onChange={(event) => setBanReason(event.target.value)}
                placeholder="e.g. Left the team"
                className="h-9 border-border bg-transparent"
                data-testid="staff-ban-reason-input"
              />
            </Field>
          </div>
        }
        confirmLabel="Ban account"
        destructive
        disabled={isPending}
        onConfirm={handleBanConfirm}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={`Delete ${staff.name || staff.email}?`}
        description="This action cannot be undone. This will permanently delete the staff account and revoke all of their sessions."
        confirmLabel="Delete account"
        destructive
        disabled={isPending}
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}
