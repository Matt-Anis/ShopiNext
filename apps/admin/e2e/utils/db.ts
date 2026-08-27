import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { like } from "drizzle-orm";
import * as adminAuthSchema from "@repo/db/admin/auth-schema";
import { adminVerification } from "@repo/db/admin/auth-schema";

config({ path: ".env.local" });

export const testDb = drizzle(process.env.DATABASE_URL_TEST!, {
  schema: { ...adminAuthSchema },
});

// Password reset tokens live in the `adminVerification` table as
// `reset-password:<token>` (unlike email verification, which uses a
// stateless JWT that's never persisted), so tests can pull the real token
// out of the test DB instead of needing to read the actual email.
export async function getResetPasswordToken() {
  const [row] = await testDb
    .select()
    .from(adminVerification)
    .where(like(adminVerification.identifier, "reset-password:%"));

  if (!row) {
    throw new Error("No password reset verification row found");
  }

  return row.identifier.replace("reset-password:", "");
}
