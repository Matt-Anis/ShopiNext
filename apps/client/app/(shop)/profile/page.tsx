import type { Metadata } from "next"
import { requireCustomerSession } from "@/lib/require-customer-session"
import { ProfileDetails } from "./_components/profile-details"

export const metadata: Metadata = {
  title: "Your profile | ShopiNext",
  robots: { index: false, follow: false },
}

export default async function ProfilePage() {
  const { user } = await requireCustomerSession()

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 md:py-16">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Your profile
        </h1>
        <p className="mt-2 text-muted-foreground">
          View your account details.
        </p>
      </header>
      <ProfileDetails
        name={user.name}
        email={user.email}
        emailVerified={user.emailVerified}
        createdAt={user.createdAt}
      />
    </div>
  )
}
