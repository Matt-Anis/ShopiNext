import { Resend } from "resend"

export const resend = new Resend(process.env.RESEND_API_KEY!)

export const STAFF_FROM_EMAIL = "ShopiNext Admin <noreply@mail.shopinext.mattanis.dev>"
export const CUSTOMER_FROM_EMAIL = "ShopiNext <noreply@mail.shopinext.mattanis.dev>"

export const EMAIL_COLORS = {
  background: "#ffffff",
  foreground: "#0a0a0a",
  primary: "#fdc700",
  primaryForeground: "#733e0a",
  mutedForeground: "#737373",
  border: "#e5e5e5",
} as const

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
