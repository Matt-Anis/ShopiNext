import { testDb } from "./db";
import {
  adminSession,
  adminAccount,
  adminUser,
  adminVerification,
} from "@repo/db/admin/auth-schema";

export async function resetAuthTables() {
  await testDb.delete(adminSession);
  await testDb.delete(adminAccount);
  await testDb.delete(adminUser);
  await testDb.delete(adminVerification);
}
