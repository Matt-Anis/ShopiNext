import { test, expect } from "@playwright/test"
import { signIn } from "../../utils/auth"
import { clickUntilHydrated } from "../../utils/interaction"
import { expectHorizontalOrder } from "../../utils/layout"
import { seedUser } from "../../utils/seed-user"
import { uniqueNameSuffix } from "../../utils/unique"

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
})

test("orders header controls and dismisses the right-hand drawer with focus return", async ({
  page,
}) => {
  test.slow()

  await page.goto("/")
  const header = page.getByRole("banner")
  const trigger = header.getByRole("button", {
    name: "Open navigation",
    exact: true,
  })
  const drawer = page.getByRole("dialog", { name: "Menu", exact: true })
  await expectHorizontalOrder([
    header.getByRole("button", { name: "Open cart", exact: true }),
    header.getByRole("link", { name: "Sign in", exact: true }),
    trigger,
  ])
  await expect
    .poll(() =>
      trigger.evaluate(
        (element) => window.innerWidth - element.getBoundingClientRect().right
      )
    )
    .toBeLessThanOrEqual(32)
  await expect(
    header.getByRole("navigation", { name: "Store", exact: true })
  ).toBeHidden()
  await clickUntilHydrated(trigger, () => expect(drawer).toBeVisible())
  await expect
    .poll(() =>
      drawer.evaluate((element) =>
        Math.abs(element.getBoundingClientRect().right - window.innerWidth)
      )
    )
    .toBeLessThanOrEqual(2)
  await expect
    .poll(() =>
      drawer.evaluate((element) => element.getBoundingClientRect().left)
    )
    .toBeGreaterThan(0)
  await expect(
    drawer.getByRole("link", { name: "All products", exact: true })
  ).toBeVisible()
  await expect(
    drawer.getByRole("link", { name: "Categories", exact: true })
  ).toBeVisible()

  await page.keyboard.press("Escape")
  await expect(drawer).toBeHidden()
  await expect(trigger).toBeFocused()
  await clickUntilHydrated(trigger, () => expect(drawer).toBeVisible())
  await clickUntilHydrated(
    drawer.getByRole("button", { name: "Close", exact: true }),
    () => expect(drawer).toBeHidden()
  )
  await expect(trigger).toBeFocused()
})

test("navigates through store links and closes after selecting the current destination", async ({
  page,
}) => {
  test.slow()

  await page.goto("/categories")
  const trigger = page
    .getByRole("banner")
    .getByRole("button", { name: "Open navigation", exact: true })
  const drawer = page.getByRole("dialog", { name: "Menu", exact: true })
  const categories = drawer.getByRole("link", {
    name: "Categories",
    exact: true,
  })
  const products = drawer.getByRole("link", {
    name: "All products",
    exact: true,
  })
  await clickUntilHydrated(trigger, () => expect(drawer).toBeVisible())
  await expect(categories).toHaveAttribute("aria-current", "location")
  await clickUntilHydrated(categories, () => expect(drawer).toBeHidden())
  await expect(page).toHaveURL("/categories")

  await clickUntilHydrated(trigger, () => expect(drawer).toBeVisible())
  await clickUntilHydrated(products, () => expect(page).toHaveURL("/#products"))
  await expect(drawer).toBeHidden()
  await expect(page.locator("#products")).toBeInViewport()

  await clickUntilHydrated(trigger, () => expect(drawer).toBeVisible())
  await expect(products).toHaveAttribute("aria-current", "location")
  await clickUntilHydrated(categories, () =>
    expect(page).toHaveURL("/categories")
  )
  await expect(drawer).toBeHidden()
})

test("closes the mobile drawer when switching to desktop without reopening on return", async ({
  page,
}) => {
  await page.goto("/")
  const header = page.getByRole("banner")
  const trigger = header.getByTestId("mobile-nav-trigger")
  const drawer = page.getByRole("dialog", { name: "Menu", exact: true })
  await clickUntilHydrated(trigger, () => expect(drawer).toBeVisible())

  await page.setViewportSize({ width: 1280, height: 800 })
  await expect(drawer).toBeHidden()
  await expect(trigger).toBeHidden()
  await expect(
    header.getByRole("navigation", { name: "Store", exact: true })
  ).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(trigger).toBeVisible()
  await expect(drawer).toBeHidden()
  await clickUntilHydrated(trigger, () => expect(drawer).toBeVisible())
})

for (const width of [320, 390]) {
  test(`keeps account links and logout in one row at ${width}px and signs out`, async ({
    page,
    request,
  }) => {
    test.slow()

    await page.setViewportSize({ width, height: 844 })
    const customer = await seedUser(request, {
      name: `MN ${uniqueNameSuffix()}`,
      email: "mobile-navigation@example.com",
    })
    await signIn(page, customer)
    const header = page.getByRole("banner")
    const account = header.getByRole("link", { name: "Account", exact: true })
    const cart = header.getByRole("button", { name: "Open cart", exact: true })
    const trigger = header.getByRole("button", {
      name: "Open navigation",
      exact: true,
    })
    await expectHorizontalOrder([cart, account, trigger])
    await clickUntilHydrated(account, () => expect(page).toHaveURL("/profile"))

    const main = page.getByRole("main")
    const navigation = main.getByRole("navigation", {
      name: "Account",
      exact: true,
    })
    const logout = main.getByRole("button", { name: "Log out", exact: true })
    await expectHorizontalOrder([
      navigation.getByRole("link", { name: "Profile", exact: true }),
      navigation.getByRole("link", { name: "Orders", exact: true }),
      navigation.getByRole("link", { name: "Settings", exact: true }),
      logout,
    ])
    await expect
      .poll(() =>
        logout.evaluate(
          (element) => window.innerWidth - element.getBoundingClientRect().right
        )
      )
      .toBeLessThanOrEqual(32)
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth
        )
      )
      .toBeLessThanOrEqual(1)

    for (const { name, path, heading } of [
      {
        name: "Settings",
        path: "/profile/settings",
        heading: "Account settings",
      },
      { name: "Orders", path: "/orders", heading: "Your orders" },
      { name: "Profile", path: "/profile", heading: "Your profile" },
    ]) {
      await clickUntilHydrated(
        navigation.getByRole("link", { name, exact: true }),
        () => expect(page).toHaveURL(path)
      )
      await expect(
        main.getByRole("heading", { name: heading, exact: true })
      ).toBeVisible()
      await expect(navigation.locator("a[aria-current]")).toHaveAttribute(
        "href",
        path
      )
    }

    const confirmation = page.getByRole("alertdialog", { name: "Log out?" })
    await clickUntilHydrated(logout, () => expect(confirmation).toBeVisible())
    await clickUntilHydrated(
      confirmation.getByTestId("logout-confirm-button"),
      () => expect(page).toHaveURL("/")
    )
    await expect(account).toBeHidden()
    await expectHorizontalOrder([
      cart,
      header.getByRole("link", { name: "Sign in", exact: true }),
      trigger,
    ])
  })
}
