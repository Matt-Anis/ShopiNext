import type { ReactNode } from "react"
import { Card, CardContent, CardHeader } from "@repo/ui/card"
import { Skeleton } from "@repo/ui/skeleton"

export function AccountPageLoading({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">
        <div className="mb-8 space-y-3">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-5 w-full max-w-80" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  )
}
