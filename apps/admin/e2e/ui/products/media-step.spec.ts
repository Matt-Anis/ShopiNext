import { test, expect } from "@playwright/test"
import { eq } from "drizzle-orm"
import { products, images } from "@repo/db/public/schema"
import { testDb } from "../../utils/db"
import { seedAdmin } from "../../utils/seed-user"
import {
  seedProduct,
  seedProductVariant,
  seedProductImage,
} from "../../utils/seed-product"
import { signIn } from "../../utils/auth"
import { uniqueSuffix } from "../../utils/unique"

let admin: Awaited<ReturnType<typeof seedAdmin>>

test.beforeEach(async () => {
  admin = await seedAdmin()
})

const DUMMY_PNG_BUFFER = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
)

test.describe("Product Media Step", () => {
  test("displays step 4 as active in wizard navigation", async ({ page }) => {
    const product = await seedProduct()
    await seedProductVariant(product.id)
    await signIn(page, admin)

    await page.goto(`/products/${product.id}/edit/media`)

    await expect(page.getByRole("heading", { name: product.name })).toBeVisible()
    await expect(page.locator("span.border-primary", { hasText: "4" })).toBeVisible()
    await expect(page.getByText("Upload and organize images for this product.")).toBeVisible()
  })

  test("uploads an image and displays it in the gallery", async ({ page }) => {
    const product = await seedProduct()
    await seedProductVariant(product.id)
    await signIn(page, admin)

    // Intercept S3 presigned PUT upload so test does not depend on external S3 container
    await page.route("**/store/products/**", async (route) => {
      if (route.request().method() === "PUT") {
        await route.fulfill({ status: 200, contentType: "text/plain" })
      } else {
        await route.continue()
      }
    })

    await page.goto(`/products/${product.id}/edit/media`)

    const uploadFilename = `test-${uniqueSuffix()}.png`
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: uploadFilename,
      mimeType: "image/png",
      buffer: DUMMY_PNG_BUFFER,
    })

    await expect(page.getByText(`Uploaded "${uploadFilename}"`)).toBeVisible({
      timeout: 10_000,
    })

    // Gallery should display the newly created image card
    await expect(page.getByText("Cover", { exact: true })).toBeVisible()

    // Database record should exist
    const dbImages = await testDb
      .select()
      .from(images)
      .where(eq(images.productId, product.id))
    expect(dbImages).toHaveLength(1)
  })

  test("edits alt text of an image", async ({ page }) => {
    const initialAlt = `Original alt ${uniqueSuffix()}`
    const updatedAlt = `Updated alt ${uniqueSuffix()}`

    const product = await seedProduct()
    await seedProductVariant(product.id)
    await seedProductImage(product.id, { altText: initialAlt })

    await signIn(page, admin)
    await page.goto(`/products/${product.id}/edit/media`)

    await expect(page.getByText(initialAlt, { exact: false })).toBeVisible()

    // Click edit alt text button on image card
    await page.getByRole("button", { name: "Edit alt text" }).click()

    const dialog = page.getByRole("dialog")
    await expect(dialog.getByText("Edit alt text")).toBeVisible()

    const input = dialog.getByPlaceholder("Describe this image...")
    await input.fill(updatedAlt)
    await dialog.getByRole("button", { name: "Save changes" }).click()

    await expect(page.getByText("Alt text updated")).toBeVisible()
    await expect(page.getByText(updatedAlt, { exact: false })).toBeVisible()

    // Verify DB update
    const [dbImage] = await testDb
      .select()
      .from(images)
      .where(eq(images.productId, product.id))
    expect(dbImage?.altText).toBe(updatedAlt)
  })

  test("deletes an image with confirmation", async ({ page }) => {
    const altToDelete = `To delete ${uniqueSuffix()}`

    const product = await seedProduct()
    await seedProductVariant(product.id)
    await seedProductImage(product.id, { altText: altToDelete })

    await signIn(page, admin)
    await page.goto(`/products/${product.id}/edit/media`)

    await expect(page.getByText(altToDelete, { exact: false })).toBeVisible()

    // Click delete on image card
    await page.getByRole("button", { name: "Delete image" }).click()

    const confirmDialog = page.getByRole("alertdialog")
    await expect(confirmDialog).toContainText("Delete image")
    await confirmDialog.getByRole("button", { name: "Delete" }).click()

    await expect(page.getByText("Image deleted")).toBeVisible()
    await expect(page.getByText(altToDelete, { exact: false })).not.toBeVisible()

    // Verify removed from DB
    const dbImages = await testDb
      .select()
      .from(images)
      .where(eq(images.productId, product.id))
    expect(dbImages).toHaveLength(0)
  })

  test("publishes product from media step", async ({ page }) => {
    const product = await seedProduct({ status: "draft" })
    await seedProductVariant(product.id)
    await seedProductImage(product.id)

    await signIn(page, admin)
    await page.goto(`/products/${product.id}/edit/media`)

    const publishButton = page.getByRole("button", { name: "Publish product" })
    await expect(publishButton).toBeVisible()
    await publishButton.click()

    await expect(page.getByText("Product published")).toBeVisible()
    await expect(page).toHaveURL("/products")

    const [updatedProduct] = await testDb
      .select()
      .from(products)
      .where(eq(products.id, product.id))
    expect(updatedProduct?.status).toBe("active")
  })

  test("saves product as draft from media step", async ({ page }) => {
    const product = await seedProduct({ status: "active" })
    await seedProductVariant(product.id)
    await seedProductImage(product.id)

    await signIn(page, admin)
    await page.goto(`/products/${product.id}/edit/media`)

    const saveDraftButton = page.getByRole("button", { name: "Save as draft" })
    await expect(saveDraftButton).toBeVisible()
    await saveDraftButton.click()

    await expect(page.getByText("Draft saved")).toBeVisible()
    await expect(page).toHaveURL("/products")

    const [updatedProduct] = await testDb
      .select()
      .from(products)
      .where(eq(products.id, product.id))
    expect(updatedProduct?.status).toBe("draft")
  })
})
