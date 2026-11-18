import { Laptop, Monitor, Smartphone } from "lucide-react"

import { Badge } from "@repo/ui/badge"
import { Card, CardContent, CardHeader } from "@repo/ui/card"
import type { CustomerSessionItem } from "@/features/customers/queries"

interface CustomerSessionsCardProps {
  sessions: CustomerSessionItem[]
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

export function CustomerSessionsCard({ sessions }: CustomerSessionsCardProps) {
  const activeSessions = sessions.filter(
    (s) => new Date(s.expiresAt) > new Date()
  )

  return (
    <Card size="sm" className="min-w-0 rounded-xl border border-border shadow-none ring-0 dark:ring-0">
      <CardHeader className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex items-center gap-2">
          <Monitor aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Active sessions</h2>
        </div>
        {activeSessions.length > 0 && (
          <Badge variant="outline">{activeSessions.length} active</Badge>
        )}
      </CardHeader>
      <CardContent>
        {activeSessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active sessions on record.
          </p>
        ) : (
          <ul className="divide-y divide-border text-xs">
            {activeSessions.map((s) => {
              const { label, icon: Icon } = parseDevice(s.userAgent)
              return (
                <li
                  key={s.id}
                  className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <Icon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
                      {label}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Expires{" "}
                      {s.expiresAt.toLocaleDateString(undefined, {
                        dateStyle: "short",
                      })}
                    </span>
                  </div>
                  {s.ipAddress && (
                    <span className="font-mono text-[11px] wrap-anywhere text-muted-foreground">
                      IP: {s.ipAddress}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
