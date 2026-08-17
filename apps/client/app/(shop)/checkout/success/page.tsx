import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import { stripe } from "@/lib/stripe";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    notFound();
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    notFound();
  }

  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <CheckCircle2 className="size-12 text-primary" />
      <h1 className="font-heading text-2xl font-semibold">
        Payment successful
      </h1>
      <p className="text-muted-foreground">
        Thanks for your order, a confirmation has been sent to{" "}
        {session.customer_details?.email}.
      </p>
      <Button nativeButton={false} render={<Link href="/" />}>
        Continue shopping
      </Button>
    </section>
  );
}
