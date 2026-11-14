import { FROM_EMAIL, sendEmail } from "@/lib/email/client"
import { renderEmail } from "@/lib/email/layout"

export async function sendAccountDeletionEmail(to: string, url: string) {
  const { data, error } = await sendEmail({
    from: FROM_EMAIL,
    to,
    subject: "Confirm your ShopiNext account deletion",
    html: renderEmail({
      heading: "Delete your account?",
      body: "You requested to permanently delete your ShopiNext account. Confirming removes your profile, sign-ins, and cart. Existing orders and their checkout email are retained. This link expires in 24 hours. You must be signed in to the account you want to delete.",
      action: { label: "Review account deletion", url },
      footer:
        "If you didn't request this, ignore this email. Your account will remain active.",
    }),
  })

  if (error) {
    throw new Error("Resend rejected the account deletion email", {
      cause: error,
    })
  }

  if (!data?.id) {
    throw new Error("Resend returned no account deletion email ID")
  }
}
