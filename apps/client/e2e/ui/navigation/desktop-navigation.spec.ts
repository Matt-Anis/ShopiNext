import { test, expect } from "@playwright/test"
import { signIn } from "../../utils/auth"
import { clickUntilHydrated } from "../../utils/interaction"
import {
  expectCenteredInViewport,
  expectHorizontalOrder,
} from "../../utils/layout"
import { seedCategory, linkProductToCategory } from "../../utils/seed-category"
import { seedProduct } from "../../utils/seed-product"
import { seedUser } from "../../utils/seed-user"
import { uniqueNameSuffix, uniqueSuffix } from "../../utils/unique"

test("centers store links and connects the catalog, categories, and home", async ({
  page,
}) => {
  test.slow()

  await page.goto("/")
  const header = page.getByRole("banner")
  const navigation = header.getByRole("navigation", {
    name: "Store",
    exact: true,
  })
  const products = navigation.getByRole("link", {
    name: "All products",
    exact: true,
  })
  const categories = navigation.getByRole("link", {
    name: "Categories",
    exact: true,
  })
  const home = header.getByRole("link", { name: "ShopiNext home", exact: true })

  await expect(home).toHaveAttribute("href", "/")
  await expect(products).toHaveAttribute("href", "/#products")
  await expect(categories).toHaveAttribute("href", "/categories")
  await expect(
    header.getByRole("link", { name: "Account", exact: true })
  ).toBeHidden()
  await expect(header.getByTestId("mobile-nav-trigger")).toBeHidden()
  await expectCenteredInViewport(navigation)
  await expectHorizontalOrder([
    header.getByRole("button", { name: "Open cart", exact: true }),
    header.getByRole("link", { name: "Sign in", exact: true }),
  ])

  await clickUntilHydrated(categories, () =>
    expect(page).toHaveURL("/categories")
  )
  await expect(navigation.locator("a[aria-current]")).toHaveAttribute(
    "href",
    "/categories"
  )
  await clickUntilHydrated(products, () => expect(page).toHaveURL("/#products"))
  await expect(page.locator("#products")).toBeInViewport()
  await expect(navigation.locator("a[aria-current]")).toHaveAttribute(
    "href",
    "/#products"
  )
  await clickUntilHydrated(home, () => expect(page).toHaveURL("/"))
})

test("supports keyboard navigation and restores focus after closing the cart", async ({
  page,
}) => {
  test.slow()

  await page.goto("/")
  const header = page.getByRole("banner")
  const navigation = header.getByRole("navigation", {
    name: "Store",
    exact: true,
  })
  const products = navigation.getByRole("link", {
    name: "All products",
    exact: true,
  })
  const categories = navigation.getByRole("link", {
    name: "Categories",
    exact: true,
  })
  await header
    .getByRole("link", { name: "ShopiNext home", exact: true })
    .focus()
  await page.keyboard.press("Tab")
  await expect(products).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(categories).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL("/categories")

  const cart = header.getByRole("button", { name: "Open cart", exact: true })
  const drawer = page.getByRole("dialog", { name: "Cart", exact: true })
  await clickUntilHydrated(cart, () => expect(drawer).toBeVisible())
  await page.keyboard.press("Escape")
  await expect(drawer).toBeHidden()
  await expect(cart).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(drawer).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(drawer).toBeHidden()
  await expect(cart).toBeFocused()
})

test("keeps the relevant store section active on product and category details", async ({
  page,
}) => {
  test.slow()

  const product = await seedProduct({
    name: `Navigation product ${uniqueSuffix()}`,
  })
  const category = await seedCategory({
    name: "Navigation category",
    description: `Navigation category description ${uniqueSuffix()}`,
  })
  await linkProductToCategory(product.id, category.id)

  const navigation = page
    .getByRole("banner")
    .getByRole("navigation", { name: "Store", exact: true })
  await page.goto(`/products/${product.slug}`)
  await expect(
    page.getByRole("heading", { name: product.name, exact: true })
  ).toBeVisible()
  await expect(navigation.locator("a[aria-current]")).toHaveAttribute(
    "href",
    "/#products"
  )

  await page.goto(`/categories/${category.slug}`)
  await expect(
    page.getByRole("heading", { name: category.name, exact: true })
  ).toBeVisible()
  await expect(navigation.locator("a[aria-current]")).toHaveAttribute(
    "href",
    "/categories"
  )
})

test("opens Account directly and keeps personal destinations inside the account area", async ({
  page,
  request,
}) => {
  test.slow()

  const customer = await seedUser(request, {
    name: `DN ${uniqueNameSuffix()}`,
    email: "desktop-navigation@example.com",
  })
  await signIn(page, customer)
  const header = page.getByRole("banner")
  const account = header.getByRole("link", { name: "Account", exact: true })
  await expect(account).toHaveAttribute("href", "/profile")
  await expect(account).not.toHaveAttribute("aria-haspopup")
  await expectCenteredInViewport(
    header.getByRole("navigation", { name: "Store", exact: true })
  )
  await expectHorizontalOrder([
    header.getByRole("button", { name: "Open cart", exact: true }),
    account,
  ])
  for (const name of ["Profile", "Orders", "Settings"]) {
    await expect(header.getByRole("link", { name, exact: true })).toBeHidden()
  }

  await clickUntilHydrated(account, () => expect(page).toHaveURL("/profile"))
  await expect(
    page.getByRole("heading", { name: "Your profile", exact: true })
  ).toBeVisible()
  const navigation = page
    .getByRole("main")
    .getByRole("navigation", { name: "Account", exact: true })
  for (const { name, href } of [
    { name: "Profile", href: "/profile" },
    { name: "Orders", href: "/orders" },
    { name: "Settings", href: "/profile/settings" },
  ]) {
    await expect(
      navigation.getByRole("link", { name, exact: true })
    ).toHaveAttribute("href", href)
  }
  await expect(account).toHaveAttribute("aria-current", "location")
})
