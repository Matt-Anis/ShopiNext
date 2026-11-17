import { expect, test } from "@playwright/test"
import { chooseProductSort, expectDiscoveryOrder } from "../../utils/product-discovery"
import { seedCategory } from "../../utils/seed-category"
import { seedDiscoveryProduct } from "../../utils/seed-discovery-product"
import { uniqueSuffix } from "../../utils/unique"

for (const listing of ["home", "category"] as const) {
  test(`${listing} restores shared settings, refresh, and sorting history`, async ({ page }) => {
    test.slow()
    const prefix = `Discovery ${uniqueSuffix()}`
    const category = listing === "category"
      ? await seedCategory({ description: `Discovery ${uniqueSuffix()}` })
      : undefined
    const low = await seedDiscoveryProduct(prefix, { price: 1000, categoryId: category?.id })
    const high = await seedDiscoveryProduct(prefix, { price: 3000, categoryId: category?.id })
    const pathname = category ? `/categories/${category.slug}` : "/"
    const params = new URLSearchParams({ q: `  ${prefix}  `, sort: "price_asc" })

    await page.goto(`${pathname}?${params}`)
    const input = page.getByRole("searchbox", { name: "Filter products by name", exact: true })
    await expect(input).toHaveValue(prefix)
    await expectDiscoveryOrder(page, prefix, [low.id, high.id])

    await chooseProductSort(page, "Price: high to low")
    await expect(page).toHaveURL((url) => url.pathname === pathname && url.searchParams.get("sort") === "price_desc")
    await expectDiscoveryOrder(page, prefix, [high.id, low.id])
    await page.goBack()
    await expectDiscoveryOrder(page, prefix, [low.id, high.id])
    await expect(input).toHaveValue(prefix)
    await page.goForward()
    await expectDiscoveryOrder(page, prefix, [high.id, low.id])
    await page.reload()
    await expect(input).toHaveValue(prefix)
    await expectDiscoveryOrder(page, prefix, [high.id, low.id])
  })
}

test("invalid or repeated discovery settings fall back safely", async ({ page }) => {
  test.slow()
  const prefix = `Validation ${uniqueSuffix()}`
  const category = await seedCategory({ description: `Validation ${uniqueSuffix()}` })
  const older = await seedDiscoveryProduct(prefix, { categoryId: category.id, createdAt: new Date("2024-01-01") })
  const newer = await seedDiscoveryProduct(prefix, { categoryId: category.id, createdAt: new Date("2025-01-01") })
  const pathname = `/categories/${category.slug}`
  const query = encodeURIComponent(prefix)

  for (const search of [
    `q=${query}&sort=unsupported`,
    `q=${query}&sort=price_asc&sort=price_desc`,
    `q=missing-${uniqueSuffix()}&q=${query}`,
  ]) {
    await page.goto(`${pathname}?${search}`)
    await expect(page.getByRole("combobox", { name: "Sort products", exact: true })).toHaveText("Newest")
    await expectDiscoveryOrder(page, prefix, [newer.id, older.id])
  }
  await expect(page.getByRole("searchbox", { name: "Filter products by name", exact: true })).toHaveValue("")
})
