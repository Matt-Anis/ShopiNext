import { Laptop, Monitor, Smartphone } from "lucide-react"

import { Badge } from "@repo/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="size-4 text-muted-foreground" />
          <CardTitle className="text-xs font-semibold tracking-wide uppercase">
            Active Sessions
          </CardTitle>
        </div>
        <Badge variant="outline" className="text-xs">
          {activeSessions.length} active
        </Badge>
      </CardHeader>
      <CardContent>
        {activeSessions.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No active sessions on record.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border text-xs">
            {activeSessions.map((s) => {
              const { label, icon: Icon } = parseDevice(s.userAgent)
              return (
                <div
                  key={s.id}
                  className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <Icon className="size-3.5 text-muted-foreground" />
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
                    <span className="font-mono text-[11px] text-muted-foreground">
                      IP: {s.ipAddress}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
