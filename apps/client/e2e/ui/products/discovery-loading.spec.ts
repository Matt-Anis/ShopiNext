import { expect, test } from "@playwright/test"
import { clickUntilHydrated } from "../../utils/interaction"
import { chooseProductSort, expectDiscoveryOrder } from "../../utils/product-discovery"
import { seedCategory } from "../../utils/seed-category"
import { seedDiscoveryProduct } from "../../utils/seed-discovery-product"
import { uniqueSuffix } from "../../utils/unique"

for (const setting of ["filter", "sort"] as const) {
  test(`${setting} updates show product skeletons until replacement results arrive`, async ({ page }) => {
    test.slow()
    const prefix = `Loading ${uniqueSuffix()}`
    const category = await seedCategory({ description: `Loading ${uniqueSuffix()}` })
    const low = await seedDiscoveryProduct(prefix, { price: 1000, categoryId: category.id })
    const high = await seedDiscoveryProduct(prefix, { price: 3000, categoryId: category.id })
    const pathname = `/categories/${category.slug}`
    await page.goto(`${pathname}?${new URLSearchParams({ q: prefix, sort: "price_asc" })}`)
    await chooseProductSort(page, "Price: low to high")
    await expectDiscoveryOrder(page, prefix, [low.id, high.id])

    const nextQuery = setting === "filter" ? high.name : prefix
    const nextSort = setting === "sort" ? "price_desc" : "price_asc"
    let started = false
    let release!: () => void
    const gate = new Promise<void>((resolve) => { release = resolve })
    await page.route("**/*", async (route) => {
      const request = route.request()
      const url = new URL(request.url())
      if (request.headers().rsc === "1" && url.pathname === pathname
        && url.searchParams.get("q") === nextQuery && url.searchParams.get("sort") === nextSort) {
        started = true
        await gate
      }
      if (!request.failure()) await route.continue()
    })

    try {
      if (setting === "filter") {
        await page.getByRole("searchbox", { name: "Filter products by name", exact: true }).fill(nextQuery)
      } else {
        const option = page.getByRole("option", { name: "Price: high to low", exact: true })
        await clickUntilHydrated(page.getByRole("combobox", { name: "Sort products", exact: true }), () => expect(option).toBeVisible())
        await option.click()
      }
      await expect.poll(() => started).toBe(true)
      await expect(page.getByTestId("product-list-skeleton")).toBeVisible()
      await expect(page.locator("#products")).toHaveAttribute("aria-busy", "true")
      for (const product of [low, high]) await expect(page.getByTestId(`product-card-${product.id}`)).toBeHidden()
      await expect(page.getByText("Updating products…", { exact: true })).toBeHidden()

      release()
      await expectDiscoveryOrder(page, prefix, setting === "filter" ? [high.id] : [high.id, low.id])
      await expect(page.getByTestId("product-list-skeleton")).toBeHidden()
      await expect(page.locator("#products")).toHaveAttribute("aria-busy", "false")
    } finally {
      release()
    }
  })
}
