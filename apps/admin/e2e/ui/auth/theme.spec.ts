import { test, expect } from "@playwright/test"
import { signIn } from "../../utils/auth"
import { clickUntilHydrated } from "../../utils/interaction"
import { seedAdmin } from "../../utils/seed-user"
import { uniqueSuffix } from "../../utils/unique"

test("desktop theme toggle changes and saves the admin theme", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.emulateMedia({ colorScheme: "light" })
  const staff = await seedAdmin({ role: "staff", name: `Theme staff ${uniqueSuffix()}` })
  await signIn(page, staff)

  const html = page.locator("html")
  const toggle = page.getByRole("button", { name: "Dark theme", exact: true })
  await expect(html).not.toHaveClass(/\bdark\b/)
  await clickUntilHydrated(toggle, () => expect(html).toHaveClass(/\bdark\b/))
  await expect(toggle).toHaveAttribute("aria-pressed", "true")

  await page.reload()
  await expect(html).toHaveClass(/\bdark\b/)
  await clickUntilHydrated(toggle, () => expect(html).not.toHaveClass(/\bdark\b/))
})
