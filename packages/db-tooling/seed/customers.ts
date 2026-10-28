import { randomUUID } from "node:crypto"
import { hashPassword } from "better-auth/crypto"
import { db } from "../client"
import { user, account } from "@repo/db/public/auth-schema"

const CUSTOMER_PASSWORD = "secret password"

const CUSTOMERS_DATA = [
  { name: "Alice Johnson", email: "alice@example.com" },
  { name: "Bob Smith", email: "bob@example.com" },
  { name: "Carol Davis", email: "carol@example.com" },
  { name: "David Martinez", email: "david@example.com" },
  { name: "Emma Wilson", email: "emma@example.com" },
]

export interface SeededCustomer {
  id: string
  name: string
  email: string
}

export async function seedCustomers(): Promise<SeededCustomer[]> {
  console.log("Seeding customer accounts...")

  const customerPasswordHash = await hashPassword(CUSTOMER_PASSWORD)
  const seededCustomers: SeededCustomer[] = []

  for (const c of CUSTOMERS_DATA) {
    const id = randomUUID()
    await db.insert(user).values({
      id,
      name: c.name,
      email: c.email,
      emailVerified: true,
    })

    await db.insert(account).values({
      id: randomUUID(),
      userId: id,
      accountId: id,
      providerId: "credential",
      password: customerPasswordHash,
    })

    seededCustomers.push({ id, email: c.email, name: c.name })
  }

  return seededCustomers
}
