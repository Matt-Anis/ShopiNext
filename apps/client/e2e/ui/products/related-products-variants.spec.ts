import { expect, test } from "@playwright/test"
import { clickUntilHydrated, visible } from "../../utils/interaction"
import { seedCategory } from "../../utils/seed-category"
import { seedRelatedProductWithVariants } from "../../utils/seed-related-product"
import { uniqueSuffix } from "../../utils/unique"

test("related card selections stay independent of the main product and other cards", async ({
  page,
}) => {
  test.slow()
  const category = await seedCategory({
    description: `Independent variants ${uniqueSuffix()}`,
  })
  const [source, first, second] = await Promise.all(
    Array.from({ length: 3 }, () =>
      seedRelatedProductWithVariants({
        categoryId: category.id,
        options: [{ name: "Size", values: ["S", "M"] }],
        variants: [
          { values: { Size: "S" }, price: 1000, stock: 5 },
          { values: { Size: "M" }, price: 1500, stock: 5 },
        ],
      })
    )
  )

  await page.goto(`/products/${source.slug}`)
  const mainMedium = visible(page, "variant-pill-Size-M")
  await clickUntilHydrated(mainMedium, () =>
    expect(mainMedium).toHaveAttribute("aria-pressed", "true", {
      timeout: 1000,
    })
  )
  await expect(visible(page, "variant-price")).toHaveText("$15.00")

  const section = page.getByRole("region", {
    name: "Related products",
    exact: true,
  })
  const firstTrigger = section.getByTestId(
    `product-card-add-to-cart-${first.id}`
  )
  const firstMedium = page.getByTestId(`variant-pill-Size-M-${first.id}`)
  const firstSmall = page.getByTestId(`variant-pill-Size-S-${first.id}`)
  await clickUntilHydrated(firstTrigger, () =>
    expect(firstSmall).toBeVisible({ timeout: 1000 })
  )
  await expect(firstMedium).toHaveAttribute("aria-pressed", "false")
  await clickUntilHydrated(firstSmall, () =>
    expect(firstSmall).toHaveAttribute("aria-pressed", "true", {
      timeout: 1000,
    })
  )
  await clickUntilHydrated(firstTrigger, () =>
    expect(firstSmall).toBeHidden({ timeout: 1000 })
  )

  const secondTrigger = section.getByTestId(
    `product-card-add-to-cart-${second.id}`
  )
  const secondMedium = page.getByTestId(`variant-pill-Size-M-${second.id}`)
  const secondSmall = page.getByTestId(`variant-pill-Size-S-${second.id}`)
  await clickUntilHydrated(secondTrigger, () =>
    expect(secondMedium).toBeVisible({ timeout: 1000 })
  )
  await expect(secondSmall).toHaveAttribute("aria-pressed", "false")
  await expect(secondMedium).toHaveAttribute("aria-pressed", "false")
  await clickUntilHydrated(secondMedium, () =>
    expect(secondMedium).toHaveAttribute("aria-pressed", "true", {
      timeout: 1000,
    })
  )
  await clickUntilHydrated(secondTrigger, () =>
    expect(secondMedium).toBeHidden({ timeout: 1000 })
  )

  await expect(mainMedium).toHaveAttribute("aria-pressed", "true")
  await expect(visible(page, "variant-pill-Size-S")).toHaveAttribute(
    "aria-pressed",
    "false"
  )
  await expect(visible(page, "variant-price")).toHaveText("$15.00")
})
