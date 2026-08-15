import Link from "next/link";
import { notFound } from "next/navigation";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stripe } from "@/lib/stripe";

export default async function CheckoutCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    notFound();
  }

  try {
    await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    notFound();
  }

  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <XCircle className="size-12 text-muted-foreground" />
      <h1 className="font-heading text-2xl font-semibold">
        Checkout canceled
      </h1>
      <p className="text-muted-foreground">
        No payment was made. Your cart is still here whenever you&apos;re
        ready.
      </p>
      <Button nativeButton={false} render={<Link href="/products" />}>
        Back to shopping
      </Button>
    </section>
  );
}
