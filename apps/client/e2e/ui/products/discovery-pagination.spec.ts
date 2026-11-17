import { expect, test } from "@playwright/test"
import { chooseProductSort, expectDiscoveryOrder } from "../../utils/product-discovery"
import { seedCategory } from "../../utils/seed-category"
import { seedDiscoveryBatch, seedDiscoveryProduct } from "../../utils/seed-discovery-product"
import { uniqueSuffix } from "../../utils/unique"

for (const sortBy of ["newest", "price_asc", "price_desc"] as const) {
  test(`${sortBy} pagination preserves filters and replaces accumulated results after sorting`, async ({ page }) => {
    test.slow()
    const prefix = `Paging ${uniqueSuffix()}`
    const category = await seedCategory({ description: `Paging ${uniqueSuffix()}` })
    const seeded = await seedDiscoveryBatch(prefix, 26, category.id)
    const outsider = await seedDiscoveryProduct(prefix)
    const nonmatch = await seedDiscoveryProduct(`Other ${uniqueSuffix()}`, { categoryId: category.id })
    const ascending = seeded.map((product) => product.id).sort()
    const expected = sortBy === "price_asc" ? ascending : [...ascending].reverse()
    const pathname = `/categories/${category.slug}`
    await page.goto(`${pathname}?${new URLSearchParams({ q: prefix, sort: sortBy })}`)

    await expectDiscoveryOrder(page, prefix, expected.slice(0, 24))
    await page.getByTestId("product-pagination-sentinel").scrollIntoViewIfNeeded()
    await expectDiscoveryOrder(page, prefix, expected)
    await expect(page.getByTestId("product-pagination-sentinel")).toBeHidden()
    for (const id of expected) await expect(page.getByTestId(`product-card-${id}`)).toHaveCount(1)
    for (const excluded of [outsider, nonmatch]) {
      await expect(page.getByTestId(`product-card-${excluded.id}`)).toBeHidden()
    }

    await page.evaluate(() => window.scrollTo(0, 0))
    const nextSort = sortBy === "price_asc" ? "price_desc" : "price_asc"
    await chooseProductSort(page, nextSort === "price_asc" ? "Price: low to high" : "Price: high to low")
    await expect(page).toHaveURL((url) => url.pathname === pathname && url.searchParams.get("q") === prefix && url.searchParams.get("sort") === nextSort)
    const replacement = nextSort === "price_asc" ? ascending : [...ascending].reverse()
    await expectDiscoveryOrder(page, prefix, replacement.slice(0, 24))
  })
}
