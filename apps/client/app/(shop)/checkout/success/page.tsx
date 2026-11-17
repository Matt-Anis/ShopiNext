import Link from "next/link"
import { notFound } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@repo/ui/button"
import { stripe } from "@/lib/stripe"

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id: sessionId } = await searchParams

  if (!sessionId) {
    notFound()
  }

  let session
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId)
  } catch {
    notFound()
  }

  return (
    <section className="mx-auto flex min-h-[65vh] w-full max-w-2xl flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <CheckCircle2
        aria-hidden="true"
        className="size-14 rounded-full bg-primary p-3 text-primary-foreground"
      />
      <h1 className="page-heading">Payment successful</h1>
      <p className="max-w-md leading-relaxed wrap-anywhere text-muted-foreground">
        Thanks for your order. Your payment confirmation will be emailed to{" "}
        {session.customer_details?.email}.
      </p>
      <Button size="lg" nativeButton={false} render={<Link href="/" />}>
        Continue shopping
      </Button>
    </section>
  )
}
