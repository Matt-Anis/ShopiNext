import { KeyRound, ShieldAlert, ShieldCheck } from "lucide-react"

import { Badge } from "@repo/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { formatProvider, type CustomerAccountItem } from "@/features/customers/queries"

interface CustomerAuthCardProps {
  providers: CustomerAccountItem[]
  emailVerified: boolean
}

export function CustomerAuthCard({
  providers,
  emailVerified,
}: CustomerAuthCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <KeyRound className="size-4 text-muted-foreground" />
          <CardTitle className="text-xs font-semibold tracking-wide uppercase">
            Authentication
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">
            Email Verification
          </span>
          <div className="flex items-center gap-2">
            {emailVerified ? (
              <>
                <ShieldCheck className="size-4 text-emerald-500" />
                <span className="font-medium text-foreground">Verified</span>
              </>
            ) : (
              <>
                <ShieldAlert className="size-4 text-amber-500" />
                <span className="font-medium text-muted-foreground">
                  Pending Verification
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">
            Sign-in Methods
          </span>
          {providers.length === 0 ? (
            <span className="text-xs text-muted-foreground">
              No linked providers found
            </span>
          ) : (
            <div className="flex flex-col gap-2">
              {providers.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-xs"
                >
                  <Badge variant="outline">{formatProvider(p.providerId)}</Badge>
                  <span className="text-muted-foreground">
                    Connected{" "}
                    {p.createdAt.toLocaleDateString(undefined, {
                      dateStyle: "short",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
