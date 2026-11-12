"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@repo/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup } from "@repo/ui/field"
import { FloatingLabelInput } from "@repo/ui/floating-label-input"
import { toast } from "@repo/ui/toast"
import { changeCustomerPassword } from "@/features/account/change-password"
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from "@/lib/password-rules"
import {
  changePasswordFormSchema,
  type ChangePasswordFormValues,
} from "@/lib/validations/auth"

const passwordFields = [
  {
    name: "currentPassword",
    label: "Current password",
    autoComplete: "current-password",
  },
  { name: "newPassword", label: "New password", autoComplete: "new-password" },
  {
    name: "confirmPassword",
    label: "Confirm new password",
    autoComplete: "new-password",
  },
] as const

export function ChangePasswordForm() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    clearErrors("root")

    await toast
      .promise(changeCustomerPassword(values), {
        loading: { title: "Changing your password..." },
        success: () => {
          reset()
          router.replace("/login")
          router.refresh()
          return {
            title: "Password changed",
            description:
              "You've been signed out on all devices. Sign in with your new password.",
          }
        },
        error: (error: Error) => {
          setError("root", { message: error.message })
          return {
            title: "Unable to change your password",
            description: error.message,
          }
        },
      })
      .catch(() => {})
  })

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-busy={isSubmitting}
      aria-describedby="password-sign-out-notice"
    >
      <FieldGroup>
        {passwordFields.map(({ name, label, autoComplete }) => (
          <Field key={name} data-invalid={!!errors[name]}>
            <FloatingLabelInput
              id={`change-${name}`}
              label={label}
              type="password"
              autoComplete={autoComplete}
              disabled={isSubmitting}
              aria-invalid={!!errors[name]}
              aria-describedby={
                [
                  name === "newPassword" ? "new-password-help" : "",
                  errors[name] ? `change-${name}-error` : "",
                ]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
              {...register(name)}
            />
            {name === "newPassword" && (
              <FieldDescription id="new-password-help">
                Use {MIN_PASSWORD_LENGTH}–{MAX_PASSWORD_LENGTH} characters.
              </FieldDescription>
            )}
            <FieldError id={`change-${name}-error`} errors={[errors[name]]} />
          </Field>
        ))}
        <FieldDescription id="password-sign-out-notice">
          Changing your password signs you out on all devices, including this
          one. You&apos;ll need to sign in again.
        </FieldDescription>
        <FieldError errors={[errors.root]} />
        <Button type="submit" className="self-start" disabled={isSubmitting}>
          {isSubmitting ? "Changing password..." : "Change password"}
        </Button>
      </FieldGroup>
    </form>
  )
}
