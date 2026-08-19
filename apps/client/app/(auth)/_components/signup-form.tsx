"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { cn } from "@repo/ui/utils";
import { authClient } from "@/lib/auth-client";
import { toast } from "@repo/ui/toast";
import {
  emailSignUpFormSchema,
  type EmailSignUpFormValues,
} from "@/lib/validations/auth";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldSeparator,
} from "@repo/ui/field";
import { FloatingLabelInput } from "@repo/ui/floating-label-input";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailSignUpFormValues>({
    resolver: zodResolver(emailSignUpFormSchema),
  });

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    const signUpPromise = authClient.signUp
      .email({ name, email, password, callbackURL: "/login" })
      .then((res) => {
        if (res.error) {
          throw new Error(res.error.message ?? "Something went wrong");
        }
        return res.data;
      });

    await toast
      .promise(signUpPromise, {
        loading: { title: "Creating your account..." },
        success: () => {
          router.push("/");
          return {
            title: "Please verify your email",
            description: "We've sent a verification link to your inbox.",
          };
        },
        error: (error: Error) => ({
          title: "Sign up failed",
          description: error.message,
        }),
      })
      .catch(() => {});
  });

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create an account</CardTitle>
          <CardDescription>Sign up with your Google account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} noValidate data-testid="signup-form">
            <FieldGroup>
              <Field>
                <Button variant="outline" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Sign up with Google
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>
              <Field data-invalid={!!errors.name}>
                <FloatingLabelInput
                  id="name"
                  label="Full Name"
                  type="text"
                  aria-invalid={!!errors.name}
                  data-testid="signup-name-input"
                  {...register("name")}
                />
                <FieldError errors={[errors.name]} />
              </Field>
              <Field data-invalid={!!errors.email}>
                <FloatingLabelInput
                  id="email"
                  label="Email"
                  type="email"
                  aria-invalid={!!errors.email}
                  data-testid="signup-email-input"
                  {...register("email")}
                />
                <FieldError errors={[errors.email]} />
              </Field>
              <Field>
                <Field className="flex flex-col gap-6">
                  <Field data-invalid={!!errors.password}>
                    <FloatingLabelInput
                      id="password"
                      label="Password"
                      type="password"
                      aria-invalid={!!errors.password}
                      data-testid="signup-password-input"
                      {...register("password")}
                    />
                  </Field>
                  {errors.password && (
                    <FieldError
                      className="px-3 pb-2 text-xs"
                      errors={[errors.password]}
                    />
                  )}
                  <Field data-invalid={!!errors.confirmPassword}>
                    <FloatingLabelInput
                      id="confirm-password"
                      label="Confirm Password"
                      type="password"
                      aria-invalid={!!errors.confirmPassword}
                      data-testid="signup-confirm-password-input"
                      {...register("confirmPassword")}
                    />
                    <FieldError errors={[errors.confirmPassword]} />
                  </Field>
                </Field>
              </Field>
              <Field>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="signup-submit-button"
                >
                  Create Account
                </Button>
                <FieldDescription className="text-center">
                  Already have an account? <Link href="/login">Sign in</Link>
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
