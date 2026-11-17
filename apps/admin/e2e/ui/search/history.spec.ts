import { expect, test } from "@playwright/test"
import { ADMIN_RECENT_SEARCH_PREFIX } from "@repo/search/browser"
import { seedAdmin } from "../../utils/seed-user"
import { signIn } from "../../utils/auth"
import { clickUntilHydrated } from "../../utils/interaction"
import { uniqueSuffix } from "../../utils/unique"

test("admin selection saves only its account's keyword and successful logout clears admin histories", async ({
  page,
}) => {
  test.slow()
  const suffix = uniqueSuffix()
  const keyword = `shirts ${suffix}`
  const title = `History preview ${suffix}`
  const staff = await seedAdmin({
    name: `History staff ${suffix}`,
    role: "staff",
  })
  const ownKey = `${ADMIN_RECENT_SEARCH_PREFIX}${encodeURIComponent(staff.id)}`
  await page.route("**/api/search?*", async (route) => {
    await route.fulfill({
      json: {
        query: keyword,
        groups: [
          {
            type: "product",
            results: [
              {
                type: "product",
                id: `preview-${suffix}`,
                title,
                href: "/products",
                slug: "history-preview",
                thumbnailUrl: null,
                categoryNames: [],
                status: "active",
                isActive: true,
              },
            ],
          },
        ],
      },
    })
  })
  await signIn(page, staff)
  await page.evaluate(
    (prefix) =>
      sessionStorage.setItem(
        `${prefix}other-account`,
        '["other account query"]'
      ),
    ADMIN_RECENT_SEARCH_PREFIX
  )
  const input = page.getByRole("combobox", {
    name: "Search admin",
    exact: true,
  })
  await clickUntilHydrated(input, () =>
    expect(input).toHaveAttribute("aria-expanded", "true")
  )
  await expect(
    page.getByRole("button", { name: "other account query", exact: true })
  ).toBeHidden()
  await input.fill(keyword)
  const result = page.getByRole("option").filter({ hasText: title })
  await expect(result).toBeVisible()
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), ownKey)
  ).toBeNull()
  await result.click()
  await expect(page).toHaveURL("/products")
  expect(
    await page.evaluate(
      (key) => JSON.parse(sessionStorage.getItem(key) ?? "[]"),
      ownKey
    )
  ).toEqual([keyword])
  expect(
    await page.evaluate((key) => localStorage.getItem(key), ownKey)
  ).toBeNull()
  await clickUntilHydrated(input, () =>
    expect(input).toHaveAttribute("aria-expanded", "true")
  )
  await expect(
    page
      .getByRole("region", { name: "Recent searches", exact: true })
      .getByRole("button", { name: keyword, exact: true })
  ).toBeVisible()
  await input.press("Escape")
  const userMenu = page.getByRole("button").filter({ hasText: staff.email })
  const logout = page.getByRole("menuitem", { name: "Log out", exact: true })
  await clickUntilHydrated(userMenu, () => expect(logout).toBeVisible())
  const dialog = page.getByRole("alertdialog", {
    name: "Log out?",
    exact: true,
  })
  await clickUntilHydrated(logout, () => expect(dialog).toBeVisible())
  await clickUntilHydrated(
    dialog.getByRole("button", { name: "Log out", exact: true }),
    () => expect(page).toHaveURL("/login")
  )
  expect(
    await page.evaluate(
      (prefix) =>
        Object.keys(sessionStorage).filter((key) => key.startsWith(prefix)),
      ADMIN_RECENT_SEARCH_PREFIX
    )
  ).toEqual([])
})
