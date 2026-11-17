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
    <div>
      <header className="mb-8">
        <h1 className="page-heading">Your profile</h1>
        <p className="mt-5 text-muted-foreground">View your account details.</p>
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
