import { authClient } from "@/lib/auth-client"
import type { ChangePasswordFormValues } from "@/lib/validations/auth"

export async function changeCustomerPassword({
  currentPassword,
  newPassword,
}: ChangePasswordFormValues) {
  const { error } = await authClient.changePassword({
    currentPassword,
    newPassword,
  })

  if (error) {
    if (error.code === "INVALID_PASSWORD") {
      throw new Error("Your current password is incorrect")
    }

    if (error.status === 401) {
      throw new Error(
        "Your session has expired. Sign in again to change your password."
      )
    }

    throw new Error(error.message ?? "Unable to change your password")
  }
}
