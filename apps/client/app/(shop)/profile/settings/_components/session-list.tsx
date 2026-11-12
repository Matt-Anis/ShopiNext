import { Monitor, Smartphone, Tablet, CircleHelp } from "lucide-react"
import type { CustomerSession } from "@/features/account/session-types"

const deviceIcons = {
  computer: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
  unknown: CircleHelp,
}

export function SessionList({ sessions }: { sessions: CustomerSession[] }) {
  return (
    <ul className="divide-y divide-border">
      {sessions.map((session) => {
        const DeviceIcon = deviceIcons[session.deviceType]

        return (
          <li
            key={session.id}
            className="flex items-start gap-3 py-4 first:pt-0 last:pb-0"
          >
            <DeviceIcon
              className="mt-0.5 size-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{session.description}</p>
                {session.isCurrent && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    This device
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Signed in{" "}
                <time dateTime={session.startedAt}>
                  {session.startedAtLabel}
                </time>
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
