import { authClient } from "@/lib/auth-client"

export async function requestPasswordReset(email: string) {
  const { data, error } = await authClient.requestPasswordReset({
    email,
    redirectTo: "/reset-password",
  })

  if (error) {
    throw new Error(error.message ?? "Something went wrong")
  }

  return data
}
