import { testDb } from "./db";
import { user, verification } from "@/lib/auth-schema";

export async function resetAuthTables() {
  await testDb.delete(user);
  await testDb.delete(verification);
}
