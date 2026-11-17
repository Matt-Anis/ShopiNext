import { expect, test, type Request } from "@playwright/test"
import { clickUntilHydrated } from "../../utils/interaction"
import { expectDiscoveryOrder } from "../../utils/product-discovery"
import { seedCategory } from "../../utils/seed-category"
import { seedDiscoveryBatch, seedDiscoveryProduct } from "../../utils/seed-discovery-product"
import { uniqueSuffix } from "../../utils/unique"

function isProductPagination(request: Request, prefix: string) {
  return request.method() === "POST"
    && !!request.headers()["next-action"]
    && !!request.postData()?.includes(prefix)
}

test("failed pagination keeps loaded cards and retries the same page", async ({ page }) => {
  test.slow()
  const prefix = `Retry ${uniqueSuffix()}`
  const category = await seedCategory({ description: `Retry ${uniqueSuffix()}` })
  const seeded = await seedDiscoveryBatch(prefix, 26, category.id)
  const expected = seeded.map((product) => product.id).sort()
  let attempts = 0
  await page.route("**/*", async (route) => {
    if (isProductPagination(route.request(), prefix)) {
      attempts += 1
      if (attempts === 1) {
        await route.abort("failed")
        return
      }
    }
    await route.continue()
  })
  await page.goto(`/categories/${category.slug}?${new URLSearchParams({ q: prefix, sort: "price_asc" })}`)
  await expectDiscoveryOrder(page, prefix, expected.slice(0, 24))
  await page.getByTestId("product-pagination-sentinel").scrollIntoViewIfNeeded()

  const error = page.getByRole("alert").filter({ hasText: "We couldn't load more products." })
  await expect(error).toBeVisible()
  await expectDiscoveryOrder(page, prefix, expected.slice(0, 24))
  await expect(page.getByTestId("product-pagination-sentinel")).toBeHidden()
  expect(attempts).toBe(1)
  await clickUntilHydrated(error.getByRole("button", { name: "Retry", exact: true }), async () => {
    await expect(error).toBeHidden()
    await expectDiscoveryOrder(page, prefix, expected)
  })
  expect(attempts).toBe(2)
})

test("a delayed old page cannot append results after the name filter changes", async ({ page }) => {
  test.slow()
  const prefix = `Superseded ${uniqueSuffix()}`
  const category = await seedCategory({ description: `Superseded ${uniqueSuffix()}` })
  const seeded = await seedDiscoveryBatch(prefix, 26, category.id)
  const replacementPrefix = `Replacement ${uniqueSuffix()}`
  const replacement = await seedDiscoveryProduct(replacementPrefix, { categoryId: category.id })
  let started = false
  let completed = false
  let release!: () => void
  const gate = new Promise<void>((resolve) => { release = resolve })
  await page.route("**/*", async (route) => {
    if (!isProductPagination(route.request(), prefix)) {
      await route.continue()
      return
    }
    const response = await route.fetch()
    started = true
    await gate
    try {
      await route.fulfill({ response })
    } catch (error) {
      if (!route.request().failure()) throw error
    } finally {
      completed = true
    }
  })
  try {
    await page.goto(`/categories/${category.slug}?${new URLSearchParams({ q: prefix, sort: "price_asc" })}`)
    await page.getByTestId("product-pagination-sentinel").scrollIntoViewIfNeeded()
    await expect.poll(() => started).toBe(true)
    const input = page.getByRole("searchbox", { name: "Filter products by name", exact: true })
    await input.fill(replacement.name)
    await expectDiscoveryOrder(page, replacementPrefix, [replacement.id])
    release()
    await expect.poll(() => completed).toBe(true)
    for (const old of seeded) await expect(page.getByTestId(`product-card-${old.id}`)).toBeHidden()
    await expectDiscoveryOrder(page, replacementPrefix, [replacement.id])
  } finally {
    release()
  }
})
