import { renderEmail } from "@/lib/email/layout"
import { formatPrice } from "@/lib/utils"

export function renderOrderConfirmationEmail({
  orderId,
  totalAmount,
}: {
  orderId: string
  totalAmount: number
}) {
  const reference = orderId.slice(0, 8)
  const body = `Your payment of ${formatPrice(totalAmount)} for order #${reference} has been confirmed. Thank you for shopping with ShopiNext.`
  const footer = "Keep this email for your records."

  return {
    subject: `Payment confirmed for order #${reference}`,
    html: renderEmail({ heading: "Payment confirmed", body, footer }),
    text: `ShopiNext\n\nPayment confirmed\n\n${body}\n\n${footer}`,
  }
}
