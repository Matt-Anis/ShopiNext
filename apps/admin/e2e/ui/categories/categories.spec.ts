import { test, expect, type Page } from "@playwright/test"
import { eq } from "drizzle-orm"
import { categories } from "@repo/db/public/schema"
import { testDb } from "../../utils/db"
import { resetAuthTables, resetCategoryTables } from "../../utils/db-reset"
import { seedAdmin, DEFAULT_TEST_ADMIN } from "../../utils/seed-user"
import { seedCategory, DEFAULT_TEST_CATEGORY } from "../../utils/seed-category"

test.beforeEach(async () => {
  await resetAuthTables()
  await resetCategoryTables()
  await seedAdmin()
})

async function signIn(page: Page) {
  await page.goto("/login")
  await page.getByTestId("login-email-input").fill(DEFAULT_TEST_ADMIN.email)
  await page
    .getByTestId("login-password-input")
    .fill(DEFAULT_TEST_ADMIN.password)
  await page.getByTestId("login-submit-button").click()
  await page.waitForURL("/")
}

async function openRowMenu(page: Page, rowText: string) {
  const row = page.locator("tr", { hasText: rowText })
  await row.getByRole("button", { name: "Open menu" }).click()
}

test.describe("Create category", () => {
  test("creates a category and shows it in the list", async ({ page }) => {
    await signIn(page)
    await page.goto("/categories")

    await page.getByTestId("new-category-button").click()
    await page.getByTestId("category-name-input").fill("Outdoor")
    await page
      .getByTestId("category-description-input")
      .fill("Tents, packs, and camp gear")
    await page.getByTestId("category-submit-button").click()

    await expect(page.getByText("Category created")).toBeVisible()
    await expect(page.getByTestId("category-form")).toBeHidden()

    const row = page.locator("tr", { hasText: "Outdoor" })
    await expect(row).toContainText("Tents, packs, and camp gear")

    const [category] = await testDb
      .select()
      .from(categories)
      .where(eq(categories.name, "Outdoor"))
    expect(category).toBeDefined()
  })

  test("shows a friendly error when the name already exists", async ({
    page,
  }) => {
    await seedCategory()
    await signIn(page)
    await page.goto("/categories")

    await page.getByTestId("new-category-button").click()
    await page
      .getByTestId("category-name-input")
      .fill(DEFAULT_TEST_CATEGORY.name)
    await page.getByTestId("category-submit-button").click()

    await expect(page.getByText("Failed to create category")).toBeVisible()
    await expect(
      page.getByText("A category with this name already exists"),
    ).toBeVisible()
    // Drawer stays open so the admin can fix the name and retry.
    await expect(page.getByTestId("category-form")).toBeVisible()
  })

  test("shows a validation error for a whitespace-only name", async ({
    page,
  }) => {
    await signIn(page)
    await page.goto("/categories")

    await page.getByTestId("new-category-button").click()
    await page.getByTestId("category-name-input").fill("   ")
    await page.getByTestId("category-submit-button").click()

    await expect(page.getByText("Failed to create category")).toBeVisible()
    await expect(page.getByText("Name is required")).toBeVisible()
    await expect(page.getByTestId("category-form")).toBeVisible()

    const rows = await testDb.select().from(categories)
    expect(rows).toHaveLength(0)
  })

  test("does not create anything when cancelled", async ({ page }) => {
    await signIn(page)
    await page.goto("/categories")

    await page.getByTestId("new-category-button").click()
    await page.getByTestId("category-name-input").fill("Never Saved")
    await page.getByRole("button", { name: "Cancel" }).click()

    await expect(page.getByTestId("category-form")).toBeHidden()
    await expect(page.getByText("Category created")).toBeHidden()

    const rows = await testDb
      .select()
      .from(categories)
      .where(eq(categories.name, "Never Saved"))
    expect(rows).toHaveLength(0)
  })
})

