import { test, expect } from "@playwright/test"
import { eq, and } from "drizzle-orm"
import {
  productCategories,
  productOptions,
  productOptionValues,
} from "@repo/db/public/schema"
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

test.describe("Categories (step 2)", () => {
  test("selects an existing category without a confirmation dialog", async ({
    page,
  }) => {
    const product = await seedProduct()
    const category = await seedCategory({ name: "Outdoor" })
    await signIn(page, admin)
    await page.goto(`/products/${product.id}/edit/step-2`)

    await page.getByPlaceholder("Add categories...").click()
    await page
      .locator('[data-slot="combobox-item"]', { hasText: category.name })
      .click()

    await expect(page.getByRole("alertdialog")).toHaveCount(0)
    await expect(
      page.locator('[data-slot="combobox-chip"]', { hasText: category.name })
    ).toBeVisible()
    await expect(page.getByText("Categories updated")).toBeVisible()

    const [row] = await testDb
      .select()
      .from(productCategories)
      .where(
        and(
          eq(productCategories.productId, product.id),
          eq(productCategories.categoryId, category.id)
        )
      )
    expect(row).toBeDefined()
  })

  test("creates a new category inline and selects it after confirming", async ({
    page,
  }) => {
    const product = await seedProduct()
    const name = `Kitchen ${uniqueSuffix()}`
    await signIn(page, admin)
    await page.goto(`/products/${product.id}/edit/step-2`)

    await page.getByPlaceholder("Add categories...").fill(name)
    await page.getByRole("button", { name: `Create "${name}"` }).click()

    const dialog = page.getByRole("alertdialog")
    await expect(dialog).toContainText(`Create the category "${name}"?`)
    await dialog.getByRole("button", { name: "Create" }).click()

    await expect(page.getByText("Category created")).toBeVisible()
    await expect(
      page.locator('[data-slot="combobox-chip"]', { hasText: name })
    ).toBeVisible()
  })

  test("keeps a selected category's chip visible until removal is confirmed, and restores it cleanly on cancel", async ({
    page,
  }) => {
    const product = await seedProduct()
    const category = await seedCategory({ name: "Outdoor" })
    await testDb
      .insert(productCategories)
      .values({ productId: product.id, categoryId: category.id })
    await signIn(page, admin)
    await page.goto(`/products/${product.id}/edit/step-2`)

    const chip = page.locator('[data-slot="combobox-chip"]', {
      hasText: category.name,
    })
    await expect(chip).toBeVisible()

    await chip.locator('[data-slot="combobox-chip-remove"]').click()

    const dialog = page.getByRole("alertdialog")
    await expect(dialog).toContainText(
      `Remove "${category.name}" from this product?`
    )
    await expect(chip).toBeVisible()

    await dialog.getByRole("button", { name: "Cancel" }).click()
    await expect(dialog).toBeHidden()
    await expect(chip).toBeVisible()

    const [stillThere] = await testDb
      .select()
      .from(productCategories)
      .where(
        and(
          eq(productCategories.productId, product.id),
          eq(productCategories.categoryId, category.id)
        )
      )
    expect(stillThere).toBeDefined()

    await chip.locator('[data-slot="combobox-chip-remove"]').click()
    await page.getByRole("alertdialog").getByRole("button", { name: "Remove" }).click()

    await expect(page.getByText("Categories updated")).toBeVisible()
    await expect(chip).toBeHidden()

    const [removed] = await testDb
      .select()
      .from(productCategories)
      .where(
        and(
          eq(productCategories.productId, product.id),
          eq(productCategories.categoryId, category.id)
        )
      )
    expect(removed).toBeUndefined()
  })

  test("loads previously assigned categories as chips", async ({ page }) => {
    const product = await seedProduct()
    const category = await seedCategory({ name: "Outdoor" })
    await testDb
      .insert(productCategories)
      .values({ productId: product.id, categoryId: category.id })
    await signIn(page, admin)
    await page.goto(`/products/${product.id}/edit/step-2`)

    await expect(
      page.locator('[data-slot="combobox-chip"]', { hasText: category.name })
    ).toBeVisible()
  })
})

