import { test, expect, type Page } from "@playwright/test"
import { eq } from "drizzle-orm"
import { products, productCategories, images } from "@repo/db/public/schema"
import { testDb } from "../../utils/db"
import { seedAdmin } from "../../utils/seed-user"
import {
  seedProduct,
  seedProductOption,
  seedProductVariant,
} from "../../utils/seed-product"
import { seedCategory } from "../../utils/seed-category"
import { signIn } from "../../utils/auth"
import { uniqueSuffix } from "../../utils/unique"

let admin: Awaited<ReturnType<typeof seedAdmin>>

test.beforeEach(async () => {
  admin = await seedAdmin()
})

async function openRowMenu(page: Page, rowText: string) {
  const row = page.locator("tr", { hasText: rowText })
  const trigger = row.getByRole("button", { name: "Open menu" })
  const menu = page.getByRole("menu")

  await expect(async () => {
    await trigger.click()
    await expect(menu).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 15_000 })
}

test.describe("Products list", () => {
  test("shows a seeded product's status, category, option and variant counts", async ({
    page,
  }) => {
    const product = await seedProduct({
      name: `Classic Tee ${uniqueSuffix()}`,
      status: "active",
    })
    const category = await seedCategory({ name: "Apparel" })
    await testDb
      .insert(productCategories)
      .values({ productId: product.id, categoryId: category.id })
    const option = await seedProductOption(product.id, "Size", ["S", "M"])
    await seedProductVariant(product.id, {}, [option.values[0]!.id])

    await signIn(page, admin)
    await page.goto("/products")

    const row = page.locator("tr", { hasText: product.name })
    await expect(row).toContainText("Active")
    await expect(row).toContainText("Published")
    await expect(row).toContainText(category.name)

    const cells = row.locator("td")
    await expect(cells.nth(3)).toHaveText("1")
    await expect(cells.nth(4)).toHaveText("1")
  })

  test("shows the primary image as a thumbnail, and no image when there isn't one", async ({
    page,
  }) => {
    const withImage = await seedProduct({
      name: `With Image ${uniqueSuffix()}`,
    })
    await testDb.insert(images).values({
      productId: withImage.id,
      url: "https://example.com/image.png",
      isPrimary: true,
    })
    const withoutImage = await seedProduct({
      name: `Without Image ${uniqueSuffix()}`,
    })

    await signIn(page, admin)
    await page.goto("/products")

    await expect(
      page.locator("tr", { hasText: withImage.name }).locator("img")
    ).toHaveCount(1)
    await expect(
      page.locator("tr", { hasText: withoutImage.name }).locator("img")
    ).toHaveCount(0)
  })

  test("filters the list by name", async ({ page }) => {
    const classicTee = await seedProduct({
      name: `Classic Tee ${uniqueSuffix()}`,
    })
    const canvasTote = await seedProduct({
      name: `Canvas Tote ${uniqueSuffix()}`,
    })
    await signIn(page, admin)
    await page.goto("/products")

    await page.getByTestId("data-table-search-input").fill(classicTee.name)

    await expect(page.locator("tr", { hasText: classicTee.name })).toBeVisible()
    await expect(page.locator("tr", { hasText: canvasTote.name })).toHaveCount(
      0
    )
  })
})

test.describe("View product", () => {
  test("navigates to the product detail page", async ({ page }) => {
    const product = await seedProduct({ name: `Classic Tee ${uniqueSuffix()}` })
    await signIn(page, admin)
    await page.goto("/products")

    await openRowMenu(page, product.name)
    await page.getByRole("menuitem", { name: "View" }).click()

    await page.waitForURL(`/products/${product.id}`)
  })
})

test.describe("Edit product from list", () => {
  test("navigates to the step 1 edit page", async ({ page }) => {
    const product = await seedProduct({ name: `Classic Tee ${uniqueSuffix()}` })
    await signIn(page, admin)
    await page.goto("/products")

    await openRowMenu(page, product.name)
    await page.getByRole("menuitem", { name: "Edit" }).click()

    await page.waitForURL(`/products/${product.id}/edit/step-1`)
  })
})

