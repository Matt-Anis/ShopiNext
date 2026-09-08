import { test, expect } from "@playwright/test"
import { productCategories, images } from "@repo/db/public/schema"
import { testDb } from "../../utils/db"
import {
  resetAuthTables,
  resetCategoryTables,
  resetProductTables,
} from "../../utils/db-reset"
import { seedAdmin } from "../../utils/seed-user"
import {
  seedProduct,
  seedProductOption,
  seedProductVariant,
} from "../../utils/seed-product"
import { seedCategory } from "../../utils/seed-category"
import { signIn } from "../../utils/auth"

test.beforeEach(async () => {
  await resetAuthTables()
  await resetCategoryTables()
  await resetProductTables()
  await seedAdmin()
})

test.describe("Product detail page", () => {
  test("shows the product's name, slug and description", async ({ page }) => {
    const product = await seedProduct({
      name: "Classic Tee",
      slug: "classic-tee",
      description: "A soft cotton tee",
    })
    await signIn(page)
    await page.goto(`/products/${product.id}`)

    await expect(
      page.getByRole("heading", { name: "Classic Tee" })
    ).toBeVisible()
    await expect(page.getByText("classic-tee")).toBeVisible()
    await expect(page.getByText("A soft cotton tee")).toBeVisible()
  })

  test("shows a fallback message when there is no description", async ({
    page,
  }) => {
    const product = await seedProduct({ description: "" })
    await signIn(page)
    await page.goto(`/products/${product.id}`)

    await expect(page.getByText("No description provided.")).toBeVisible()
  })

  test("shows images with a primary badge and the image count", async ({
    page,
  }) => {
    const product = await seedProduct()
    await testDb.insert(images).values([
      {
        productId: product.id,
        url: "https://example.com/a.png",
        isPrimary: true,
      },
      {
        productId: product.id,
        url: "https://example.com/b.png",
        isPrimary: false,
      },
    ])
    await signIn(page)
    await page.goto(`/products/${product.id}`)

    await expect(page.getByText("2 · 1 primary")).toBeVisible()
    await expect(page.getByText("Primary", { exact: true })).toBeVisible()
  })

  test("shows an empty message when there are no images", async ({
    page,
  }) => {
    const product = await seedProduct()
    await signIn(page)
    await page.goto(`/products/${product.id}`)

    await expect(page.getByText("No images uploaded yet.")).toBeVisible()
  })

  test("shows assigned categories as badges", async ({ page }) => {
    const product = await seedProduct()
    const category = await seedCategory({ name: "Apparel" })
    await testDb
      .insert(productCategories)
      .values({ productId: product.id, categoryId: category.id })
    await signIn(page)
    await page.goto(`/products/${product.id}`)

    await expect(page.getByText("Apparel")).toBeVisible()
  })

  test("shows an empty message when no categories are assigned", async ({
    page,
  }) => {
    const product = await seedProduct()
    await signIn(page)
    await page.goto(`/products/${product.id}`)

    await expect(
      page.getByText("Not assigned to any categories.")
    ).toBeVisible()
  })

  test("shows an options summary next to the variants heading", async ({
    page,
  }) => {
    const product = await seedProduct()
    const option = await seedProductOption(product.id, "Material", [
      "Leather",
      "Denim",
    ])
    await seedProductVariant(product.id, {}, [option.values[0]!.id])
    await signIn(page)
    await page.goto(`/products/${product.id}`)

    await expect(page.getByText("Material:")).toBeVisible()
    await expect(page.getByText("Leather, Denim")).toBeVisible()
  })

  test("shows the variants table with option badges, sku, price, stock and max per order", async ({
    page,
  }) => {
    const product = await seedProduct()
    const option = await seedProductOption(product.id, "Size", ["M"])
    await seedProductVariant(
      product.id,
      { sku: "TEE-M", price: 2500, stock: 12, maxPerOrder: 3 },
      [option.values[0]!.id]
    )
    await signIn(page)
    await page.goto(`/products/${product.id}`)

    const row = page.locator("tr", { hasText: "TEE-M" })
    await expect(row).toContainText("M")
    await expect(row).toContainText("$25.00")
    await expect(row).toContainText("12")
    await expect(row).toContainText("3")
  })

  test("shows a message when there are no variants", async ({ page }) => {
    const product = await seedProduct()
    await signIn(page)
    await page.goto(`/products/${product.id}`)

    await expect(
      page.getByText("This product has no variants yet.")
    ).toBeVisible()
  })

  test("color-codes stock: red at 0, amber below 5, default at 5 or more", async ({
    page,
  }) => {
    const product = await seedProduct()
    const option = await seedProductOption(product.id, "Size", ["S", "M", "L"])
    await seedProductVariant(
      product.id,
      { sku: "OUT-OF-STOCK", stock: 0 },
      [option.values[0]!.id]
    )
    await seedProductVariant(
      product.id,
      { sku: "LOW-STOCK", stock: 3 },
      [option.values[1]!.id]
    )
    await seedProductVariant(
      product.id,
      { sku: "IN-STOCK", stock: 20 },
      [option.values[2]!.id]
    )
    await signIn(page)
    await page.goto(`/products/${product.id}`)

    const outOfStockCell = page
      .locator("tr", { hasText: "OUT-OF-STOCK" })
      .locator("td")
      .nth(3)
    const lowStockCell = page
      .locator("tr", { hasText: "LOW-STOCK" })
      .locator("td")
      .nth(3)
    const inStockCell = page
      .locator("tr", { hasText: "IN-STOCK" })
      .locator("td")
      .nth(3)

    await expect(outOfStockCell).toHaveClass(/text-destructive/)
    await expect(lowStockCell).toHaveClass(/text-amber-600/)
    await expect(inStockCell).not.toHaveClass(/text-destructive|text-amber-600/)
  })

  test("shows the price range, variant count and total stock", async ({
    page,
  }) => {
    const product = await seedProduct()
    const option = await seedProductOption(product.id, "Size", ["S", "M"])
    await seedProductVariant(
      product.id,
      { sku: "A", price: 1000, stock: 5 },
      [option.values[0]!.id]
    )
    await seedProductVariant(
      product.id,
      { sku: "B", price: 2500, stock: 10 },
      [option.values[1]!.id]
    )
    await signIn(page)
    await page.goto(`/products/${product.id}`)

    await expect(page.getByTestId("at-a-glance-price-range")).toHaveText(
      "$10.00 – $25.00"
    )
    await expect(page.getByTestId("at-a-glance-variant-count")).toHaveText("2")
    await expect(page.getByTestId("at-a-glance-total-stock")).toHaveText("15")
  })

  test("shows a single price when all variants share the same price", async ({
    page,
  }) => {
    const product = await seedProduct()
    const option = await seedProductOption(product.id, "Size", ["S", "M"])
    await seedProductVariant(product.id, { sku: "A", price: 1500 }, [
      option.values[0]!.id,
    ])
    await seedProductVariant(product.id, { sku: "B", price: 1500 }, [
      option.values[1]!.id,
    ])
    await signIn(page)
    await page.goto(`/products/${product.id}`)

    await expect(page.getByTestId("at-a-glance-price-range")).toHaveText(
      "$15.00"
    )
  })

  test("shows a dash for price range when there are no variants", async ({
    page,
  }) => {
    const product = await seedProduct()
    await signIn(page)
    await page.goto(`/products/${product.id}`)

    await expect(page.getByTestId("at-a-glance-price-range")).toHaveText("—")
    await expect(page.getByTestId("at-a-glance-variant-count")).toHaveText("0")
    await expect(page.getByTestId("at-a-glance-total-stock")).toHaveText("0")
  })

  test("shows created and updated timestamps in history", async ({
    page,
  }) => {
    const product = await seedProduct()
    await signIn(page)
    await page.goto(`/products/${product.id}`)

    await expect(page.getByText("Created")).toBeVisible()
    await expect(page.getByText("Updated")).toBeVisible()
  })

  test("returns 404 for a nonexistent product id", async ({ page }) => {
    await signIn(page)
    const response = await page.goto(
      "/products/00000000-0000-0000-0000-000000000000"
    )

    expect(response?.status()).toBe(404)
  })
})
