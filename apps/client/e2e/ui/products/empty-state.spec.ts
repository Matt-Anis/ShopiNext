import { expect, test } from "@playwright/test"
import { resetCartTables } from "../../utils/db-reset"
import { seedCategory } from "../../utils/seed-category"
import { seedDiscoveryProduct } from "../../utils/seed-discovery-product"
import { uniqueSuffix } from "../../utils/unique"

test.beforeAll(async () => {
  await resetCartTables()
})

test("an empty storefront keeps the discovery controls available", async ({ page }) => {
  await page.goto("/")
  await expect(page.locator("#products").getByRole("heading", { name: "No products found", exact: true })).toBeVisible()
  await expect(page.getByRole("searchbox", { name: "Filter products by name", exact: true })).toBeVisible()
  await expect(page.getByRole("combobox", { name: "Sort products", exact: true }).locator('[data-slot="select-value"]')).toHaveText("Newest")
  await expect(page.getByRole("button", { name: "Reset filters", exact: true })).toBeDisabled()
})

for (const listing of ["home", "category"] as const) {
  test(`${listing} offers recovery from an unmatched name without clearing the sort`, async ({ page }) => {
    test.slow()
    const category = listing === "category"
      ? await seedCategory({ description: `No matches ${uniqueSuffix()}` })
      : undefined
    const product = await seedDiscoveryProduct(`Available ${uniqueSuffix()}`, { categoryId: category?.id })
    const query = `Missing ${uniqueSuffix()}`
    const pathname = category ? `/categories/${category.slug}` : "/"
    await page.goto(`${pathname}?${new URLSearchParams({ q: query, sort: "price_desc" })}`)

    await expect(page.locator("#products").getByRole("heading", { name: "No matching products", exact: true })).toBeVisible()
    await expect(page.getByRole("searchbox", { name: "Filter products by name", exact: true })).toHaveValue(query)
    await expect(page.getByRole("group", { name: "Product discovery", exact: true })).toBeVisible()
    await page.getByRole("link", { name: "Clear name filter", exact: true }).click()
    await expect(page).toHaveURL((url) => url.pathname === pathname && !url.searchParams.has("q") && url.searchParams.get("sort") === "price_desc")
    await expect(page.getByRole("searchbox", { name: "Filter products by name", exact: true })).toHaveValue("")
    await expect(page.getByRole("combobox", { name: "Sort products", exact: true }).locator('[data-slot="select-value"]')).toHaveText("Price: high to low")
    await expect(page.getByTestId(`product-card-${product.id}`)).toBeVisible()
  })
}
