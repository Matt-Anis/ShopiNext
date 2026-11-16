import { expect, test } from "@playwright/test"
import { clickUntilHydrated } from "../../utils/interaction"
import {
  expectCenteredInViewport,
  expectHorizontalOrder,
} from "../../utils/layout"
import { uniqueSuffix } from "../../utils/unique"

test("superseded requests are canceled and cannot replace the newer results", async ({
  page,
}) => {
  const suffix = uniqueSuffix()
  const olderQuery = `shirt ${suffix}`
  const newerQuery = `shoes ${suffix}`
  const olderTitle = `Older preview ${suffix}`
  const newerTitle = `Newer preview ${suffix}`
  let firstStarted = false
  let releaseFirst!: () => void
  const gate = new Promise<void>((resolve) => {
    releaseFirst = resolve
  })
  await page.route("**/__search-test/multi-search", async (route) => {
    const payload = route.request().postDataJSON() as {
      queries: { q: string }[]
    }
    const older = payload.queries[0]?.q === olderQuery
    if (older) {
      firstStarted = true
      await gate
    }
    try {
      await route.fulfill({
        json: {
          results: [
            {
              indexUid: "public_products",
              hits: [
                {
                  id: older ? "older" : "newer",
                  name: older ? olderTitle : newerTitle,
                  slug: "preview",
                  description: "",
                  thumbnailUrl: null,
                  categoryNames: [],
                },
              ],
            },
            { indexUid: "public_categories", hits: [] },
          ],
        },
      })
    } catch (error) {
      if (!route.request().failure()) throw error
    }
  })
  try {
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
    await input.fill(olderQuery)
    await expect.poll(() => firstStarted).toBe(true)
    const canceled = page.waitForEvent(
      "requestfailed",
      (request) =>
        request.url().includes("/__search-test/multi-search") &&
        (request.postDataJSON() as { queries: { q: string }[] }).queries[0]
          ?.q === olderQuery
    )
    await input.fill(newerQuery)
    await canceled
    await expect(
      page.getByRole("option").filter({ hasText: newerTitle })
    ).toBeVisible()
    releaseFirst()
    await expect(
      page.getByRole("option").filter({ hasText: olderTitle })
    ).toBeHidden()
    await expect(input).toHaveValue(newerQuery)
  } finally {
    releaseFirst()
  }
})

test("desktop search sits left of navigation and queries only public indexes", async ({
  page,
}) => {
  const title = `Public search preview ${uniqueSuffix()}`
  const requests: {
    queries: { indexUid: string; q: string; limit: number }[]
  }[] = []
  await page.route("**/__search-test/multi-search", async (route) => {
    requests.push(route.request().postDataJSON())
    await route.fulfill({
      json: {
        results: [
          {
            indexUid: "public_products",
            hits: [
              {
                id: "preview",
                name: title,
                slug: "preview",
                description: "A shirt",
                thumbnailUrl: null,
                categoryNames: [],
              },
            ],
          },
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
  await expectHorizontalOrder([
    page.getByRole("link", { name: "ShopiNext home", exact: true }),
    trigger,
    page.getByRole("navigation", { name: "Store", exact: true }),
  ])
  const input = page.getByRole("combobox", {
    name: "Search products and categories",
    exact: true,
  })
  await clickUntilHydrated(trigger, () => expect(input).toBeVisible())
  await input.fill("s")
  await input.fill("shirt")
  await expect(
    page.getByRole("option").filter({ hasText: title })
  ).toBeVisible()
  expect(requests).toEqual([
    {
      queries: [
        expect.objectContaining({
          indexUid: "public_products",
          q: "shirt",
          limit: 5,
        }),
        expect.objectContaining({
          indexUid: "public_categories",
          q: "shirt",
          limit: 5,
        }),
      ],
    },
  ])
  await input.press("Escape")
  await expect(input).toBeHidden()
  await expect(trigger).toBeFocused()
})

test("mobile search is centered, leaves content below the header, and opens an overlay", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const title = `Mobile category preview ${uniqueSuffix()}`
  await page.route("**/__search-test/multi-search", async (route) => {
    await route.fulfill({
      json: {
        results: [
          { indexUid: "public_products", hits: [] },
          {
            indexUid: "public_categories",
            hits: [
              {
                id: "category-preview",
                name: title,
                slug: "category-preview",
                description: "",
              },
            ],
          },
        ],
      },
    })
  })
  await page.goto("/")
  const trigger = page.getByRole("button", {
    name: "Search products and categories",
    exact: true,
  })
  await expectCenteredInViewport(trigger)
  const header = page.locator("header").filter({ has: trigger })
  const bounds = await header.boundingBox()
  expect(bounds).not.toBeNull()
  const contentTop = await page
    .getByRole("main")
    .evaluate(
      (element) =>
        element.getBoundingClientRect().top +
        parseFloat(getComputedStyle(element).paddingTop)
    )
  expect(contentTop).toBeGreaterThanOrEqual(bounds!.y + bounds!.height - 1)
  await expect(
    page.getByRole("button", { name: "Open navigation", exact: true })
  ).toBeVisible()
  const dialog = page.getByRole("dialog", { name: "Search", exact: true })
  await clickUntilHydrated(trigger, () => expect(dialog).toBeVisible())
  await dialog
    .getByRole("combobox", {
      name: "Search products and categories",
      exact: true,
    })
    .fill("clothes")
  await expect(
    dialog.getByRole("option").filter({ hasText: title })
  ).toBeVisible()
  await dialog.getByRole("button", { name: "Close", exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})
