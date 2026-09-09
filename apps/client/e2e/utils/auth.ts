import type { Page } from "@playwright/test";
import type { DEFAULT_TEST_USER } from "./seed-user";

export async function signIn(
  page: Page,
  credentials: Pick<typeof DEFAULT_TEST_USER, "email" | "password">,
) {
  await page.request.post("/api/auth/sign-in/email", {
    data: {
      email: credentials.email,
      password: credentials.password,
    },
  });
  await page.goto("/");
}
