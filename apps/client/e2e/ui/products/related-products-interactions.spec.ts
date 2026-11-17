import { expect, test } from "@playwright/test"
import { clickUntilHydrated } from "../../utils/interaction"
import { seedCategory } from "../../utils/seed-category"
import {
  seedRelatedProduct,
  seedRelatedProductWithVariants,
} from "../../utils/seed-related-product"
import { uniqueSuffix } from "../../utils/unique"

test("a related product card navigates to that product's detail page", async ({
  page,
}) => {
  test.slow()
  const category = await seedCategory({
    description: `Navigation category ${uniqueSuffix()}`,
  })
  const source = await seedRelatedProduct({ categoryIds: [category.id] })
  const related = await seedRelatedProduct({ categoryIds: [category.id] })

  await page.goto(`/products/${source.slug}`)
  const section = page.getByRole("region", {
    name: "Related products",
    exact: true,
  })
  await section
    .getByTestId(`product-card-${related.id}`)
    .getByRole("link")
    .click()
  await expect(page).toHaveURL(`/products/${related.slug}`)
  await expect(
    page.getByRole("heading", { level: 1, name: related.name, exact: true })
  ).toBeVisible()
})

test("a single-variant related product adds to the cart and respects stock limits", async ({
  page,
}) => {
  test.slow()
  const category = await seedCategory({
    description: `Cart category ${uniqueSuffix()}`,
  })
  const source = await seedRelatedProduct({ categoryIds: [category.id] })
  const related = await seedRelatedProduct({
    categoryIds: [category.id],
    stock: 2,
    maxPerOrder: 5,
  })

  await page.goto(`/products/${source.slug}`)
  const section = page.getByRole("region", {
    name: "Related products",
    exact: true,
  })
  const quantity = section.getByTestId(`cart-control-quantity-${related.id}`)
  await clickUntilHydrated(
    section.getByTestId(`cart-control-add-${related.id}`),
    () => expect(quantity).toHaveText("1 in cart", { timeout: 3000 })
  )
  await clickUntilHydrated(
    section.getByTestId(`cart-control-increment-${related.id}`),
    () => expect(quantity).toHaveText("2 in cart", { timeout: 3000 })
  )
  await expect(
    section.getByTestId(`cart-control-increment-${related.id}`)
  ).toHaveAttribute("aria-disabled", "true")

  const drawer = page.getByTestId("cart-drawer-content")
  await clickUntilHydrated(page.getByTestId("cart-trigger"), () =>
    expect(drawer).toBeVisible({ timeout: 1000 })
  )
  const item = drawer
    .locator('[data-slot="card"]')
    .filter({ hasText: related.name })
  await expect(item.getByTestId("cart-item-name")).toHaveText(related.name)
  await expect(item.getByTestId("cart-item-price")).toHaveText("$20.00")
})

test("a multi-variant related product preserves sold-out options and adds the selected variant", async ({
  page,
}) => {
  test.slow()
  const category = await seedCategory({
    description: `Variant cart category ${uniqueSuffix()}`,
  })
  const source = await seedRelatedProduct({ categoryIds: [category.id] })
  const related = await seedRelatedProductWithVariants({
    categoryId: category.id,
    options: [{ name: "Size", values: ["S", "M", "L"] }],
    variants: [
      { values: { Size: "S" }, price: 1000, stock: 0 },
      { values: { Size: "M" }, price: 2300, stock: 2 },
      { values: { Size: "L" }, price: 2700, stock: 5, maxPerOrder: 0 },
    ],
  })

  await page.goto(`/products/${source.slug}`)
  const section = page.getByRole("region", {
    name: "Related products",
    exact: true,
  })
  const trigger = section.getByTestId(`product-card-add-to-cart-${related.id}`)
  const medium = page.getByTestId(`variant-pill-Size-M-${related.id}`)
  await clickUntilHydrated(trigger, () =>
    expect(medium).toBeVisible({ timeout: 1000 })
  )
  await expect(
    page.getByTestId(`variant-pill-Size-S-${related.id}`)
  ).toHaveAttribute("aria-disabled", "true")
  await expect(
    page.getByTestId(`variant-pill-Size-L-${related.id}`)
  ).toHaveAttribute("aria-disabled", "true")
  await clickUntilHydrated(medium, () =>
    expect(medium).toHaveAttribute("aria-pressed", "true", { timeout: 1000 })
  )
  await clickUntilHydrated(
    page.getByTestId(`cart-control-add-${related.id}`),
    () =>
      expect(
        page.getByTestId(`cart-control-quantity-${related.id}`)
      ).toHaveText("1 in cart", { timeout: 3000 })
  )
  await clickUntilHydrated(trigger, () =>
    expect(medium).toBeHidden({ timeout: 1000 })
  )

  const drawer = page.getByTestId("cart-drawer-content")
  await clickUntilHydrated(page.getByTestId("cart-trigger"), () =>
    expect(drawer).toBeVisible({ timeout: 1000 })
  )
  const item = drawer
    .locator('[data-slot="card"]')
    .filter({ hasText: related.name })
  await expect(item.getByTestId("cart-item-name")).toHaveText(related.name)
  await expect(item.getByText("M", { exact: true })).toBeVisible()
  await expect(item.getByTestId("cart-item-price")).toHaveText("$23.00")
})
