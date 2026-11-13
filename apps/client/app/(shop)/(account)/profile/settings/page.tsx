import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader } from "@repo/ui/card"
import { requireCustomerSession } from "@/lib/require-customer-session"
import { ProfileNameForm } from "./_components/profile-name-form"
import { PasswordSettings } from "./_components/password-settings"
import { ActiveSessions } from "./_components/active-sessions"
import { AccountDeletionSettings } from "./_components/account-deletion-settings"

export const metadata: Metadata = {
  title: "Account settings | ShopiNext",
  robots: { index: false, follow: false },
}

export default async function ProfileSettingsPage() {
  const { user, session } = await requireCustomerSession()

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Account settings
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage your name and account security.
        </p>
      </header>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="font-heading text-lg font-semibold">Full name</h2>
            <CardDescription>
              Choose how your name appears in your profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileNameForm key={user.name} initialName={user.name} />
          </CardContent>
        </Card>
        <PasswordSettings userId={user.id} email={user.email} />
        <ActiveSessions currentSessionId={session.id} />
        <AccountDeletionSettings email={user.email} />
      </div>
    </div>
  )
}
