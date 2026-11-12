import { authClient } from "@/lib/auth-client"

export async function signOutCustomer() {
  const { error } = await authClient.signOut()

  if (error) {
    throw new Error(error.message ?? "Unable to sign out. Please try again.")
  }
}
