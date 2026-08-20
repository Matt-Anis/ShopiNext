import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: August 20, 2026
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="text-lg font-medium">Overview</h2>
          <p className="mt-2">
            ShopiNext (&quot;we&quot;, &quot;us&quot;) is a demonstration
            e-commerce project. This page explains what personal information
            we collect from visitors and customers, why we collect it, and
            how it&apos;s handled.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium">Information We Collect</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <span className="font-medium text-foreground">
                Account information —
              </span>{" "}
              when you sign up with email and password, we store your name,
              email address, and a securely hashed password.
            </li>
            <li>
              <span className="font-medium text-foreground">
                Google sign-in —
              </span>{" "}
              if you sign up or log in with Google, we receive your name,
              email address, and profile picture from your Google account.
              We never see or store your Google password.
            </li>
            <li>
              <span className="font-medium text-foreground">
                Payment information —
              </span>{" "}
              payments are processed by Stripe. We do not collect or store
              your card details — Stripe handles that directly, in
              accordance with{" "}
              <a
                href="https://stripe.com/privacy"
                className="underline underline-offset-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                Stripe&apos;s own privacy policy
              </a>
              .
            </li>
            <li>
              <span className="font-medium text-foreground">
                Transactional emails —
              </span>{" "}
              we use Resend to send account-related emails, such as email
              verification and password reset links.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medium">How We Use Your Information</h2>
          <p className="mt-2">
            We use your information solely to operate your account, process
            orders, and communicate with you about your orders or account
            (such as verification and password reset emails). We do not
            sell your personal information to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium">Cookies</h2>
          <p className="mt-2">
            We use a session cookie to keep you signed in. This cookie is
            required for the site to function and isn&apos;t used for
            advertising or cross-site tracking.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium">Data Sharing</h2>
          <p className="mt-2">
            We share information only with the service providers needed to
            run the site — Stripe (payments) and Resend (transactional
            email) — and only to the extent required for them to provide
            that service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium">Your Rights</h2>
          <p className="mt-2">
            You can request access to, correction of, or deletion of your
            personal information at any time by contacting us at the email
            below.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium">Contact</h2>
          <p className="mt-2">
            Questions about this policy or your data can be sent to{" "}
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
