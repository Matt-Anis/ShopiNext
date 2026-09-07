import { test, expect, type Page } from "@playwright/test"
import { eq } from "drizzle-orm"
import {
  products,
  productVariants,
  orders,
  orderItems,
} from "@repo/db/public/schema"
import { testDb } from "../../utils/db"
import {
  resetAuthTables,
  resetProductTables,
  resetCategoryTables,
} from "../../utils/db-reset"
import { seedAdmin } from "../../utils/seed-user"
import {
  seedProduct,
  seedProductOption,
  seedProductVariant,
  DEFAULT_TEST_PRODUCT,
} from "../../utils/seed-product"
import { signIn } from "../../utils/auth"

test.beforeEach(async () => {
  await resetAuthTables()
  await resetProductTables()
  await resetCategoryTables()
  await seedAdmin()
})

function draftRow(page: Page) {
  return page.locator("tbody tr").last()
}

function variantRow(page: Page, sku: string) {
  return page
    .locator("tr")
    .filter({ has: page.locator(`input[value="${sku}"]`) })
}

test.describe("Creating variants (step 3)", () => {
  test("creates the first variant on a product with no options", async ({
    page,
  }) => {
    const product = await seedProduct()
    await signIn(page)
    await page.goto(`/products/${product.id}/edit/step-3`)

    await draftRow(page).getByRole("textbox").fill("v1")
    await page.getByRole("button", { name: "Add variant" }).click()

    const dialog = page.getByRole("alertdialog")
    await expect(dialog).toContainText('Create "v1"?')
    await dialog.getByRole("button", { name: "Create" }).click()

    await expect(page.getByText("Variant created")).toBeVisible()
    await expect(variantRow(page, "v1")).toBeVisible()
  })

  test("blocks a second no-options variant on the same product", async ({
    page,
  }) => {
    const product = await seedProduct()
    await seedProductVariant(product.id, { sku: "v1" })
    await signIn(page)
    await page.goto(`/products/${product.id}/edit/step-3`)

    await draftRow(page).getByRole("textbox").fill("v2")
    await page.getByRole("button", { name: "Add variant" }).click()
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Create" })
      .click()

    await expect(page.getByText("Failed to create variant")).toBeVisible()
    await expect(
      page.getByText(
        "A variant with this exact option combination already exists"
      )
    ).toBeVisible()
  })

  test("creates a variant with only some of the product's options selected", async ({
    page,
  }) => {
    const product = await seedProduct()
    await seedProductOption(product.id, "Color", ["Red", "Blue"])
    await seedProductOption(product.id, "Size", ["Small", "Large"])
    await signIn(page)
    await page.goto(`/products/${product.id}/edit/step-3`)

    await draftRow(page).getByPlaceholder("Color").click()
    await page
      .locator('[data-slot="combobox-item"]', { hasText: "Red" })
      .click()
    await draftRow(page).getByRole("textbox").fill("v1")
    await page.getByRole("button", { name: "Add variant" }).click()

    const dialog = page.getByRole("alertdialog")
    await expect(dialog).toContainText('Create "v1" (Red)?')
    await dialog.getByRole("button", { name: "Create" }).click()

    await expect(page.getByText("Variant created")).toBeVisible()
    await expect(variantRow(page, "v1")).toContainText("Red")
  })

  test("shows an error without opening a dialog when no option value is selected", async ({
    page,
  }) => {
    const product = await seedProduct()
    await seedProductOption(product.id, "Color", ["Red"])
    await signIn(page)
    await page.goto(`/products/${product.id}/edit/step-3`)

    await draftRow(page).getByRole("textbox").fill("v1")
    await page.getByRole("button", { name: "Add variant" }).click()

    await expect(
      page.getByText("Select at least one option value")
    ).toBeVisible()
    await expect(page.getByRole("alertdialog")).toHaveCount(0)
  })

  test("auto-suggests the SKU from the selected options until it's edited by hand", async ({
    page,
  }) => {
    const product = await seedProduct()
    await seedProductOption(product.id, "Color", ["Red", "Blue"])
    await signIn(page)
    await page.goto(`/products/${product.id}/edit/step-3`)

    const sku = draftRow(page).getByRole("textbox")

    await draftRow(page).getByPlaceholder("Color").click()
    await page
      .locator('[data-slot="combobox-item"]', { hasText: "Red" })
      .click()
    await expect(sku).toHaveValue(`${DEFAULT_TEST_PRODUCT.slug}-red`)

    await sku.fill("custom-sku")

    await draftRow(page).getByPlaceholder("Color").click()
    await page
      .locator('[data-slot="combobox-item"]', { hasText: "Blue" })
      .click()
    await expect(sku).toHaveValue("custom-sku")
  })

  test("blocks a second variant with the same option combination", async ({
    page,
  }) => {
    const product = await seedProduct()
    const option = await seedProductOption(product.id, "Color", ["Red"])
    await seedProductVariant(product.id, { sku: "v1" }, [option.values[0]!.id])
    await signIn(page)
    await page.goto(`/products/${product.id}/edit/step-3`)

    await draftRow(page).getByPlaceholder("Color").click()
    await page
      .locator('[data-slot="combobox-item"]', { hasText: "Red" })
      .click()
    await draftRow(page).getByRole("textbox").fill("v2")
    await page.getByRole("button", { name: "Add variant" }).click()
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Create" })
      .click()

    await expect(
      page.getByText(
        "A variant with this exact option combination already exists"
      )
    ).toBeVisible()
  })

  test("blocks a variant whose SKU is already used by another variant on the same product", async ({
    page,
  }) => {
    const product = await seedProduct()
    const option = await seedProductOption(product.id, "Color", ["Red", "Blue"])
    await seedProductVariant(product.id, { sku: "dup-sku" }, [
      option.values[0]!.id,
    ])
    await signIn(page)
    await page.goto(`/products/${product.id}/edit/step-3`)

    await draftRow(page).getByPlaceholder("Color").click()
    await page
      .locator('[data-slot="combobox-item"]', { hasText: "Blue" })
      .click()
    await draftRow(page).getByRole("textbox").fill("dup-sku")
    await page.getByRole("button", { name: "Add variant" }).click()
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Create" })
      .click()

    await expect(page.getByText("This SKU is already in use")).toBeVisible()
  })

  test("shows a validation error for a negative price", async ({ page }) => {
    const product = await seedProduct()
    await signIn(page)
    await page.goto(`/products/${product.id}/edit/step-3`)

    await draftRow(page).getByRole("textbox").fill("v1")
    await draftRow(page).getByRole("spinbutton").nth(0).fill("-5")
    await page.getByRole("button", { name: "Add variant" }).click()
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Create" })
      .click()

    await expect(page.getByText("Price can't be negative")).toBeVisible()
  })

  test("shows a validation error for negative stock", async ({ page }) => {
    const product = await seedProduct()
    await signIn(page)
    await page.goto(`/products/${product.id}/edit/step-3`)

    await draftRow(page).getByRole("textbox").fill("v1")
    await draftRow(page).getByRole("spinbutton").nth(1).fill("-1")
    await page.getByRole("button", { name: "Add variant" }).click()
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Create" })
      .click()

    await expect(page.getByText("Stock can't be negative")).toBeVisible()
  })

  test("shows a validation error when max per order is less than 1", async ({
    page,
  }) => {
    const product = await seedProduct()
    await signIn(page)
    await page.goto(`/products/${product.id}/edit/step-3`)

    await draftRow(page).getByRole("textbox").fill("v1")
    await draftRow(page).getByRole("spinbutton").nth(2).fill("0")
    await page.getByRole("button", { name: "Add variant" }).click()
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Create" })
      .click()

    await expect(
      page.getByText("Max per order must be at least 1")
    ).toBeVisible()
  })

  test("resets the new-variant row after a successful create", async ({
    page,
  }) => {
    const product = await seedProduct()
    await signIn(page)
    await page.goto(`/products/${product.id}/edit/step-3`)

    await draftRow(page).getByRole("textbox").fill("v1")
    await page.getByRole("button", { name: "Add variant" }).click()
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Create" })
      .click()
    await expect(page.getByText("Variant created")).toBeVisible()

    // The row remounts (not just clears in place) - SKU goes back to the
    // product slug, matching a fresh row's default, not blank or stale.
    await expect(draftRow(page).getByRole("textbox")).toHaveValue(
      DEFAULT_TEST_PRODUCT.slug
    )
  })

  test("closes the dialog on Escape without creating anything, and returns focus to the trigger", async ({
    page,
  }) => {
    const product = await seedProduct()
    await signIn(page)
    await page.goto(`/products/${product.id}/edit/step-3`)

    await draftRow(page).getByRole("textbox").fill("v1")
    const trigger = page.getByRole("button", { name: "Add variant" })
    await trigger.click()

    await expect(page.getByRole("alertdialog")).toBeVisible()
    await page.keyboard.press("Escape")

    await expect(page.getByRole("alertdialog")).toBeHidden()
    await expect(trigger).toBeFocused()

    const [variant] = await testDb
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, product.id))
    expect(variant).toBeUndefined()
    await expect(page.locator("tbody tr")).toHaveCount(1)
  })
})

