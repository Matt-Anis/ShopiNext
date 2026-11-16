import { expect, test } from "@playwright/test"
import type { AdminSearchPreview, SearchResponse } from "@repo/search/contracts"
import { seedAdmin } from "../../utils/seed-user"
import { signIn } from "../../utils/auth"
import { clickUntilHydrated } from "../../utils/interaction"
import { uniqueSuffix } from "../../utils/unique"

function productResponse(
  query: string,
  title: string
): SearchResponse<AdminSearchPreview> {
  return {
    query,
    groups: [
      {
        type: "product",
        results: [
          {
            type: "product",
            id: `preview-${title}`,
            title,
            href: "/products",
            slug: "preview",
            thumbnailUrl: null,
            categoryNames: [],
            status: "draft",
            isActive: true,
            excerpt: {
              source: "description",
              segments: [{ text: "<svg onload=alert(1)>", matched: true }],
            },
          },
        ],
      },
    ],
  }
}

test("admin search stays centered, skips short input, and supports keyboard navigation", async ({
  page,
}) => {
  test.slow()
  const suffix = uniqueSuffix()
  const title = `Search preview ${suffix}`
  const requests: string[] = []
  const staff = await seedAdmin({
    name: `Search staff ${suffix}`,
    role: "staff",
  })
  await page.route("**/api/search?*", async (route) => {
    const query = new URL(route.request().url()).searchParams.get("q") ?? ""
    requests.push(query)
    await route.fulfill({ json: productResponse(query, title) })
  })
  await signIn(page, staff)
  const trigger = page.getByRole("button", {
    name: "Search admin",
    exact: true,
  })
  const header = page.locator("header").filter({ has: trigger })
  const headerBox = await header.boundingBox()
  const triggerBox = await trigger.boundingBox()
  expect(headerBox).not.toBeNull()
  expect(triggerBox).not.toBeNull()
  expect(
    Math.abs(
      headerBox!.x +
        headerBox!.width / 2 -
        triggerBox!.x -
        triggerBox!.width / 2
    )
  ).toBeLessThan(2)

  const input = page.getByRole("combobox", {
    name: "Search admin",
    exact: true,
  })
  await clickUntilHydrated(trigger, () => expect(input).toBeVisible())
  await input.fill("s")
  await input.fill("shirt")
  const option = page.getByRole("option").filter({ hasText: title })
  await expect(option).toBeVisible()
  expect(requests).toEqual(["shirt"])
  await expect(option.getByText("<svg onload=alert(1)>")).toBeVisible()
  await expect(option.locator("svg[onload]")).toBeHidden()
  await input.press("Escape")
  await expect(input).toBeHidden()
  await expect(trigger).toBeFocused()

  await clickUntilHydrated(trigger, () => expect(input).toBeVisible())
  await input.fill("shirt")
  await expect(option).toBeVisible()
  await input.press("ArrowDown")
  await expect(option).toHaveAttribute("data-highlighted", "")
  await input.press("Enter")
  await expect(page).toHaveURL("/products")
  await expect(input).toBeHidden()
})

test("mobile search uses a dialog and recovers from a search failure", async ({
  page,
}) => {
  test.slow()
  await page.setViewportSize({ width: 390, height: 844 })
  const suffix = uniqueSuffix()
  const title = `Mobile search preview ${suffix}`
  const staff = await seedAdmin({
    name: `Mobile search staff ${suffix}`,
    role: "staff",
  })
  let attempts = 0
  await page.route("**/api/search?*", async (route) => {
    attempts += 1
    await route.fulfill(
      attempts === 1
        ? { status: 503, json: { error: "Search is unavailable." } }
        : { json: productResponse("shirt", title) }
    )
  })
  await signIn(page, staff)
  const trigger = page.getByRole("button", {
    name: "Search admin",
    exact: true,
  })
  const dialog = page.getByRole("dialog", { name: "Search", exact: true })
  await clickUntilHydrated(trigger, () => expect(dialog).toBeVisible())
  await dialog
    .getByRole("combobox", { name: "Search admin", exact: true })
    .fill("shirt")
  await expect(
    dialog.getByText("Search is unavailable. Please try again.")
  ).toBeVisible()
  await dialog.getByRole("button", { name: "Try again", exact: true }).click()
  await expect(
    dialog.getByRole("option").filter({ hasText: title })
  ).toBeVisible()
  await dialog.getByRole("button", { name: "Close", exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})
