import Link from "next/link"
import { notFound } from "next/navigation"
import { XCircle } from "lucide-react"
import { Button } from "@repo/ui/button"
import { stripe } from "@/lib/stripe"

export default async function CheckoutCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id: sessionId } = await searchParams

  if (!sessionId) {
    notFound()
  }

  try {
    await stripe.checkout.sessions.retrieve(sessionId)
  } catch {
    notFound()
  }

  return (
    <section className="mx-auto flex min-h-[65vh] w-full max-w-2xl flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <XCircle
        aria-hidden="true"
        className="size-14 rounded-full bg-muted p-3 text-foreground"
      />
      <h1 className="page-heading">Checkout canceled</h1>
      <p className="max-w-md leading-relaxed text-muted-foreground">
        No payment was made. Your cart is still here whenever you&apos;re ready.
      </p>
      <Button size="lg" nativeButton={false} render={<Link href="/" />}>
        Back to shopping
      </Button>
    </section>
  )
}
