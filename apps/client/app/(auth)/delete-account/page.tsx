import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@repo/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@repo/ui/card"
import { DeleteAccountConfirmation } from "./_components/delete-account-confirmation"

export const metadata: Metadata = {
  title: "Delete account | ShopiNext",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}

export default async function DeleteAccountPage({
  searchParams,
}: PageProps<"/delete-account">) {
  const { token } = await searchParams
  const hasToken = typeof token === "string" && token.length > 0

  return (
    <main>
      <Card>
        <CardHeader>
          <h1 className="font-heading text-xl font-semibold">
            Delete your account
          </h1>
          <CardDescription>
            This permanently removes your profile, sign-ins, and saved cart. You
            will lose access to your account and order history. Existing orders
            and their checkout email are retained for order handling. Deleting
            your account does not cancel your orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasToken ? (
            <DeleteAccountConfirmation token={token} />
          ) : (
            <div className="space-y-4">
              <p role="alert" className="text-sm text-muted-foreground">
                This deletion link is incomplete. Open the full link from your
                email, or request a new one in account settings.
              </p>
              <Button
                nativeButton={false}
                render={<Link href="/profile/settings" />}
              >
                Account settings
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
