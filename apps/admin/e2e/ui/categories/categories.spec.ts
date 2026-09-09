import { test, expect, type Page } from "@playwright/test"
import { eq } from "drizzle-orm"
import { categories } from "@repo/db/public/schema"
import { testDb } from "../../utils/db"
import { seedAdmin } from "../../utils/seed-user"
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

test.describe("Create category", () => {
  test("creates a category and shows it in the list", async ({ page }) => {
    const name = `Outdoor ${uniqueSuffix()}`
    await signIn(page, admin)
    await page.goto("/categories")

    await page.getByTestId("new-category-button").click()
    await page.getByTestId("category-name-input").fill(name)
    await page
      .getByTestId("category-description-input")
      .fill("Tents, packs, and camp gear")
    await page.getByTestId("category-submit-button").click()

    await expect(page.getByText("Category created")).toBeVisible()
    await expect(page.getByTestId("category-form")).toBeHidden()

    const row = page.locator("tr", { hasText: name })
    await expect(row).toContainText("Tents, packs, and camp gear")

    const [category] = await testDb
      .select()
      .from(categories)
      .where(eq(categories.name, name))
    expect(category).toBeDefined()
  })

  test("shows a friendly error when the name already exists", async ({
    page,
  }) => {
    const category = await seedCategory()
    await signIn(page, admin)
    await page.goto("/categories")

    await page.getByTestId("new-category-button").click()
    await page.getByTestId("category-name-input").fill(category.name)
    await page.getByTestId("category-submit-button").click()

    await expect(page.getByText("Failed to create category")).toBeVisible()
  })

  test("shows a validation error for a whitespace-only name", async ({
    page,
  }) => {
    await signIn(page, admin)
    await page.goto("/categories")

    await page.getByTestId("new-category-button").click()
    await page.getByTestId("category-name-input").fill("   ")
    await page.getByTestId("category-submit-button").click()

    await expect(page.getByText("Failed to create category")).toBeVisible()
  })

  test("does not create anything when cancelled", async ({ page }) => {
    const name = `Never Saved ${uniqueSuffix()}`
    await signIn(page, admin)
    await page.goto("/categories")

    await page.getByTestId("new-category-button").click()
    await page.getByTestId("category-name-input").fill(name)
    await page.getByRole("button", { name: "Cancel" }).click()

    await expect(page.getByTestId("category-form")).toBeHidden()
    await expect(page.getByText("Category created")).toBeHidden()

    const rows = await testDb
      .select()
      .from(categories)
      .where(eq(categories.name, name))
    expect(rows).toHaveLength(0)
  })
})

test.describe("Edit category", () => {
  test("updates a category's name and description", async ({ page }) => {
    const category = await seedCategory()
    const updatedName = `Updated Name ${uniqueSuffix()}`
    await signIn(page, admin)
    await page.goto("/categories")

    await openRowMenu(page, category.name)
    await page.getByRole("menuitem", { name: "Update" }).click()

    await expect(page.getByTestId("category-name-input")).toHaveValue(
      category.name
    )
    await page.getByTestId("category-name-input").fill(updatedName)
    await page
      .getByTestId("category-description-input")
      .fill("Updated description")
    await page.getByTestId("category-submit-button").click()

    await expect(page.getByText("Category updated")).toBeVisible()

    const row = page.locator("tr", { hasText: updatedName })
    await expect(row).toContainText("Updated description")
    await expect(page.locator("tr", { hasText: category.name })).toHaveCount(
      0
    )

    const [updated] = await testDb
      .select()
      .from(categories)
      .where(eq(categories.id, category.id))
    expect(updated!.name).toBe(updatedName)
    expect(updated!.updatedBy).toBeTruthy()
  })

  test("shows a friendly error when renaming to another category's existing name", async ({
    page,
  }) => {
    const categoryA = await seedCategory({ name: "Outdoor" })
    const categoryB = await seedCategory({ name: "Kitchen" })
    await signIn(page, admin)
    await page.goto("/categories")

    await openRowMenu(page, categoryB.name)
    await page.getByRole("menuitem", { name: "Update" }).click()

    await page.getByTestId("category-name-input").fill(categoryA.name)
    await page.getByTestId("category-submit-button").click()

    await expect(page.getByText("Failed to update category")).toBeVisible()

    const [unchanged] = await testDb
      .select()
      .from(categories)
      .where(eq(categories.id, categoryB.id))
    expect(unchanged!.name).toBe(categoryB.name)
  })
})

test.describe("Deactivate category", () => {
  test("deactivates a category after confirming", async ({ page }) => {
    const category = await seedCategory()
    await signIn(page, admin)
    await page.goto("/categories")

    await openRowMenu(page, category.name)
    await page.getByRole("menuitem", { name: "Deactivate" }).click()

    const dialog = page.getByRole("alertdialog")
    await expect(dialog).toContainText(category.name)
    await dialog.getByRole("button", { name: "Deactivate" }).click()

    await expect(page.getByText("Category deactivated")).toBeVisible()
    await expect(page.locator("tr", { hasText: category.name })).toHaveCount(
      0
    )

    const [remaining] = await testDb
      .select()
      .from(categories)
      .where(eq(categories.id, category.id))
    expect(remaining!.isActive).toBe(false)
  })

  test("does not deactivate when the confirmation is cancelled", async ({
    page,
  }) => {
    const category = await seedCategory()
    await signIn(page, admin)
    await page.goto("/categories")

    await openRowMenu(page, category.name)
    await page.getByRole("menuitem", { name: "Deactivate" }).click()

    const dialog = page.getByRole("alertdialog")
    await dialog.getByRole("button", { name: "Cancel" }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByText("Category deactivated")).toBeHidden()
    await expect(page.locator("tr", { hasText: category.name })).toBeVisible()

    const [stillThere] = await testDb
      .select()
      .from(categories)
      .where(eq(categories.id, category.id))
    expect(stillThere!.isActive).toBe(true)
  })
})

test.describe("Search categories", () => {
  test("filters the list by name", async ({ page }) => {
    const outdoor = await seedCategory({ name: "Outdoor" })
    const kitchen = await seedCategory({ name: "Kitchen" })
    await signIn(page, admin)
    await page.goto("/categories")

    await page.getByTestId("data-table-search-input").fill(outdoor.name)

    await expect(page.locator("tr", { hasText: outdoor.name })).toBeVisible()
    await expect(page.locator("tr", { hasText: kitchen.name })).toHaveCount(0)
  })
})
