"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldSeparator,
} from "@/components/ui/field";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    startTransition(async () => {
      const signInPromise = authClient.signIn
        .email({ email, password })
        .then((res) => {
          if (res.error) {
            throw new Error(res.error.message ?? "Something went wrong");
          }
          return res.data;
        });

      await toast
        .promise(signInPromise, {
          loading: { title: "Signing in..." },
          success: () => {
            router.push("/");
            return { title: "Signed in successfully", description: undefined };
          },
          error: (error: Error) => ({
            title: "Login failed",
            description: error.message,
          }),
        })
        .catch(() => {});
    });
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Login with your Google account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} data-testid="login-form">
            <FieldGroup>
              <Field>
                <Button variant="outline" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Login with Google
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>
              <Field>
                <FloatingLabelInput
                  id="email"
                  name="email"
                  label="Email"
                  type="email"
                  required
                  data-testid="login-email-input"
                />
              </Field>
              <Field>
                <FloatingLabelInput
                  id="password"
                  name="password"
                  label="Password"
                  type="password"
                  required
                  data-testid="login-password-input"
                />
              </Field>
              <Field>
                <Button
                  type="submit"
                  disabled={isPending}
                  data-testid="login-submit-button"
                >
                  Login
                </Button>
                <FieldDescription className="text-center">
                  <Link
                    href="#"
                    className="text-center   text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </FieldDescription>
                <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <Link href="/signup">Sign up</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our{" "}
        <Link href="/term-of-service">Terms of Service</Link> and{" "}
        <Link href="/privacy-policy">Privacy Policy</Link>.
      </FieldDescription>
    </div>
  );
}