test.describe("Publish product", () => {
  test("publishes a draft product that has a variant", async ({ page }) => {
    const product = await seedProduct({
      name: `Classic Tee ${uniqueSuffix()}`,
      status: "draft",
    })
    await seedProductVariant(product.id)
    await signIn(page, admin)
    await page.goto("/products")

    await openRowMenu(page, product.name)
    await page.getByRole("menuitem", { name: "Publish" }).click()

    const dialog = page.getByRole("alertdialog")
    await expect(dialog).toContainText(product.name)
    await dialog.getByRole("button", { name: "Publish" }).click()

    await expect(page.getByText("Product published")).toBeVisible()
    await expect(page.locator("tr", { hasText: product.name })).toContainText(
      "Published"
    )

    const [updated] = await testDb
      .select()
      .from(products)
      .where(eq(products.id, product.id))
    expect(updated!.status).toBe("active")
  })

  test("shows a friendly error when publishing a product with no variants", async ({
    page,
  }) => {
    const product = await seedProduct({
      name: `Classic Tee ${uniqueSuffix()}`,
      status: "draft",
    })
    await signIn(page, admin)
    await page.goto("/products")

    await openRowMenu(page, product.name)
    await page.getByRole("menuitem", { name: "Publish" }).click()

    const dialog = page.getByRole("alertdialog")
    await dialog.getByRole("button", { name: "Publish" }).click()

    await expect(page.getByText("Failed to publish product")).toBeVisible()
    await expect(
      page.getByText("Add at least one variant before publishing")
    ).toBeVisible()

    const [unchanged] = await testDb
      .select()
      .from(products)
      .where(eq(products.id, product.id))
    expect(unchanged!.status).toBe("draft")
  })

  test("does not publish when the confirmation is cancelled", async ({
    page,
  }) => {
    const product = await seedProduct({
      name: `Classic Tee ${uniqueSuffix()}`,
      status: "draft",
    })
    await seedProductVariant(product.id)
    await signIn(page, admin)
    await page.goto("/products")

    await openRowMenu(page, product.name)
    await page.getByRole("menuitem", { name: "Publish" }).click()

    const dialog = page.getByRole("alertdialog")
    await dialog.getByRole("button", { name: "Cancel" }).click()

    await expect(dialog).toBeHidden()

    const [unchanged] = await testDb
      .select()
      .from(products)
      .where(eq(products.id, product.id))
    expect(unchanged!.status).toBe("draft")
  })
})

test.describe("Move to draft", () => {
  test("moves a published product back to draft", async ({ page }) => {
    const product = await seedProduct({
      name: `Classic Tee ${uniqueSuffix()}`,
      status: "active",
    })
    await seedProductVariant(product.id)
    await signIn(page, admin)
    await page.goto("/products")

    await openRowMenu(page, product.name)
    await page.getByRole("menuitem", { name: "Move to draft" }).click()

    const dialog = page.getByRole("alertdialog")
    await expect(dialog).toContainText(product.name)
    await dialog.getByRole("button", { name: "Move to draft" }).click()

    const [updated] = await testDb
      .select()
      .from(products)
      .where(eq(products.id, product.id))
    expect(updated!.status).toBe("draft")
  })
})

test.describe("Deactivate product", () => {
  test("deactivates a product after confirming", async ({ page }) => {
    const product = await seedProduct({ name: `Classic Tee ${uniqueSuffix()}` })
    await signIn(page, admin)
    await page.goto("/products")

    await openRowMenu(page, product.name)
    await page.getByRole("menuitem", { name: "Deactivate" }).click()

    const dialog = page.getByRole("alertdialog")
    await expect(dialog).toContainText(product.name)
    await dialog.getByRole("button", { name: "Deactivate" }).click()

    await expect(page.getByText("Product deactivated")).toBeVisible()

    const row = page.locator("tr", { hasText: product.name })
    await expect(row).toContainText("Inactive")
    await row.getByRole("button", { name: "Open menu" }).click()
    await expect(page.getByRole("menuitem", { name: "Activate" })).toBeVisible()

    const [updated] = await testDb
      .select()
      .from(products)
      .where(eq(products.id, product.id))
    expect(updated!.isActive).toBe(false)
  })
})

test.describe("Activate product", () => {
  test("reactivates a deactivated product", async ({ page }) => {
    const product = await seedProduct({
      name: `Classic Tee ${uniqueSuffix()}`,
      isActive: false,
    })
    await signIn(page, admin)
    await page.goto("/products")

    await openRowMenu(page, product.name)
    await page.getByRole("menuitem", { name: "Activate" }).click()

    await expect(page.getByText("Product activated")).toBeVisible()
    await expect(page.locator("tr", { hasText: product.name })).toContainText(
      "Active"
    )

    const [updated] = await testDb
      .select()
      .from(products)
      .where(eq(products.id, product.id))
    expect(updated!.isActive).toBe(true)
  })

  test("shows a friendly error when reactivating conflicts with another active product's slug", async ({
    page,
  }) => {
    const other = await seedProduct({ name: `Other Product ${uniqueSuffix()}` })
    const [product] = await testDb
      .insert(products)
      .values({
        name: `Classic Tee ${uniqueSuffix()}`,
        slug: other.slug,
        status: "draft",
        isActive: false,
      })
      .returning()
    await signIn(page, admin)
    await page.goto("/products")

    await openRowMenu(page, product!.name)
    await page.getByRole("menuitem", { name: "Activate" }).click()

    await expect(page.getByText("Failed to activate product")).toBeVisible()
    await expect(
      page.getByText("Another active product already uses this slug")
    ).toBeVisible()

    const [unchanged] = await testDb
      .select()
      .from(products)
      .where(eq(products.id, product!.id))
    expect(unchanged!.isActive).toBe(false)
  })
})
