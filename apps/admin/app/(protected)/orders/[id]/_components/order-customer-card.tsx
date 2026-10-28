import { CreditCard, Mail, User } from "lucide-react"

interface OrderCustomerCardProps {
  customerEmail: string
  userId: string | null
  stripeSessionId: string
}

export function OrderCustomerCard({
  customerEmail,
  userId,
  stripeSessionId,
}: OrderCustomerCardProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <User className="size-4 text-muted-foreground" />
        <h2 className="text-xs font-semibold tracking-wide text-foreground uppercase">
          Customer & Payment
        </h2>
      </div>

      <dl className="flex flex-col gap-3 text-sm">
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Mail className="size-3" />
            Email
          </dt>
          <dd className="font-medium text-foreground break-all">
            {customerEmail}
          </dd>
        </div>

        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground flex items-center gap-1.5">
            <User className="size-3" />
            Account Type
          </dt>
          <dd className="font-medium text-foreground">
            {userId ? "Registered Customer" : "Guest Checkout"}
          </dd>
        </div>

        {userId && (
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">User ID</dt>
            <dd className="font-mono text-xs text-muted-foreground break-all">
              {userId}
            </dd>
          </div>
        )}

        <div className="flex flex-col gap-1 border-t border-border pt-3">
          <dt className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CreditCard className="size-3" />
            Stripe Session
          </dt>
          <dd className="font-mono text-xs text-muted-foreground break-all">
            {stripeSessionId}
          </dd>
        </div>
      </dl>
    </section>
  )
}
