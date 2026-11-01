export function formatProvider(providerId: string) {
  if (providerId === "credential") return "Password"
  return providerId.charAt(0).toUpperCase() + providerId.slice(1)
}
