import { test, expect } from "@playwright/test"
import { eq } from "drizzle-orm"
import { products } from "@repo/db/public/schema"
import { testDb } from "../../utils/db"
import { resetAuthTables, resetProductTables } from "../../utils/db-reset"
import { seedAdmin } from "../../utils/seed-user"
import { seedProduct, DEFAULT_TEST_PRODUCT } from "../../utils/seed-product"
import { signIn } from "../../utils/auth"

test.beforeEach(async () => {
  await resetAuthTables()
  await resetProductTables()
  await seedAdmin()
})

test.describe("Create product (step 1)", () => {
  test("creates a draft product and redirects to step 2", async ({
    page,
  }) => {
    await signIn(page)
    await page.goto("/products/new")

    await page.getByTestId("create-product-name-input").fill("Classic Tee")
    await page
      .getByTestId("create-product-description-input")
      .fill("A soft cotton tee")
    await page.getByTestId("create-product-submit-button").click()

    await expect(page.getByText("Product created")).toBeVisible()
    await page.waitForURL(/\/products\/.+\/edit\/step-2$/)

    const [product] = await testDb
      .select()
      .from(products)
      .where(eq(products.slug, "classic-tee"))
    expect(product).toBeDefined()
    expect(product!.name).toBe("Classic Tee")
    expect(product!.description).toBe("A soft cotton tee")
    expect(product!.status).toBe("draft")
    expect(product!.isActive).toBe(true)
  })

  test("derives the slug from the name until the slug is edited by hand", async ({
    page,
  }) => {
    await signIn(page)
    await page.goto("/products/new")

    const nameInput = page.getByTestId("create-product-name-input")
    const slugInput = page.getByTestId("create-product-slug-input")

    await nameInput.fill("Classic Tee")
    await expect(slugInput).toHaveValue("classic-tee")

    await slugInput.fill("custom-slug")
    await nameInput.fill("Something Else Entirely")
    await expect(slugInput).toHaveValue("custom-slug")
  })

  test("shows a validation error for a whitespace-only name", async ({
    page,
  }) => {
    await signIn(page)
    await page.goto("/products/new")

    await page.getByTestId("create-product-name-input").fill("   ")
    await page.getByTestId("create-product-slug-input").fill("some-slug")
    await page.getByTestId("create-product-submit-button").click()

    await expect(page.getByText("Failed to create product")).toBeVisible()
    await expect(page.getByText("Name is required")).toBeVisible()

    const rows = await testDb.select().from(products)
    expect(rows).toHaveLength(0)
  })

  test("shows a validation error for a whitespace-only slug", async ({
    page,
  }) => {
    await signIn(page)
    await page.goto("/products/new")

    await page.getByTestId("create-product-name-input").fill("Classic Tee")
    await page.getByTestId("create-product-slug-input").fill("   ")
    await page.getByTestId("create-product-submit-button").click()

    await expect(page.getByText("Failed to create product")).toBeVisible()
    await expect(page.getByText("Slug is required")).toBeVisible()

    const rows = await testDb.select().from(products)
    expect(rows).toHaveLength(0)
  })

  test("shows a friendly error when the slug already exists on another active product", async ({
    page,
  }) => {
    await seedProduct({ slug: "classic-tee" })
    await signIn(page)
    await page.goto("/products/new")

    await page.getByTestId("create-product-name-input").fill("Classic Tee")
    await page.getByTestId("create-product-submit-button").click()

    await expect(page.getByText("Failed to create product")).toBeVisible()
    await expect(
      page.getByText("A product with this slug already exists")
    ).toBeVisible()

    const rows = await testDb
      .select()
      .from(products)
      .where(eq(products.slug, "classic-tee"))
    expect(rows).toHaveLength(1)
  })

  test("allows reusing the slug of an inactive product", async ({ page }) => {
    await seedProduct({ slug: "classic-tee", isActive: false })
    await signIn(page)
    await page.goto("/products/new")

    await page.getByTestId("create-product-name-input").fill("Classic Tee")
    await page.getByTestId("create-product-submit-button").click()

    await expect(page.getByText("Product created")).toBeVisible()

    const rows = await testDb
      .select()
      .from(products)
      .where(eq(products.slug, "classic-tee"))
    expect(rows).toHaveLength(2)
  })

  test("stores a blank description as null", async ({ page }) => {
    await signIn(page)
    await page.goto("/products/new")

    await page.getByTestId("create-product-name-input").fill("Classic Tee")
    await page.getByTestId("create-product-submit-button").click()

    await expect(page.getByText("Product created")).toBeVisible()

    const [product] = await testDb
      .select()
      .from(products)
      .where(eq(products.slug, "classic-tee"))
    expect(product!.description).toBeNull()
  })

  test("does not create a product when cancelled", async ({ page }) => {
    await signIn(page)
    await page.goto("/products/new")

    await page.getByTestId("create-product-name-input").fill("Never Saved")
    await page.getByRole("button", { name: "Cancel" }).click()

    const rows = await testDb
      .select()
      .from(products)
      .where(eq(products.name, "Never Saved"))
    expect(rows).toHaveLength(0)
  })
})

