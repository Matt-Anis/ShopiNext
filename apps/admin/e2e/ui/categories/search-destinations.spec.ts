import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"
import { seedAdmin } from "../../utils/seed-user"
import { seedCategory } from "../../utils/seed-category"
import { signIn } from "../../utils/auth"
import { clickUntilHydrated } from "../../utils/interaction"
import { uniqueSuffix } from "../../utils/unique"

test("category search URLs open the selected record and preserve other params on close", async ({
  page,
}) => {
  test.slow()
  const suffix = uniqueSuffix()
  const category = await seedCategory({
    name: `Linked category ${suffix}`,
    description: `Linked description ${suffix}`,
  })
  const owner = await seedAdmin({
    name: `Category owner ${suffix}`,
    role: "owner",
  })
  await signIn(page, owner)
  await page.goto(`/categories?categoryId=${category.id}&source=search`)
  const form = page.getByTestId("category-form")
  await expect(form).toBeVisible()
  await expect(form.getByTestId("category-name-input")).toHaveValue(
    category.name
  )
  await expect(form.getByTestId("category-description-input")).toHaveValue(
    category.description ?? ""
  )
  await expect(form.getByTestId("category-name-input")).not.toHaveAttribute(
    "readonly"
  )
  await clickUntilHydrated(
    form.getByRole("button", { name: "Cancel", exact: true }),
    () => expect(form).toBeHidden()
  )
  await expect(page).toHaveURL("/categories?source=search")
})

test("staff can read a linked category without receiving editing controls", async ({
  page,
}) => {
  test.slow()
  const suffix = uniqueSuffix()
  const category = await seedCategory({
    name: `Read-only category ${suffix}`,
    description: `Read-only description ${suffix}`,
  })
  const staff = await seedAdmin({
    name: `Category reader ${suffix}`,
    role: "staff",
  })
  await signIn(page, staff)
  await page.goto(`/categories?categoryId=${category.id}`)
  const form = page.getByTestId("category-form")
  await expect(form).toBeVisible()
  await expect(
    page.getByText("Category details", { exact: true })
  ).toBeVisible()
  await expect(form.getByTestId("category-name-input")).toHaveAttribute(
    "readonly",
    ""
  )
  await expect(form.getByTestId("category-description-input")).toHaveAttribute(
    "readonly",
    ""
  )
  await expect(form.getByTestId("category-submit-button")).toBeHidden()
  await clickUntilHydrated(
    form.getByRole("button", { name: "Close", exact: true }),
    () => expect(form).toBeHidden()
  )
  await expect(page).toHaveURL("/categories")
})

test("missing category links show an unavailable notice without opening a form", async ({
  page,
}) => {
  test.slow()
  const staff = await seedAdmin({
    name: `Missing category reader ${uniqueSuffix()}`,
    role: "staff",
  })
  await signIn(page, staff)
  await page.goto(`/categories?categoryId=${randomUUID()}&source=search`)
  const notice = page
    .getByRole("alert")
    .filter({ hasText: "Category unavailable" })
  await expect(notice).toBeVisible()
  await expect(page.getByTestId("category-form")).toBeHidden()
  await clickUntilHydrated(
    notice.getByRole("button", { name: "Back to categories", exact: true }),
    () => expect(notice).toBeHidden()
  )
  await expect(page).toHaveURL("/categories?source=search")
})
