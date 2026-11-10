"use client"

import { useTransition } from "react"
import { Laptop, LogOut, Monitor, Smartphone } from "lucide-react"

import { Badge } from "@repo/ui/badge"
import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { toast } from "@repo/ui/toast"
import { usePermission } from "@/hooks/use-permission"
import {
  revokeAllStaffSessions,
  revokeStaffSession,
} from "@/features/staff/actions"
import type { StaffSessionItem } from "@/features/staff/queries"

interface StaffSessionsCardProps {
  staffId: string
  sessions: StaffSessionItem[]
  currentSessionId: string
}

function parseDevice(userAgent: string | null) {
  if (!userAgent) return { label: "Unknown Device", icon: Monitor }
  const ua = userAgent.toLowerCase()
  if (
    ua.includes("mobile") ||
    ua.includes("iphone") ||
    ua.includes("android")
  ) {
    return { label: "Mobile Device", icon: Smartphone }
  }
  return { label: "Desktop Browser", icon: Laptop }
}

export function StaffSessionsCard({
  staffId,
  sessions,
  currentSessionId,
}: StaffSessionsCardProps) {
  const canRevoke = usePermission("session", "revoke")
  const [isPending, startTransition] = useTransition()

  const activeSessions = sessions.filter(
    (s) => new Date(s.expiresAt) > new Date()
  )
  const revocableSessions = activeSessions.filter(
    (s) => s.id !== currentSessionId
  )

  function handleRevokeSession(sessionId: string) {
    startTransition(async () => {
      await toast
        .promise(revokeStaffSession(staffId, sessionId), {
          loading: { title: "Revoking session..." },
          success: () => ({ title: "Session revoked" }),
          error: (error: Error) => ({
            title: "Failed to revoke session",
            description: error.message,
          }),
        })
        .catch(() => {})
    })
  }

  function handleRevokeAll() {
    startTransition(async () => {
      await toast
        .promise(revokeAllStaffSessions(staffId), {
          loading: { title: "Revoking sessions..." },
          success: () => ({ title: "All active sessions revoked" }),
          error: (error: Error) => ({
            title: "Failed to revoke sessions",
            description: error.message,
          }),
        })
        .catch(() => {})
    })
  }

  return (
    <Card data-testid="staff-sessions-card">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Monitor className="size-4 text-muted-foreground" />
          <CardTitle className="text-xs font-semibold tracking-wide uppercase">
            Active Sessions
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {activeSessions.length} active
          </Badge>
          {canRevoke && revocableSessions.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              disabled={isPending}
              onClick={handleRevokeAll}
              data-testid="revoke-all-sessions-button"
            >
              Revoke all
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {activeSessions.length === 0 ? (
          <p
            className="text-xs text-muted-foreground"
            data-testid="staff-sessions-empty"
          >
            No active sessions on record.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border text-xs">
            {activeSessions.map((s) => {
              const { label, icon: Icon } = parseDevice(s.userAgent)
              const isCurrent = s.id === currentSessionId

              return (
                <div
                  key={s.id}
                  className="flex flex-col gap-1.5 py-2.5 first:pt-0 last:pb-0"
                  data-testid={`staff-session-row-${s.id}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <Icon className="size-3.5 text-muted-foreground" />
                      {label}
                      {isCurrent && (
                        <Badge variant="secondary" className="text-[10px]">
                          Current
                        </Badge>
                      )}
                    </span>
                    {canRevoke && !isCurrent && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        disabled={isPending}
                        onClick={() => handleRevokeSession(s.id)}
                        data-testid={`revoke-session-${s.id}`}
                      >
                        <LogOut className="size-3" />
                        Revoke
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      {s.ipAddress ? `IP: ${s.ipAddress}` : "IP: Unknown"}
                    </span>
                    <span>
                      Expires{" "}
                      {s.expiresAt.toLocaleDateString(undefined, {
                        dateStyle: "short",
                      })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
