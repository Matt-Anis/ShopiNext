import { test, expect } from "@playwright/test";
import { testDb } from "./utils/db";
import { user } from "@repo/db/public/auth-schema";

test("can connect to the test database and select from user", async () => {
  const users = await testDb.select().from(user);
  expect(Array.isArray(users)).toBe(true);
});
