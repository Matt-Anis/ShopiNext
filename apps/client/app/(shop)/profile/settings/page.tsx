import type { Metadata } from "next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@repo/ui/card"
import { requireCustomerSession } from "@/lib/require-customer-session"
import { AccountNavigation } from "@/features/account/components/account-navigation"
import { ProfileNameForm } from "./_components/profile-name-form"

export const metadata: Metadata = {
  title: "Account settings | ShopiNext",
  robots: { index: false, follow: false },
}

export default async function ProfileSettingsPage() {
  const { user } = await requireCustomerSession()

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 md:py-16">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Account settings
        </h1>
        <p className="mt-2 text-muted-foreground">
          Update the name on your account.
        </p>
      </header>
      <AccountNavigation currentPath="/profile/settings" />
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
    </div>
  )
}
