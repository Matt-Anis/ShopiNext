import { expect, test } from "@playwright/test"
import { seedCategory } from "../../utils/seed-category"
import { uniqueSuffix } from "../../utils/unique"

test("an empty category keeps discovery controls and category navigation", async ({ page }) => {
  const category = await seedCategory({ description: `Empty category ${uniqueSuffix()}` })
  await page.goto(`/categories/${category.slug}`)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(category.name)
  await expect(page.locator("#products").getByRole("heading", { name: "No products found", exact: true })).toBeVisible()
  await expect(page.getByRole("group", { name: "Product discovery", exact: true })).toBeVisible()
  await expect(page.getByRole("link", { name: "Browse other categories", exact: true })).toHaveAttribute("href", "/categories")
})