test.describe("Options (step 2)", () => {
  test("creates an option and shows it with no values yet", async ({
    page,
  }) => {
    const product = await seedProduct()
    await signIn(page, admin)
    await page.goto(`/products/${product.id}/edit/step-2`)

    await page.getByPlaceholder("e.g. Size, Color").fill("Size")
    await page.getByRole("button", { name: "Add option" }).click()

    const dialog = page.getByRole("alertdialog")
    await expect(dialog).toContainText('Create the option "Size"?')
    await dialog.getByRole("button", { name: "Create" }).click()

    await expect(page.getByText("Option added")).toBeVisible()
    await expect(page.getByText("Size", { exact: true })).toBeVisible()

    const [option] = await testDb
      .select()
      .from(productOptions)
      .where(eq(productOptions.productId, product.id))
    expect(option).toBeDefined()
  })

  test("shows a friendly error when the option name already exists on this product", async ({
    page,
  }) => {
    const product = await seedProduct()
    await seedProductOption(product.id, "Size")
    await signIn(page, admin)
    await page.goto(`/products/${product.id}/edit/step-2`)

    await page.getByPlaceholder("e.g. Size, Color").fill("Size")
    await page.getByRole("button", { name: "Add option" }).click()
    await page.getByRole("alertdialog").getByRole("button", { name: "Create" }).click()

    await expect(page.getByText("Failed to add option")).toBeVisible()
  })

  test("adds a value to an option", async ({ page }) => {
    const product = await seedProduct()
    const option = await seedProductOption(product.id, "Color")
    await signIn(page, admin)
    await page.goto(`/products/${product.id}/edit/step-2`)

    await page.getByPlaceholder("Add a value").fill("Red")
    await page.getByRole("button", { name: "Add", exact: true }).click()

    const dialog = page.getByRole("alertdialog")
    await expect(dialog).toContainText('Add "Red" to Color?')
    await dialog.getByRole("button", { name: "Add", exact: true }).click()

    await expect(page.getByText("Value added")).toBeVisible()
    await expect(page.getByText("Red", { exact: true })).toBeVisible()

    const values = await testDb
      .select()
      .from(productOptionValues)
      .where(eq(productOptionValues.optionId, option.id))
    expect(values).toHaveLength(1)
  })

  test("allows two values on the same option that differ only by case", async ({
    page,
  }) => {
    const product = await seedProduct()
    const option = await seedProductOption(product.id, "Color", ["red"])
    await signIn(page, admin)
    await page.goto(`/products/${product.id}/edit/step-2`)

    await page.getByPlaceholder("Add a value").fill("Red")
    await page.getByRole("button", { name: "Add", exact: true }).click()
    await page.getByRole("alertdialog").getByRole("button", { name: "Add", exact: true }).click()

    await expect(page.getByText("Value added")).toBeVisible()

    const values = await testDb
      .select()
      .from(productOptionValues)
      .where(eq(productOptionValues.optionId, option.id))
    expect(values).toHaveLength(2)
  })

  test("shows a friendly error when the value already exists on that option", async ({
    page,
  }) => {
    const product = await seedProduct()
    await seedProductOption(product.id, "Color", ["Red"])
    await signIn(page, admin)
    await page.goto(`/products/${product.id}/edit/step-2`)

    await page.getByPlaceholder("Add a value").fill("Red")
    await page.getByRole("button", { name: "Add", exact: true }).click()
    await page.getByRole("alertdialog").getByRole("button", { name: "Add", exact: true }).click()

    await expect(page.getByText("Failed to add value")).toBeVisible()
  })

  test("deletes a value from an option", async ({ page }) => {
    const product = await seedProduct()
    const option = await seedProductOption(product.id, "Color", ["Red"])
    await signIn(page, admin)
    await page.goto(`/products/${product.id}/edit/step-2`)

    await page.getByText("Red", { exact: true }).getByRole("button").click()

    const dialog = page.getByRole("alertdialog")
    await expect(dialog).toContainText('Delete "Red" from Color?')
    await dialog.getByRole("button", { name: "Delete" }).click()

    await expect(page.getByText("Value removed")).toBeVisible()
    await expect(page.getByText("Red", { exact: true })).toBeHidden()

    const values = await testDb
      .select()
      .from(productOptionValues)
      .where(eq(productOptionValues.optionId, option.id))
    expect(values).toHaveLength(0)
  })

  test("deletes an option and removes its values from the page", async ({
    page,
  }) => {
    const product = await seedProduct()
    await seedProductOption(product.id, "Color", ["Red", "Blue"])
    await signIn(page, admin)
    await page.goto(`/products/${product.id}/edit/step-2`)

    await page.getByText("Color", { exact: true }).locator("..").getByRole("button").click()

    const dialog = page.getByRole("alertdialog")
    await expect(dialog).toContainText(
      'Delete "Color" and all its values? This can\'t be undone.'
    )
    await dialog.getByRole("button", { name: "Delete" }).click()

    await expect(page.getByText("Option removed")).toBeVisible()
    await expect(page.getByText("Red", { exact: true })).toBeHidden()
    await expect(page.getByText("Blue", { exact: true })).toBeHidden()

    const remaining = await testDb
      .select()
      .from(productOptions)
      .where(eq(productOptions.productId, product.id))
    expect(remaining).toHaveLength(0)
  })

  test("shows a friendly error when deleting an option used by an active variant", async ({
    page,
  }) => {
    const product = await seedProduct()
    const option = await seedProductOption(product.id, "Color", ["Red"])
    await seedProductVariant(product.id, {}, [option.values[0]!.id])
    await signIn(page, admin)
    await page.goto(`/products/${product.id}/edit/step-2`)

    await page.getByText("Color", { exact: true }).locator("..").getByRole("button").click()
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click()

    await expect(page.getByText("Failed to remove option")).toBeVisible()
    await expect(
      page.getByText("it's used by an active variant")
    ).toBeVisible()

    const remaining = await testDb
      .select()
      .from(productOptions)
      .where(eq(productOptions.productId, product.id))
    expect(remaining).toHaveLength(1)
  })
})

test("continues to step 3 without requiring any categories or options", async ({
  page,
}) => {
  const product = await seedProduct()
  await signIn(page, admin)
  await page.goto(`/products/${product.id}/edit/step-2`)

  await page.getByRole("button", { name: "Continue" }).click()

  await page.waitForURL(`/products/${product.id}/edit/step-3`)
})
