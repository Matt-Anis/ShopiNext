import { test, expect } from "@playwright/test"
import { seedAdmin } from "../../utils/seed-user"
import { seedProduct, seedProductImage } from "../../utils/seed-product"
import { signIn } from "../../utils/auth"
import { uniqueSuffix } from "../../utils/unique"

let admin: Awaited<ReturnType<typeof seedAdmin>>

test.beforeEach(async () => {
  admin = await seedAdmin()
})

test.describe("Media Page Table", () => {
  test("navigates to media page from sidebar and renders media table", async ({
    page,
  }) => {
    const productName = `Watch ${uniqueSuffix()}`
    const altText = `Watch photo ${uniqueSuffix()}`
    const product = await seedProduct({ name: productName })
    await seedProductImage(product.id, { altText })

    await signIn(page, admin)
    await page.goto("/products")

    // Click Media in the sidebar
    await page.getByRole("link", { name: "Media" }).click()
    await expect(page).toHaveURL("/media")

    // Verify row scoped strictly to this product
    const row = page.locator("tr", { hasText: productName })
    await expect(row).toBeVisible()
    await expect(row).toContainText(altText)
    await expect(row).toContainText("1 (Primary)")
  })

  test("filters media by product name search input", async ({ page }) => {
    const nameA = `Alpha ${uniqueSuffix()}`
    const nameB = `Beta ${uniqueSuffix()}`
    const productA = await seedProduct({ name: nameA })
    const productB = await seedProduct({ name: nameB })
    await seedProductImage(productA.id, { altText: `Photo A ${uniqueSuffix()}` })
    await seedProductImage(productB.id, { altText: `Photo B ${uniqueSuffix()}` })

    await signIn(page, admin)
    await page.goto("/media")

    await expect(page.locator("tr", { hasText: nameA })).toBeVisible()
    await expect(page.locator("tr", { hasText: nameB })).toBeVisible()

    // Search for product A
    const searchInput = page.getByPlaceholder("Search media by product...")
    await searchInput.fill(nameA)

    await expect(page.locator("tr", { hasText: nameA })).toBeVisible()
    await expect(page.locator("tr", { hasText: nameB })).not.toBeVisible()
  })
})
