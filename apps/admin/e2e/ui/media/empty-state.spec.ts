import { test, expect } from "@playwright/test"
import { seedAdmin } from "../../utils/seed-user"
import { signIn } from "../../utils/auth"

test("shows the empty state when there is no media", async ({ page }) => {
  const admin = await seedAdmin()
  await signIn(page, admin)
  await page.goto("/media")

  await expect(page.getByTestId("media-empty-state")).toBeVisible()
  await expect(page.getByText("No media yet")).toBeVisible()
})
