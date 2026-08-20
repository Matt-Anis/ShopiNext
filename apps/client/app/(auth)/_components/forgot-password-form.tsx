"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { cn } from "@repo/ui/utils";
import { authClient } from "@/lib/auth-client";
import { toast } from "@repo/ui/toast";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
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
} from "@repo/ui/field";
import { FloatingLabelInput } from "@repo/ui/floating-label-input";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    const requestPromise = authClient
      .requestPasswordReset({ email, redirectTo: "/reset-password" })
      .then((res) => {
        if (res.error) {
          throw new Error(res.error.message ?? "Something went wrong");
        }
        return res.data;
      });

    await toast
      .promise(requestPromise, {
        loading: { title: "Sending reset link..." },
        success: () => ({
          title: "Reset link sent",
          description: "Check your email for a link to reset your password.",
        }),
        error: (error: Error) => ({
          title: "Something went wrong",
          description: error.message,
        }),
      })
      .catch(() => {});
  });

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Forgot your password?</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={onSubmit}
            noValidate
            data-testid="forgot-password-form"
          >
            <FieldGroup>
              <Field data-invalid={!!errors.email}>
                <FloatingLabelInput
                  id="email"
                  label="Email"
                  type="email"
                  aria-invalid={!!errors.email}
                  data-testid="forgot-password-email-input"
                  {...register("email")}
                />
                <FieldError errors={[errors.email]} />
              </Field>
              <Field>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="forgot-password-submit-button"
                >
                  Send reset link
                </Button>
                <FieldDescription className="text-center">
                  <Link href="/login">Back to login</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
