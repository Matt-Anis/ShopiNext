import { expect, test } from "@playwright/test"
import { products } from "@repo/db/public/schema"
import { testDb } from "../../utils/db"
import { linkProductToCategory, seedCategory } from "../../utils/seed-category"
import { seedRelatedProduct } from "../../utils/seed-related-product"
import { uniqueSuffix } from "../../utils/unique"

test("related products match every active category without duplicates or self-recommendations", async ({
  page,
}) => {
  test.slow()
  const [first, second] = await Promise.all([
    seedCategory({ description: `First category ${uniqueSuffix()}` }),
    seedCategory({ description: `Second category ${uniqueSuffix()}` }),
  ])
  const source = await seedRelatedProduct({
    categoryIds: [first.id, second.id],
    createdAt: new Date("2027-01-01T00:00:00.000Z"),
  })
  const matches = await Promise.all([
    seedRelatedProduct({ categoryIds: [first.id] }),
    seedRelatedProduct({ categoryIds: [second.id] }),
    seedRelatedProduct({ categoryIds: [first.id, second.id] }),
  ])

  await page.goto(`/products/${source.slug}`)
  const section = page.getByRole("region", {
    name: "Related products",
    exact: true,
  })
  await expect(section).toBeVisible()
  await expect(section.getByTestId(`product-card-${source.id}`)).toBeHidden()
  for (const match of matches) {
    await expect(section.getByTestId(`product-card-${match.id}`)).toHaveCount(1)
  }
})

test("related products filter visibility and purchasability before limiting results", async ({
  page,
}) => {
  test.slow()
  const [active, inactive, unrelated] = await Promise.all([
    seedCategory({ description: `Active category ${uniqueSuffix()}` }),
    seedCategory({
      isActive: false,
      description: `Inactive category ${uniqueSuffix()}`,
    }),
    seedCategory({ description: `Unrelated category ${uniqueSuffix()}` }),
  ])
  const newer = new Date("2026-01-01T00:00:00.000Z")
  const source = await seedRelatedProduct({
    categoryIds: [active.id, inactive.id],
    createdAt: newer,
  })
  const eligible = await seedRelatedProduct({ categoryIds: [active.id] })
  const excludedOptions = [
    { status: "draft" as const },
    { isActive: false },
    { stock: 0 },
    { maxPerOrder: 0 },
    { variantIsActive: false },
    { minPrice: null },
  ]
  const excluded = await Promise.all(
    excludedOptions.map((options) =>
      seedRelatedProduct({
        categoryIds: [active.id],
        createdAt: newer,
        minPrice: 1000,
        ...options,
      })
    )
  )
  excluded.push(
    await seedRelatedProduct({ categoryIds: [inactive.id], createdAt: newer }),
    await seedRelatedProduct({ categoryIds: [unrelated.id], createdAt: newer })
  )
  const [withoutVariants] = await testDb
    .insert(products)
    .values({
      name: `No variants ${uniqueSuffix()}`,
      slug: `no-variants-${uniqueSuffix()}`,
      description: `No variants fixture ${uniqueSuffix()}`,
      status: "active",
      minPrice: 1000,
      createdAt: newer,
    })
    .returning()
  await linkProductToCategory(withoutVariants.id, active.id)

  await page.goto(`/products/${source.slug}`)
  const section = page.getByRole("region", {
    name: "Related products",
    exact: true,
  })
  await expect(section.getByTestId(`product-card-${eligible.id}`)).toBeVisible()
  for (const product of [...excluded, withoutVariants, source]) {
    await expect(section.getByTestId(`product-card-${product.id}`)).toBeHidden()
  }
  await expect(
    section.getByTestId(`cart-control-add-${eligible.id}`)
  ).toBeEnabled()
})

test("related products show at most four newest matches with stable ordering across timestamp ties", async ({
  page,
}) => {
  test.slow()
  const category = await seedCategory({
    description: `Ordering category ${uniqueSuffix()}`,
  })
  const source = await seedRelatedProduct({ categoryIds: [category.id] })
  const matches = await Promise.all(
    Array.from({ length: 6 }, (_, index) =>
      seedRelatedProduct({
        categoryIds: [category.id],
        createdAt: new Date(
          index < 3 ? "2025-01-01T00:00:00.000Z" : "2026-01-01T00:00:00.000Z"
        ),
      })
    )
  )
  const expected = [...matches]
    .sort(
      (a, b) =>
        b.createdAt.getTime() - a.createdAt.getTime() || (a.id > b.id ? -1 : 1)
    )
    .slice(0, 4)

  await page.goto(`/products/${source.slug}`)
  const section = page.getByRole("region", {
    name: "Related products",
    exact: true,
  })
  const cards = section.locator('[data-testid^="product-card-"]')
  const expectedTestIds = expected.map(
    (product) => `product-card-${product.id}`
  )
  await expect
    .poll(() =>
      cards.evaluateAll((elements) =>
        elements.map((element) => element.getAttribute("data-testid"))
      )
    )
    .toEqual(expectedTestIds)
  await page.reload()
  await expect
    .poll(() =>
      cards.evaluateAll((elements) =>
        elements.map((element) => element.getAttribute("data-testid"))
      )
    )
    .toEqual(expectedTestIds)
})
