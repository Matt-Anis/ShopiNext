import { FROM_EMAIL, resend } from "@/lib/email/client"
import { renderOrderConfirmationEmail } from "@/lib/email/order-confirmation"

export async function sendOrderConfirmationEmail(order: {
  id: string
  checkoutEmail: string
  totalAmount: number
}) {
  const { data, error } = await resend.emails.send(
    {
      from: FROM_EMAIL,
      to: order.checkoutEmail,
      ...renderOrderConfirmationEmail({
        orderId: order.id,
        totalAmount: order.totalAmount,
      }),
    },
    { idempotencyKey: `order-confirmation/${order.id}` }
  )

  if (error) {
    throw new Error("Resend rejected the order confirmation email", {
      cause: error,
    })
  }

  if (!data?.id) {
    throw new Error("Resend returned no order confirmation email ID")
  }
}
