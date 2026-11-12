import { z } from "zod";
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from "@/lib/password-rules";

const passwordSchema = z
  .string()
  .min(
    MIN_PASSWORD_LENGTH,
    `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
  )
  .max(
    MAX_PASSWORD_LENGTH,
    `Password must be at most ${MAX_PASSWORD_LENGTH} characters`,
  );

export const customerNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(20, "Name must be at most 20 characters")
  .regex(/^[\p{L}\s'-]+$/u, "Name can only contain letters");

export const profileNameSchema = z.object({
  name: customerNameSchema,
});

export type ProfileNameValues = z.infer<typeof profileNameSchema>;

export const emailSignUpSchema = z.object({
  name: customerNameSchema,
  email: z
    .email("Enter a valid email address")
    .max(50, "Email must be at most 50 characters"),
  password: passwordSchema,
});

export const emailSignUpFormSchema = emailSignUpSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type EmailSignUpFormValues = z.infer<typeof emailSignUpFormSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .email("Enter a valid email address")
    .max(50, "Email must be at most 50 characters"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordFormSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