test.describe("Edit product details (step 1)", () => {
  test("loads the product's existing details", async ({ page }) => {
    const product = await seedProduct({
      name: "Classic Tee",
      slug: "classic-tee",
      description: "A soft cotton tee",
    })
    await signIn(page)
    await page.goto(`/products/${product.id}/edit/step-1`)

    await expect(page.getByTestId("edit-product-name-input")).toHaveValue(
      "Classic Tee"
    )
    await expect(page.getByTestId("edit-product-slug-input")).toHaveValue(
      "classic-tee"
    )
    await expect(
      page.getByTestId("edit-product-description-input")
    ).toHaveValue("A soft cotton tee")
  })

  test("updates the name without conflicting with its own unchanged slug", async ({
    page,
  }) => {
    const product = await seedProduct()
    await signIn(page)
    await page.goto(`/products/${product.id}/edit/step-1`)

    await page.getByTestId("edit-product-name-input").fill("Renamed Product")
    await page.getByTestId("edit-product-submit-button").click()

    await expect(page.getByText("Product updated")).toBeVisible()

    const [updated] = await testDb
      .select()
      .from(products)
      .where(eq(products.id, product.id))
    expect(updated!.name).toBe("Renamed Product")
    expect(updated!.slug).toBe(DEFAULT_TEST_PRODUCT.slug)
  })

  test("shows a friendly error when renaming the slug to another active product's slug", async ({
    page,
  }) => {
    await seedProduct({ name: "Other Product", slug: "other-product" })
    const product = await seedProduct({
      name: "Classic Tee",
      slug: "classic-tee",
    })
    await signIn(page)
    await page.goto(`/products/${product.id}/edit/step-1`)

    await page.getByTestId("edit-product-slug-input").fill("other-product")
    await page.getByTestId("edit-product-submit-button").click()

    await expect(page.getByText("Failed to update product")).toBeVisible()
    await expect(
      page.getByText("A product with this slug already exists")
    ).toBeVisible()

    const [unchanged] = await testDb
      .select()
      .from(products)
      .where(eq(products.id, product.id))
    expect(unchanged!.slug).toBe("classic-tee")
  })

  test("shows a validation error when the name is cleared", async ({
    page,
  }) => {
    const product = await seedProduct()
    await signIn(page)
    await page.goto(`/products/${product.id}/edit/step-1`)

    await page.getByTestId("edit-product-name-input").fill("   ")
    await page.getByTestId("edit-product-submit-button").click()

    await expect(page.getByText("Failed to update product")).toBeVisible()
    await expect(page.getByText("Name is required")).toBeVisible()

    const [unchanged] = await testDb
      .select()
      .from(products)
      .where(eq(products.id, product.id))
    expect(unchanged!.name).toBe(DEFAULT_TEST_PRODUCT.name)
  })

  test("redirects to step 2 after saving", async ({ page }) => {
    const product = await seedProduct()
    await signIn(page)
    await page.goto(`/products/${product.id}/edit/step-1`)

    await page.getByTestId("edit-product-submit-button").click()

    await page.waitForURL(`/products/${product.id}/edit/step-2`)
  })

  test("does not save changes when cancelled", async ({ page }) => {
    const product = await seedProduct()
    await signIn(page)
    await page.goto(`/products/${product.id}/edit/step-1`)

    await page.getByTestId("edit-product-name-input").fill("Never Saved")
    await page.getByRole("button", { name: "Cancel" }).click()

    await page.waitForURL("/products")

    const [unchanged] = await testDb
      .select()
      .from(products)
      .where(eq(products.id, product.id))
    expect(unchanged!.name).toBe(DEFAULT_TEST_PRODUCT.name)
  })

  test("returns 404 for a nonexistent product id", async ({ page }) => {
    await signIn(page)
    const response = await page.goto(
      "/products/00000000-0000-0000-0000-000000000000/edit/step-1"
    )

    expect(response?.status()).toBe(404)
  })
})
