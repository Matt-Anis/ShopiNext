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
  const input = page.getByRole("combobox", {
    name: "Search admin",
    exact: true,
  })
  const header = page.locator("header").filter({ has: input })
  const headerBox = await header.boundingBox()
  const inputBox = await input.boundingBox()
  expect(headerBox).not.toBeNull()
  expect(inputBox).not.toBeNull()
  expect(
    Math.abs(
      headerBox!.x + headerBox!.width / 2 - inputBox!.x - inputBox!.width / 2
    )
  ).toBeLessThan(2)

  await clickUntilHydrated(input, () =>
    expect(input).toHaveAttribute("aria-expanded", "true")
  )
  await input.fill("s")
  await input.fill("shirt")
  const option = page.getByRole("option").filter({ hasText: title })
  await expect(option).toBeVisible()
  expect(requests).toEqual(["shirt"])
  await expect(option.getByText("<svg onload=alert(1)>")).toBeVisible()
  await expect(option.locator("svg[onload]")).toBeHidden()
  await input.press("Escape")
  await expect(input).toHaveAttribute("aria-expanded", "false")
  await expect(input).toBeFocused()

  await clickUntilHydrated(input, () =>
    expect(input).toHaveAttribute("aria-expanded", "true")
  )
  await input.fill("shirt")
  await expect(option).toBeVisible()
  await input.press("ArrowDown")
  await expect(option).toHaveAttribute("data-highlighted", "")
  await input.press("Enter")
  await expect(page).toHaveURL("/products")
  await expect(input).toBeVisible()
  await expect(input).toHaveAttribute("aria-expanded", "false")
})

test("mobile search shows results below one input and recovers from failure", async ({
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
  const input = page.getByRole("combobox", {
    name: "Search admin",
    exact: true,
  })
  await clickUntilHydrated(input, () =>
    expect(input).toHaveAttribute("aria-expanded", "true")
  )
  await input.fill("shirt")
  await expect(
    page.getByText("Search is unavailable. Please try again.")
  ).toBeVisible()
  await page.getByRole("button", { name: "Try again", exact: true }).click()
  const option = page.getByRole("option").filter({ hasText: title })
  await expect(option).toBeVisible()
  const inputBox = await input.boundingBox()
  const resultBox = await option.boundingBox()
  expect(inputBox).not.toBeNull()
  expect(resultBox).not.toBeNull()
  expect(resultBox!.y).toBeGreaterThanOrEqual(inputBox!.y + inputBox!.height)
  await expect(
    page.getByRole("dialog", { name: "Search", exact: true })
  ).toBeHidden()
  await input.press("Escape")
  await expect(input).toHaveAttribute("aria-expanded", "false")
  await expect(input).toBeFocused()
})
