import { KeyRound } from "lucide-react"

import { Badge } from "@repo/ui/badge"
import { Card, CardContent, CardHeader } from "@repo/ui/card"
import { formatProvider } from "@/features/customers/utils"
import type { CustomerAccountItem } from "@/features/customers/queries"

interface CustomerAuthCardProps {
  providers: CustomerAccountItem[]
}

export function CustomerAuthCard({ providers }: CustomerAuthCardProps) {
  return (
    <Card size="sm" className="min-w-0 rounded-xl border border-border shadow-none ring-0 dark:ring-0">
      <CardHeader className="flex items-center gap-2">
        <KeyRound aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Sign-in methods</h2>
      </CardHeader>
      <CardContent>
        {providers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No linked sign-in methods.</p>
        ) : (
          <ul className="divide-y divide-border text-xs">
            {providers.map((provider) => (
              <li
                key={provider.id}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2.5 first:pt-0 last:pb-0"
              >
                <Badge variant="outline" className="max-w-full whitespace-normal wrap-anywhere">
                  {formatProvider(provider.providerId)}
                </Badge>
                <span className="text-muted-foreground">
                  Connected{" "}
                  <time dateTime={provider.createdAt.toISOString()}>
                    {provider.createdAt.toLocaleDateString(undefined, { dateStyle: "short" })}
                  </time>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
