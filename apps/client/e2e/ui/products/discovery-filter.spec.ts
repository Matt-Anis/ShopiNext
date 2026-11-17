import { expect, test } from "@playwright/test"
import { clickUntilHydrated } from "../../utils/interaction"
import { chooseProductSort, expectDiscoveryOrder } from "../../utils/product-discovery"
import { seedCategory } from "../../utils/seed-category"
import { seedDiscoveryProduct } from "../../utils/seed-discovery-product"
import { uniqueSuffix } from "../../utils/unique"

test("typing is debounced, replaces results, and reset cancels pending text", async ({ page }) => {
  test.slow()
  const prefix = `Typing ${uniqueSuffix()}`
  const category = await seedCategory({ description: `Typing ${uniqueSuffix()}` })
  const first = await seedDiscoveryProduct(prefix, { label: "First", categoryId: category.id })
  const second = await seedDiscoveryProduct(prefix, { label: "Second", categoryId: category.id })
  const pathname = `/categories/${category.slug}`
  await page.goto(`${pathname}?q=${encodeURIComponent(prefix)}`)
  await chooseProductSort(page, "Newest")
  await page.clock.install()
  const input = page.getByRole("searchbox", { name: "Filter products by name", exact: true })

  await input.fill(first.name)
  await page.clock.runFor(200)
  await input.fill(second.name)
  await page.clock.runFor(200)
  await expect(page).toHaveURL((url) => url.searchParams.get("q") === prefix)
  await page.clock.runFor(200)
  await expect(page).toHaveURL((url) => url.searchParams.get("q") === second.name)
  await expectDiscoveryOrder(page, prefix, [second.id])
  await expect(input).toBeFocused()

  await input.fill(first.name)
  await clickUntilHydrated(page.getByRole("button", { name: "Reset filters", exact: true }), async () => {
    await expect(page).toHaveURL(pathname)
    await expect(input).toHaveValue("")
  })
  await page.clock.runFor(500)
  await expect(page).toHaveURL(pathname)
  await expectDiscoveryOrder(page, prefix, [first, second].sort((a, b) => a.id > b.id ? -1 : 1).map((product) => product.id))
})

test("filtering excludes other categories, drafts, and trashed products", async ({ page }) => {
  test.slow()
  const prefix = `Visibility ${uniqueSuffix()}`
  const category = await seedCategory({ description: `Visibility ${uniqueSuffix()}` })
  const visible = await seedDiscoveryProduct(prefix, { categoryId: category.id })
  const outsider = await seedDiscoveryProduct(prefix)
  const draft = await seedDiscoveryProduct(prefix, { categoryId: category.id, status: "draft" })
  const trashed = await seedDiscoveryProduct(prefix, { categoryId: category.id, isActive: false })
  await page.goto(`/categories/${category.slug}?q=${encodeURIComponent(prefix)}`)
  await expectDiscoveryOrder(page, prefix, [visible.id])
  await expect(page.getByTestId(`product-card-${outsider.id}`)).toBeHidden()
  await page.goto(`/?q=${encodeURIComponent(prefix)}`)
  await expectDiscoveryOrder(page, prefix, [visible, outsider].sort((a, b) => a.id > b.id ? -1 : 1).map((product) => product.id))
  for (const hidden of [draft, trashed]) {
    await expect(page.getByTestId(`product-card-${hidden.id}`)).toBeHidden()
  }
})

for (const character of ["%", "_", "\\"]) {
  test(`the name filter treats ${character} literally`, async ({ page }) => {
    test.slow()
    const prefix = `Literal ${uniqueSuffix()}`
    const query = `${prefix}${character}`
    const match = await seedDiscoveryProduct(query)
    const decoy = await seedDiscoveryProduct(`${prefix}X`)
    await page.goto(`/?q=${encodeURIComponent(query)}`)
    await expect(page.getByTestId(`product-card-${match.id}`)).toBeVisible()
    await expect(page.getByTestId(`product-card-${decoy.id}`)).toBeHidden()
  })
}
