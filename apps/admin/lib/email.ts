import { Resend } from "resend"
import type { OrderStatus } from "@repo/db/public/schema"

const resend = new Resend(process.env.RESEND_API_KEY!)

const STAFF_FROM_EMAIL = "ShopiNext Admin <noreply@mail.shopinext.mattanis.dev>"
const CUSTOMER_FROM_EMAIL = "ShopiNext <noreply@mail.shopinext.mattanis.dev>"

const COLORS = {
  background: "#ffffff",
  foreground: "#0a0a0a",
  primary: "#fdc700",
  primaryForeground: "#733e0a",
  mutedForeground: "#737373",
  border: "#e5e5e5",
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
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
    from: STAFF_FROM_EMAIL,
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

const STATUS_CONTENT: Record<
  OrderStatus,
  { subject: string; heading: string; message: string }
> = {
  paid: {
    subject: "Payment confirmed",
    heading: "Payment Received",
    message:
      "We've received your payment. Your order is confirmed and will be processed shortly.",
  },
  processing: {
    subject: "Order is processing",
    heading: "We're Preparing Your Order",
    message:
      "Your order is now being processed and packed. We'll send you another update once it's on its way.",
  },
  shipped: {
    subject: "Order shipped",
    heading: "Your Order Is on the Way",
    message:
      "Your package has been dispatched. Keep an eye out for its arrival!",
  },
  delivered: {
    subject: "Order delivered",
    heading: "Order Delivered",
    message:
      "Your order has been delivered. We hope you enjoy your purchase!",
  },
  cancelled: {
    subject: "Order cancelled",
    heading: "Order Cancelled",
    message:
      "Your order has been cancelled. If you have any questions, please reach out to our team.",
  },
  refunded: {
    subject: "Order refunded",
    heading: "Order Refunded",
    message:
      "A refund has been issued for your order. Depending on your bank, it may take a few business days for the funds to reflect.",
  },
}

function renderStatusEmail({
  orderId,
  heading,
  message,
  note,
}: {
  orderId: string
  heading: string
  message: string
  note?: string
}) {
  const shortId = orderId.slice(0, 8).toUpperCase()
  const noteBlock = note
    ? `
      <div style="background-color:#fafafa;border:1px solid ${COLORS.border};border-radius:8px;padding:16px;margin:24px 0 0;text-align:left;">
        <span style="font-size:12px;font-weight:600;text-transform:uppercase;color:${COLORS.mutedForeground};letter-spacing:0.05em;">Note from our team</span>
        <p style="font-size:14px;line-height:1.6;color:${COLORS.foreground};margin:8px 0 0;white-space:pre-wrap;">${escapeHtml(note)}</p>
      </div>
    `
    : ""

  return `
    <div style="background-color:${COLORS.background};padding:40px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <div style="max-width:440px;margin:0 auto;text-align:center;">
        <div style="margin-bottom:32px;">
          <span style="font-size:18px;font-weight:700;color:${COLORS.foreground};letter-spacing:-0.02em;">ShopiNext</span>
        </div>
        <div style="display:inline-block;background-color:#f4f4f5;border-radius:6px;padding:4px 12px;font-size:12px;font-weight:600;color:${COLORS.mutedForeground};margin-bottom:16px;">
          Order #${shortId}
        </div>
        <h1 style="font-size:20px;font-weight:600;color:${COLORS.foreground};margin:0 0 12px;">${heading}</h1>
        <p style="font-size:14px;line-height:1.6;color:${COLORS.mutedForeground};margin:0;">${message}</p>
        ${noteBlock}
        <p style="font-size:12px;color:${COLORS.mutedForeground};border-top:1px solid ${COLORS.border};margin-top:32px;padding-top:20px;">
          Thank you for shopping with us.
        </p>
      </div>
    </div>
  `
}

export async function sendOrderStatusEmail({
  to,
  orderId,
  status,
  note,
}: {
  to: string
  orderId: string
  status: OrderStatus
  note?: string
}) {
  if (!process.env.RESEND_API_KEY) {
    return
  }

  const shortId = orderId.slice(0, 8).toUpperCase()
  const content = STATUS_CONTENT[status]
  const subject = `Order #${shortId}: ${content.subject}`

  try {
    await resend.emails.send({
      from: CUSTOMER_FROM_EMAIL,
      to,
      subject,
      html: renderStatusEmail({
        orderId,
        heading: content.heading,
        message: content.message,
        note,
      }),
    })
  } catch (error) {
    console.error("Failed to send order status email:", error)
  }
}
