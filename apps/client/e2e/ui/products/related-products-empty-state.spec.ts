import { expect, test } from "@playwright/test"
import { seedCategory } from "../../utils/seed-category"
import { seedRelatedProduct } from "../../utils/seed-related-product"
import { uniqueSuffix } from "../../utils/unique"

for (const hasInactiveCategory of [false, true]) {
  test(`hides suggestions when the product has ${hasInactiveCategory ? "only inactive categories" : "no categories"}`, async ({
    page,
  }) => {
    test.slow()
    const category = await seedCategory({
      isActive: false,
      description: `Inactive matches ${uniqueSuffix()}`,
    })
    const source = await seedRelatedProduct({
      categoryIds: hasInactiveCategory ? [category.id] : [],
    })
    await seedRelatedProduct({ categoryIds: [category.id] })

    await page.goto(`/products/${source.slug}`)
    await expect(
      page.getByRole("heading", { level: 1, name: source.name, exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("region", { name: "Related products", exact: true })
    ).toBeHidden()
  })
}

test("hides suggestions instead of falling back to unrelated products", async ({
  page,
}) => {
  test.slow()
  const [category, unrelated] = await Promise.all([
    seedCategory({ description: `Source category ${uniqueSuffix()}` }),
    seedCategory({ description: `Unrelated category ${uniqueSuffix()}` }),
  ])
  const source = await seedRelatedProduct({ categoryIds: [category.id] })
  await seedRelatedProduct({ categoryIds: [unrelated.id] })

  await page.goto(`/products/${source.slug}`)
  await expect(
    page.getByRole("heading", { level: 1, name: source.name, exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("region", { name: "Related products", exact: true })
  ).toBeHidden()
})

test("hides suggestions when all category matches are unpurchasable", async ({
  page,
}) => {
  test.slow()
  const category = await seedCategory({
    description: `Unpurchasable matches ${uniqueSuffix()}`,
  })
  const source = await seedRelatedProduct({ categoryIds: [category.id] })
  await Promise.all([
    seedRelatedProduct({ categoryIds: [category.id], stock: 0 }),
    seedRelatedProduct({ categoryIds: [category.id], maxPerOrder: 0 }),
    seedRelatedProduct({ categoryIds: [category.id], status: "draft" }),
    seedRelatedProduct({ categoryIds: [category.id], isActive: false }),
  ])

  await page.goto(`/products/${source.slug}`)
  await expect(
    page.getByRole("heading", { level: 1, name: source.name, exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("region", { name: "Related products", exact: true })
  ).toBeHidden()
})
