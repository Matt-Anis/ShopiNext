import type { OrderStatus } from "@repo/db/public/schema"
import {
  resend,
  CUSTOMER_FROM_EMAIL,
  EMAIL_COLORS,
  escapeHtml,
} from "./client"

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

function renderOrderStatusHtml({
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
      <div style="background-color:#fafafa;border:1px solid ${EMAIL_COLORS.border};border-radius:8px;padding:16px;margin:24px 0 0;text-align:left;">
        <span style="font-size:12px;font-weight:600;text-transform:uppercase;color:${EMAIL_COLORS.mutedForeground};letter-spacing:0.05em;">Note from our team</span>
        <p style="font-size:14px;line-height:1.6;color:${EMAIL_COLORS.foreground};margin:8px 0 0;white-space:pre-wrap;">${escapeHtml(note)}</p>
      </div>
    `
    : ""

  return `
    <div style="background-color:${EMAIL_COLORS.background};padding:40px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <div style="max-width:440px;margin:0 auto;text-align:center;">
        <div style="margin-bottom:32px;">
          <span style="font-size:18px;font-weight:700;color:${EMAIL_COLORS.foreground};letter-spacing:-0.02em;">ShopiNext</span>
        </div>
        <div style="display:inline-block;background-color:#f4f4f5;border-radius:6px;padding:4px 12px;font-size:12px;font-weight:600;color:${EMAIL_COLORS.mutedForeground};margin-bottom:16px;">
          Order #${shortId}
        </div>
        <h1 style="font-size:20px;font-weight:600;color:${EMAIL_COLORS.foreground};margin:0 0 12px;">${heading}</h1>
        <p style="font-size:14px;line-height:1.6;color:${EMAIL_COLORS.mutedForeground};margin:0;">${message}</p>
        ${noteBlock}
        <p style="font-size:12px;color:${EMAIL_COLORS.mutedForeground};border-top:1px solid ${EMAIL_COLORS.border};margin-top:32px;padding-top:20px;">
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
      html: renderOrderStatusHtml({
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
