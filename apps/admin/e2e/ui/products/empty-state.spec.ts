import { test, expect } from "@playwright/test"
import { seedAdmin } from "../../utils/seed-user"
import { signIn } from "../../utils/auth"

test("shows the empty state when there are no products", async ({ page }) => {
  const admin = await seedAdmin()
  await signIn(page, admin)
  await page.goto("/products")

  await expect(page.getByTestId("products-empty-state")).toBeVisible()
})
