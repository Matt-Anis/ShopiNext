import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY!)

const FROM_EMAIL = "ShopiNext <noreply@mail.shopinext.mattanis.dev>"

const COLORS = {
  background: "#ffffff",
  foreground: "#0a0a0a",
  primary: "#fdc700",
  primaryForeground: "#733e0a",
  mutedForeground: "#737373",
  border: "#e5e5e5",
}

function renderEmail({
  heading,
  body,
  ctaLabel,
  ctaUrl,
}: {
  heading: string
  body: string
  ctaLabel: string
  ctaUrl: string
}) {
  return `
    <div style="background-color:${COLORS.background};padding:40px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <div style="max-width:420px;margin:0 auto;text-align:center;">
        <div style="margin-bottom:32px;">
          <span style="font-size:18px;font-weight:700;color:${COLORS.foreground};">ShopiNext</span>
        </div>
        <h1 style="font-size:20px;font-weight:600;color:${COLORS.foreground};margin:0 0 12px;">${heading}</h1>
        <p style="font-size:14px;line-height:1.6;color:${COLORS.mutedForeground};margin:0 0 28px;">${body}</p>
        <a href="${ctaUrl}" style="display:inline-block;background-color:${COLORS.primary};color:${COLORS.primaryForeground};font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">${ctaLabel}</a>
        <p style="font-size:12px;line-height:1.6;color:${COLORS.mutedForeground};margin:28px 0 0;">
          Or copy and paste this link into your browser:<br />
          <a href="${ctaUrl}" style="color:${COLORS.mutedForeground};word-break:break-all;">${ctaUrl}</a>
        </p>
        <p style="font-size:12px;color:${COLORS.mutedForeground};border-top:1px solid ${COLORS.border};margin-top:32px;padding-top:20px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    </div>
  `
}

export async function sendVerificationEmail(to: string, url: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Verify your email address",
    html: renderEmail({
      heading: "Verify your email",
      body: "Click the button below to verify your email address and finish setting up your ShopiNext account.",
      ctaLabel: "Verify email",
      ctaUrl: url,
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
      ctaLabel: "Reset password",
      ctaUrl: url,
    }),
  })
}
