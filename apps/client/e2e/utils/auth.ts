import type { Page } from "@playwright/test";
import { DEFAULT_TEST_USER } from "./seed-user";

export async function signIn(page: Page) {
  await page.request.post("/api/auth/sign-in/email", {
    data: {
      email: DEFAULT_TEST_USER.email,
      password: DEFAULT_TEST_USER.password,
    },
  });
  await page.goto("/");
}
