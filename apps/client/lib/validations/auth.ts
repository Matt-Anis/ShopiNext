import { z } from "zod";

export const emailSignUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(20, "Name must be at most 20 characters")
    .regex(/^[\p{L}\s'-]+$/u, "Name can only contain letters"),
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
