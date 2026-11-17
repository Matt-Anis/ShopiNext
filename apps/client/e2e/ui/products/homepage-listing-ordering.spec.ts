import { expect, test } from "@playwright/test"
import { expectDiscoveryOrder } from "../../utils/product-discovery"
import { seedDiscoveryBatch } from "../../utils/seed-discovery-product"
import { uniqueSuffix } from "../../utils/unique"

test("homepage infinite scroll preserves newest ordering across timestamp ties", async ({ page }) => {
  test.slow()
  const prefix = `Homepage ${uniqueSuffix()}`
  const seeded = await seedDiscoveryBatch(prefix, 26)
  const expected = seeded.sort((a, b) => a.id > b.id ? -1 : 1).map((product) => product.id)

  await page.goto(`/?q=${encodeURIComponent(prefix)}`)
  await expectDiscoveryOrder(page, prefix, expected.slice(0, 24))
  await page.getByTestId("product-pagination-sentinel").scrollIntoViewIfNeeded()
  await expectDiscoveryOrder(page, prefix, expected)
  await expect(page.getByTestId("product-pagination-sentinel")).toBeHidden()
})