test.describe("Editing and deleting variants (step 3)", () => {
  test("keeps Save disabled until a field changes, and re-disables after reverting it", async ({
    page,
  }) => {
    const product = await seedProduct()
    await seedProductVariant(product.id, { sku: "v1", price: 1000 })
    await signIn(page)
    await page.goto(`/products/${product.id}/edit/step-3`)

    const row = variantRow(page, "v1")
    const save = row.getByRole("button", { name: "Save changes" })
    await expect(save).toBeDisabled()

    const price = row.getByRole("spinbutton").nth(0)
    await price.fill("12.00")
    await expect(save).toBeEnabled()

    await price.fill("10.00")
    await expect(save).toBeDisabled()
  })

  test("shows a friendly error when editing a variant's SKU to collide with another variant", async ({
    page,
  }) => {
    const product = await seedProduct()
    const option = await seedProductOption(product.id, "Color", ["Red", "Blue"])
    await seedProductVariant(product.id, { sku: "v1" }, [option.values[0]!.id])
    await seedProductVariant(product.id, { sku: "v2" }, [option.values[1]!.id])
    await signIn(page)
    await page.goto(`/products/${product.id}/edit/step-3`)

    const row = page.locator("tr").filter({ hasText: "Blue" })
    await row.getByRole("textbox").fill("v1")
    await row.getByRole("button", { name: "Save changes" }).click()

    await expect(page.getByText("This SKU is already in use")).toBeVisible()
  })

  test("does not double-submit on a rapid double-click of Save", async ({
    page,
  }) => {
    const product = await seedProduct()
    await seedProductVariant(product.id, { sku: "v1", stock: 5 })
    await signIn(page)
    await page.goto(`/products/${product.id}/edit/step-3`)

    const row = variantRow(page, "v1")
    await row.getByRole("spinbutton").nth(1).fill("9")
    const save = row.getByRole("button", { name: "Save changes" })
    await save.click()
    await save.click({ force: true })

    await expect(page.getByText("Variant updated")).toBeVisible()
  })

  test("deletes a variant after confirming", async ({ page }) => {
    const product = await seedProduct()
    await seedProductVariant(product.id, { sku: "v1" })
    await signIn(page)
    await page.goto(`/products/${product.id}/edit/step-3`)

    const row = variantRow(page, "v1")
    await row.getByRole("button", { name: "Delete variant" }).click()

    const dialog = page.getByRole("alertdialog")
    await expect(dialog).toContainText('Delete "v1"')
    await dialog.getByRole("button", { name: "Delete" }).click()

    await expect(page.getByText("Variant deleted")).toBeVisible()
    await expect(row).toHaveCount(0)
  })

  test("shows a friendly error when deleting a variant that has an existing order", async ({
    page,
  }) => {
    const product = await seedProduct()
    const variant = await seedProductVariant(product.id, { sku: "v1" })
    const [order] = await testDb
      .insert(orders)
      .values({
        checkoutEmail: "buyer@example.com",
        stripeSessionId: `test-session-${variant.id}`,
        totalAmount: variant.price,
      })
      .returning()
    await testDb.insert(orderItems).values({
      orderId: order!.id,
      variantId: variant.id,
      priceAtPurchase: variant.price,
      quantity: 1,
    })
    await signIn(page)
    await page.goto(`/products/${product.id}/edit/step-3`)

    const row = variantRow(page, "v1")
    await row.getByRole("button", { name: "Delete variant" }).click()
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Delete" })
      .click()

    await expect(
      page.getByText("Can't delete this variant, it has existing orders")
    ).toBeVisible()
    await expect(row).toBeVisible()
  })
})

test.describe("Publishing (step 3)", () => {
  test("publishes the product once at least one variant exists", async ({
    page,
  }) => {
    const product = await seedProduct()
    await seedProductVariant(product.id, { sku: "v1" })
    await signIn(page)
    await page.goto(`/products/${product.id}/edit/step-3`)

    await page.getByRole("button", { name: "Publish" }).click()

    await expect(page.getByText("Product published")).toBeVisible()
    await page.waitForURL("/products")

    const [updated] = await testDb
      .select()
      .from(products)
      .where(eq(products.id, product.id))
    expect(updated!.status).toBe("active")
  })

  test("saves as draft regardless of variant count", async ({ page }) => {
    const product = await seedProduct({ status: "active" })
    await signIn(page)
    await page.goto(`/products/${product.id}/edit/step-3`)

    await page.getByRole("button", { name: "Save as draft" }).click()

    await expect(page.getByText("Draft saved")).toBeVisible()
    await page.waitForURL("/products")

    const [updated] = await testDb
      .select()
      .from(products)
      .where(eq(products.id, product.id))
    expect(updated!.status).toBe("draft")
  })
})
