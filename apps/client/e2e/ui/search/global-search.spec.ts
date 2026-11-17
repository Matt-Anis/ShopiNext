import { expect, test } from "@playwright/test"
import { clickUntilHydrated } from "../../utils/interaction"
import { expectHorizontalOrder } from "../../utils/layout"
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
    const input = page.getByRole("combobox", {
      name: "Search products and categories",
      exact: true,
    })
    await clickUntilHydrated(input, () =>
      expect(input).toHaveAttribute("aria-expanded", "true")
    )
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

test("desktop search sits right of navigation and shows results below its input", async ({
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
  const header = page.getByRole("banner")
  const input = header.getByRole("combobox", {
    name: "Search products and categories",
    exact: true,
  })
  await expectHorizontalOrder([
    header.getByRole("link", { name: "ShopiNext home", exact: true }),
    header.getByRole("navigation", { name: "Store", exact: true }),
    input,
    header.getByRole("button", { name: "Open cart", exact: true }),
  ])
  await clickUntilHydrated(input, () =>
    expect(input).toHaveAttribute("aria-expanded", "true")
  )
  await input.fill("s")
  await input.fill("shirt")
  const option = page.getByRole("option").filter({ hasText: title })
  await expect(option).toBeVisible()
  await expect(input).toBeFocused()
  await expect(
    page.locator('[data-slot="search-popup"]').locator("input")
  ).toBeHidden()
  const inputBox = await input.boundingBox()
  const resultBox = await option.boundingBox()
  expect(inputBox).not.toBeNull()
  expect(resultBox).not.toBeNull()
  expect(resultBox!.y).toBeGreaterThanOrEqual(inputBox!.y + inputBox!.height)
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
  await expect(input).toHaveAttribute("aria-expanded", "false")
  await expect(input).toBeFocused()
})

test("mobile search uses a ghost icon and shows results below one drawer input", async ({
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
  await expect(trigger).toHaveText("")
  const header = page.getByRole("banner")
  await expectHorizontalOrder([
    header.getByRole("link", { name: "ShopiNext home", exact: true }),
    trigger,
    header.getByRole("button", { name: "Open cart", exact: true }),
  ])
  await expect(header.getByRole("combobox")).toBeHidden()
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
  const input = dialog.getByRole("combobox", {
    name: "Search products and categories",
    exact: true,
  })
  await expect(input).toBeFocused()
  await input.fill("clothes")
  await expect(
    dialog.getByRole("option").filter({ hasText: title })
  ).toBeVisible()
  await expect(dialog.locator('[data-slot="search-popup"]')).toBeHidden()
  await dialog.getByRole("button", { name: "Close", exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})
