import { randomUUID } from "node:crypto"
import {
  Resend,
  type CreateEmailOptions,
  type CreateEmailRequestOptions,
  type CreateEmailResponse,
} from "resend"

let resend: Resend | undefined

export const FROM_EMAIL = "ShopiNext <noreply@mail.shopinext.mattanis.dev>"

export async function sendEmail(
  payload: CreateEmailOptions,
  options?: CreateEmailRequestOptions
): Promise<CreateEmailResponse> {
  if (process.env.E2E_EMAIL_MOCK === "1") {
    return {
      data: { id: randomUUID() },
      error: null,
      headers: null,
    }
  }

  resend ??= new Resend(process.env.RESEND_API_KEY)
  return resend.emails.send(payload, options)
}
