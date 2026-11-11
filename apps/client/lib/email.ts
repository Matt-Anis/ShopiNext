import { FROM_EMAIL, resend } from "@/lib/email/client"
import { renderEmail } from "@/lib/email/layout"

const ACCOUNT_EMAIL_FOOTER =
  "If you didn't request this, you can safely ignore this email."

export async function sendVerificationEmail(to: string, url: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Verify your email address",
    html: renderEmail({
      heading: "Verify your email",
      body: "Click the button below to verify your email address and finish setting up your ShopiNext account.",
      action: { label: "Verify email", url },
      footer: ACCOUNT_EMAIL_FOOTER,
    }),
  })
}

export async function sendPasswordResetEmail(to: string, url: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Reset your password",
    html: renderEmail({
      heading: "Reset your password",
      body: "Click the button below to choose a new password for your ShopiNext account.",
      action: { label: "Reset password", url },
      footer: ACCOUNT_EMAIL_FOOTER,
    }),
  })
}
