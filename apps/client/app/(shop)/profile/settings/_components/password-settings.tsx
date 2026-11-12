import { Card, CardContent, CardDescription, CardHeader } from "@repo/ui/card"
import { hasCustomerPassword } from "@/features/account/credentials"
import { ChangePasswordForm } from "./change-password-form"

export async function PasswordSettings({ userId }: { userId: string }) {
  const hasPassword = await hasCustomerPassword(userId).catch(
    (error: unknown) => {
      console.error("Unable to load customer password settings", error)
      return null
    }
  )

  return (
    <Card>
      <CardHeader>
        <h2 className="font-heading text-lg font-semibold">Password</h2>
        <CardDescription>
          {hasPassword === null
            ? "Password settings are temporarily unavailable."
            : hasPassword
              ? "Choose a new password for your account."
              : "Your password is managed through Google."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasPassword === null ? (
          <p role="alert" className="text-sm text-destructive">
            We couldn&apos;t load your password settings. Please refresh the
            page to try again.
          </p>
        ) : hasPassword ? (
          <ChangePasswordForm />
        ) : (
          <p className="text-sm text-muted-foreground">
            You sign in with Google and don&apos;t have a ShopiNext password. To
            manage your password, visit{" "}
            <a
              href="https://myaccount.google.com/security"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4"
            >
              Google Account security (opens in a new tab)
            </a>
            .
          </p>
        )}
      </CardContent>
    </Card>
  )
}
