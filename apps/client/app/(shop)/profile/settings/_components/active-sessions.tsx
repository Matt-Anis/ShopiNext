import { Card, CardContent, CardDescription, CardHeader } from "@repo/ui/card"
import { getCustomerSessions } from "@/features/account/sessions"
import { SessionList } from "./session-list"
import { SignInAgainButton } from "./sign-in-again-button"

export async function ActiveSessions({
  currentSessionId,
}: {
  currentSessionId: string
}) {
  const result = await getCustomerSessions(currentSessionId)

  return (
    <Card>
      <CardHeader>
        <h2 className="font-heading text-lg font-semibold">
          Signed-in devices
        </h2>
        <CardDescription>
          See where you&apos;re signed in to your ShopiNext account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result.status === "ready" ? (
          <SessionList sessions={result.sessions} />
        ) : result.status === "reauthenticate" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please sign in again to view and manage your devices. This signs
              you out of this device first.
            </p>
            <SignInAgainButton />
          </div>
        ) : (
          <p role="alert" className="text-sm text-destructive">
            We couldn&apos;t load your signed-in devices. Please refresh the
            page to try again.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
