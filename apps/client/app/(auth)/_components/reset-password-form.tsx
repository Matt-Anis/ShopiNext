"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { cn } from "@repo/ui/utils";
import { authClient } from "@/lib/auth-client";
import { toast } from "@repo/ui/toast";
import {
  resetPasswordFormSchema,
  type ResetPasswordFormValues,
} from "@/lib/validations/auth";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Field, FieldError, FieldGroup } from "@repo/ui/field";
import { FloatingLabelInput } from "@repo/ui/floating-label-input";

export function ResetPasswordForm({
  token,
  className,
  ...props
}: { token: string } & React.ComponentProps<"div">) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
  });

  const onSubmit = handleSubmit(async ({ password }) => {
    const resetPromise = authClient
      .resetPassword({ newPassword: password, token })
      .then((res) => {
        if (res.error) {
          throw new Error(res.error.message ?? "Something went wrong");
        }
        return res.data;
      });

    await toast
      .promise(resetPromise, {
        loading: { title: "Resetting password..." },
        success: () => {
          router.push("/login");
          return {
            title: "Password reset successfully",
            description: undefined,
          };
        },
        error: (error: Error) => ({
          title: "Reset failed",
          description: error.message,
        }),
      })
      .catch(() => {});
  });

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Reset your password</CardTitle>
          <CardDescription>
            Enter a new password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={onSubmit}
            noValidate
            data-testid="reset-password-form"
          >
            <FieldGroup>
              <Field data-invalid={!!errors.password}>
                <FloatingLabelInput
                  id="password"
                  label="New Password"
                  type="password"
                  aria-invalid={!!errors.password}
                  data-testid="reset-password-password-input"
                  {...register("password")}
                />
                <FieldError errors={[errors.password]} />
              </Field>
              <Field data-invalid={!!errors.confirmPassword}>
                <FloatingLabelInput
                  id="confirm-password"
                  label="Confirm Password"
                  type="password"
                  aria-invalid={!!errors.confirmPassword}
                  data-testid="reset-password-confirm-password-input"
                  {...register("confirmPassword")}
                />
                <FieldError errors={[errors.confirmPassword]} />
              </Field>
              <Field>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="reset-password-submit-button"
                >
                  Reset password
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
