import { expect, test } from "@playwright/test"
import { PUBLIC_RECENT_SEARCH_KEY } from "@repo/search/browser"
import { clickUntilHydrated } from "../../utils/interaction"
import { uniqueSuffix } from "../../utils/unique"

test("history saves committed keywords, persists, reruns fresh searches, and can be removed", async ({
  page,
}) => {
  const keyword = `shirts ${uniqueSuffix()}`
  const secondKeyword = `shoes ${uniqueSuffix()}`
  const requests: string[] = []
  await page.route("**/__search-test/multi-search", async (route) => {
    const payload = route.request().postDataJSON() as {
      queries: { q: string }[]
    }
    requests.push(payload.queries[0]?.q ?? "")
    await route.fulfill({
      json: {
        results: [
          { indexUid: "public_products", hits: [] },
          { indexUid: "public_categories", hits: [] },
        ],
      },
    })
  })
  await page.goto("/")
  const trigger = page.getByRole("button", {
    name: "Search products and categories",
    exact: true,
  })
  const input = page.getByRole("combobox", {
    name: "Search products and categories",
    exact: true,
  })
  await clickUntilHydrated(trigger, () => expect(input).toBeVisible())
  await input.fill(keyword)
  await expect(
    page.getByText(`No results for “${keyword}”.`, { exact: true })
  ).toBeVisible()
  expect(
    await page.evaluate(
      (key) => localStorage.getItem(key),
      PUBLIC_RECENT_SEARCH_KEY
    )
  ).toBeNull()
  await input.press("Enter")
  await expect
    .poll(() =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key) ?? "[]"),
        PUBLIC_RECENT_SEARCH_KEY
      )
    )
    .toEqual([keyword])
  await page.reload()
  await clickUntilHydrated(trigger, () => expect(input).toBeVisible())
  const recent = page.getByRole("region", {
    name: "Recent searches",
    exact: true,
  })
  await recent.getByRole("button", { name: keyword, exact: true }).click()
  await expect(input).toHaveValue(keyword)
  await expect
    .poll(() => requests.filter((query) => query === keyword).length)
    .toBe(2)
  await input.press("Escape")
  await clickUntilHydrated(trigger, () => expect(input).toBeVisible())
  await recent
    .getByRole("button", {
      name: `Remove ${keyword} from recent searches`,
      exact: true,
    })
    .click()
  await expect(
    recent.getByRole("button", { name: keyword, exact: true })
  ).toBeHidden()
  await expect(input).toBeFocused()
  await input.fill(secondKeyword)
  await input.press("Enter")
  await input.press("Escape")
  await clickUntilHydrated(trigger, () => expect(input).toBeVisible())
  await recent.getByRole("button", { name: "Clear all", exact: true }).click()
  await expect(recent).toBeHidden()
  expect(
    await page.evaluate(
      (key) => localStorage.getItem(key),
      PUBLIC_RECENT_SEARCH_KEY
    )
  ).toBeNull()
})
