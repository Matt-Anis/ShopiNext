import { Card, CardContent, CardDescription, CardHeader } from "@repo/ui/card"
import { AccountDeletionRequest } from "./account-deletion-request"

export function AccountDeletionSettings({ email }: { email: string }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-heading text-lg font-semibold">Delete account</h2>
        <CardDescription>
          Permanently remove your profile, sign-ins, and saved cart. You will
          lose access to your account and order history. Existing orders and
          their checkout email are retained for order handling. Deleting your
          account does not cancel your orders.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AccountDeletionRequest email={email} />
      </CardContent>
    </Card>
  )
}
