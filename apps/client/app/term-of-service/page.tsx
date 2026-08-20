import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: August 20, 2026
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="text-lg font-medium">Acceptance of Terms</h2>
          <p className="mt-2">
            By creating an account or placing an order on ShopiNext, you
            agree to these terms. If you don&apos;t agree, please don&apos;t
            use the site.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium">Your Account</h2>
          <p className="mt-2">
            You&apos;re responsible for keeping your account credentials
            secure and for all activity under your account. Provide
            accurate information when you sign up, whether by email and
            password or through Google sign-in.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium">Acceptable Use</h2>
          <p className="mt-2">
            Use the site lawfully and don&apos;t attempt to disrupt it,
            access other users&apos; accounts, or interfere with its normal
            operation.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium">Orders and Payments</h2>
          <p className="mt-2">
            Payments are processed by Stripe. Placing an order is an offer
            to purchase, which we may accept, refuse, or cancel — for
            example if an item is unavailable or there&apos;s a pricing
            error. Prices and product availability may change without
            notice.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium">Service Provided &quot;As Is&quot;</h2>
          <p className="mt-2">
            ShopiNext is provided as-is, without warranties of any kind. We
            don&apos;t guarantee the site will be uninterrupted, error-free,
            or available at all times.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium">Limitation of Liability</h2>
          <p className="mt-2">
            To the extent permitted by law, we&apos;re not liable for any
            indirect, incidental, or consequential damages arising from
            your use of the site.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium">Changes to These Terms</h2>
          <p className="mt-2">
            We may update these terms from time to time. Continuing to use
            the site after changes take effect means you accept the
            updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium">Contact</h2>
          <p className="mt-2">
            Questions about these terms can be sent to{" "}
            <a
              href="mailto:matt.anis.dev@gmail.com"
              className="underline underline-offset-4"
            >
              matt.anis.dev@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
