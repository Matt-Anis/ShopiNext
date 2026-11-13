"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@repo/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup } from "@repo/ui/field"
import { FloatingLabelInput } from "@repo/ui/floating-label-input"
import { toast } from "@repo/ui/toast"
import { updateCustomerName } from "@/features/account/update-name"
import {
  profileNameSchema,
  type ProfileNameValues,
} from "@/lib/validations/auth"

export function ProfileNameForm({ initialName }: { initialName: string }) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileNameValues>({
    resolver: zodResolver(profileNameSchema),
    defaultValues: { name: initialName },
  })

  const onSubmit = handleSubmit(async (values) => {
    clearErrors("root")

    await toast
      .promise(updateCustomerName(values), {
        loading: { title: "Saving your name..." },
        success: () => {
          reset(values)
          router.refresh()
          return { title: "Name updated" }
        },
        error: (error: Error) => {
          setError("root", { message: error.message })
          return {
            title: "Unable to save your name",
            description: error.message,
          }
        },
      })
      .catch(() => {})
  })

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={isSubmitting}>
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FloatingLabelInput
            id="profile-name"
            label="Full name"
            type="text"
            autoComplete="name"
            disabled={isSubmitting}
            aria-invalid={!!errors.name}
            aria-describedby={
              errors.name ? "profile-name-help profile-name-error" : "profile-name-help"
            }
            {...register("name")}
          />
          <FieldDescription id="profile-name-help">
            Use up to 20 characters: letters, spaces, apostrophes, or hyphens.
          </FieldDescription>
          <FieldError id="profile-name-error" errors={[errors.name]} />
        </Field>
        <FieldError errors={[errors.root]} />
        <Button
          type="submit"
          className="self-start"
          disabled={isSubmitting || !isDirty}
        >
          {isSubmitting ? "Saving..." : "Save name"}
        </Button>
      </FieldGroup>
    </form>
  )
}
