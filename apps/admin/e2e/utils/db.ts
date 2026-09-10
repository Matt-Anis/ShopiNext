import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { and, desc, eq, like } from "drizzle-orm";
import * as adminAuthSchema from "@repo/db/admin/auth-schema";
import { adminVerification } from "@repo/db/admin/auth-schema";
import * as publicSchema from "@repo/db/public/schema";

config({ path: ".env.local" });

export const testDb = drizzle(process.env.DATABASE_URL_TEST!, {
  schema: { ...adminAuthSchema, ...publicSchema },
});

export async function getResetPasswordToken(userId: string) {
  const [row] = await testDb
    .select()
    .from(adminVerification)
    .where(
      and(
        like(adminVerification.identifier, "reset-password:%"),
        eq(adminVerification.value, userId),
      ),
    )
    .orderBy(desc(adminVerification.createdAt))
    .limit(1);

  if (!row) {
    throw new Error(
      `No password reset verification row found for user ${userId}`,
    );
  }

  return row.identifier.replace("reset-password:", "");
}
