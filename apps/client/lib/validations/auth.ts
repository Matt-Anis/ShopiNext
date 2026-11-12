import { z } from "zod";

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
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(20, "Password must be at most 20 characters"),
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
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(20, "Password must be at most 20 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;
