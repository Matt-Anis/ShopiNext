import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY!)

const FROM_EMAIL = "ShopiNext Admin <noreply@mail.shopinext.mattanis.dev>"

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
          <span style="font-size:18px;font-weight:700;color:${COLORS.foreground};">ShopiNext Admin</span>
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

export async function sendStaffSetPasswordEmail(to: string, url: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Set up your ShopiNext admin account",
    html: renderEmail({
      heading: "Set your password",
      body: "An admin created a staff account for you. Click the button below to set your password and get started.",
      ctaLabel: "Set password",
      ctaUrl: url,
    }),
  })
}