test.describe("Edit category", () => {
  test("updates a category's name and description", async ({ page }) => {
    const category = await seedCategory()
    await signIn(page)
    await page.goto("/categories")

    await openRowMenu(page, category.name)
    await page.getByRole("menuitem", { name: "Update" }).click()

    await expect(page.getByTestId("category-name-input")).toHaveValue(
      category.name,
    )
    await page.getByTestId("category-name-input").fill("Updated Name")
    await page
      .getByTestId("category-description-input")
      .fill("Updated description")
    await page.getByTestId("category-submit-button").click()

    await expect(page.getByText("Category updated")).toBeVisible()

    const row = page.locator("tr", { hasText: "Updated Name" })
    await expect(row).toContainText("Updated description")
    await expect(
      page.locator("tr", { hasText: category.name }),
    ).toHaveCount(0)

    const [updated] = await testDb
      .select()
      .from(categories)
      .where(eq(categories.id, category.id))
    expect(updated!.name).toBe("Updated Name")
    expect(updated!.updatedBy).toBeTruthy()
  })

  test("shows a friendly error when renaming to another category's existing name", async ({
    page,
  }) => {
    const categoryA = await seedCategory({ name: "Outdoor" })
    const categoryB = await seedCategory({ name: "Kitchen" })
    await signIn(page)
    await page.goto("/categories")

    await openRowMenu(page, categoryB.name)
    await page.getByRole("menuitem", { name: "Update" }).click()

    await page.getByTestId("category-name-input").fill(categoryA.name)
    await page.getByTestId("category-submit-button").click()

    await expect(page.getByText("Failed to update category")).toBeVisible()
    await expect(
      page.getByText("A category with this name already exists"),
    ).toBeVisible()
    await expect(page.getByTestId("category-form")).toBeVisible()

    const [unchanged] = await testDb
      .select()
      .from(categories)
      .where(eq(categories.id, categoryB.id))
    expect(unchanged!.name).toBe("Kitchen")
  })
})

test.describe("Delete category", () => {
  test("deletes a category after confirming", async ({ page }) => {
    const category = await seedCategory()
    await signIn(page)
    await page.goto("/categories")

    await openRowMenu(page, category.name)
    await page.getByRole("menuitem", { name: "Delete" }).click()

    const dialog = page.getByRole("alertdialog")
    await expect(dialog).toContainText(category.name)
    await dialog.getByRole("button", { name: "Delete" }).click()

    await expect(page.getByText("Category deleted")).toBeVisible()
    await expect(page.getByTestId("categories-empty-state")).toBeVisible()

    const remaining = await testDb
      .select()
      .from(categories)
      .where(eq(categories.id, category.id))
    expect(remaining).toHaveLength(0)
  })

  test("does not delete when the confirmation is cancelled", async ({
    page,
  }) => {
    const category = await seedCategory()
    await signIn(page)
    await page.goto("/categories")

    await openRowMenu(page, category.name)
    await page.getByRole("menuitem", { name: "Delete" }).click()

    const dialog = page.getByRole("alertdialog")
    await dialog.getByRole("button", { name: "Cancel" }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByText("Category deleted")).toBeHidden()
    await expect(page.locator("tr", { hasText: category.name })).toBeVisible()

    const [stillThere] = await testDb
      .select()
      .from(categories)
      .where(eq(categories.id, category.id))
    expect(stillThere).toBeDefined()
  })
})

test.describe("Search categories", () => {
  test("filters the list by name", async ({ page }) => {
    await seedCategory({ name: "Outdoor" })
    await seedCategory({ name: "Kitchen" })
    await signIn(page)
    await page.goto("/categories")

    await page.getByTestId("data-table-search-input").fill("Out")

    await expect(page.locator("tr", { hasText: "Outdoor" })).toBeVisible()
    await expect(page.locator("tr", { hasText: "Kitchen" })).toHaveCount(0)
  })
})
