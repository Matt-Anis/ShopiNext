import { authClient } from "@/lib/auth-client"
import type { ProfileNameValues } from "@/lib/validations/auth"

export async function updateCustomerName({ name }: ProfileNameValues) {
  const { error } = await authClient.updateUser({ name })

  if (error) {
    throw new Error(error.message ?? "Unable to update your name")
  }
}
